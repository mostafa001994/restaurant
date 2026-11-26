import { eq, sql } from 'drizzle-orm';
import { getDb, users } from '@/db';
import { dummyVerify, verifyPassword } from '@/lib/crypto';
import { handler, HttpError, readJson, clientIp } from '@/lib/http';
import { rateLimit } from '@/lib/rate-limit';
import { respondWithSession } from '@/lib/session';
import { findUserByIdentifier } from '@/lib/users';
import { loginSchema } from '@/lib/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_FAILS = 5;
const LOCK_MINUTES = 15;
const BAD = () => new HttpError(401, 'شناسه یا رمز عبور نادرست است');

export const POST = handler(async (req) => {
  await rateLimit(`ip:login:${clientIp(req)}`, 30, 600);
  const { ident, password } = loginSchema.parse(await readJson(req));
  await rateLimit(`login:${ident.value}`, 15, 900);

  const db = getDb();
  const found = await findUserByIdentifier(ident);
  const verified = found && (ident.type === 'phone' ? found.user.phoneVerifiedAt : found.user.emailVerifiedAt);

  if (!found || !found.user.passwordHash || !verified) {
    await dummyVerify(password); // زمان پاسخ یکسان
    throw BAD();
  }
  if (found.user.lockedUntil && found.user.lockedUntil > new Date()) {
    throw new HttpError(429, 'به‌دلیل تلاش‌های ناموفق زیاد، ورود موقتاً مسدود است');
  }

  if (!(await verifyPassword(password, found.user.passwordHash))) {
    await db
      .update(users)
      .set({
        failedLogins: sql`${users.failedLogins} + 1`,
        lockedUntil: sql`CASE WHEN ${users.failedLogins} + 1 >= ${MAX_FAILS} THEN now() + interval '${sql.raw(String(LOCK_MINUTES))} minutes' ELSE ${users.lockedUntil} END`,
      })
      .where(eq(users.id, found.user.id));
    throw BAD();
  }

  await db.update(users).set({ failedLogins: 0, lockedUntil: null, lastLoginAt: new Date() }).where(eq(users.id, found.user.id));
  return respondWithSession(req, found);
});
