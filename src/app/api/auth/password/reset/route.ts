import { eq } from 'drizzle-orm';
import { getDb, users } from '@/db';
import { hashPassword } from '@/lib/crypto';
import { handler, HttpError, readJson, clientIp } from '@/lib/http';
import { verifyOtp } from '@/lib/otp';
import { rateLimit } from '@/lib/rate-limit';
import { revokeAllForUser } from '@/lib/tokens';
import { findUserByIdentifier } from '@/lib/users';
import { resetSchema } from '@/lib/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = handler(async (req) => {
  await rateLimit(`ip:reset:${clientIp(req)}`, 20, 3600);
  const { ident, code, password } = resetSchema.parse(await readJson(req));
  await verifyOtp(ident, 'reset', code);

  const found = await findUserByIdentifier(ident);
  if (!found) throw new HttpError(400, 'کد تایید نادرست یا منقضی شده است');

  const now = new Date();
  await getDb()
    .update(users)
    .set({
      passwordHash: await hashPassword(password),
      failedLogins: 0,
      lockedUntil: null,
      ...(ident.type === 'phone' ? { phoneVerifiedAt: found.user.phoneVerifiedAt ?? now } : { emailVerifiedAt: found.user.emailVerifiedAt ?? now }),
      updatedAt: now,
    })
    .where(eq(users.id, found.user.id));
  await revokeAllForUser(found.user.id); // همه‌ی نشست‌های قبلی باطل
  return Response.json({ message: 'رمز عبور تغییر کرد؛ وارد شوید' });
});
