import { handler, readJson, clientIp } from '@/lib/http';
import { verifyOtp } from '@/lib/otp';
import { rateLimit } from '@/lib/rate-limit';
import { respondWithSession } from '@/lib/session';
import { upsertVerifiedUser } from '@/lib/users';
import { verifyOtpSchema } from '@/lib/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = handler(async (req) => {
  await rateLimit(`ip:otp-verify:${clientIp(req)}`, 60, 3600);
  const raw = await readJson(req);
  if (raw.code === undefined && raw.otp !== undefined) raw.code = String(raw.otp); // سازگاری با نام قدیمی
  const { ident, code } = verifyOtpSchema.parse(raw);

  const payload = await verifyOtp(ident, 'auth', code);
  const extra = payload ? (JSON.parse(payload) as { name?: string; passwordHash?: string }) : {};
  const loaded = await upsertVerifiedUser(ident, extra);
  return respondWithSession(req, loaded);
});
