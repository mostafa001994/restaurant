import { handler, readJson, clientIp } from '@/lib/http';
import { issueOtp, OTP_RESEND_SECONDS, OTP_TTL_SECONDS } from '@/lib/otp';
import { rateLimit } from '@/lib/rate-limit';
import { findUserByIdentifier } from '@/lib/users';
import { forgotSchema } from '@/lib/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// پاسخ همیشه یکسان است (جلوگیری از user enumeration)؛ فقط برای حساب موجود کد فرستاده می‌شود
export const POST = handler(async (req) => {
  await rateLimit(`ip:forgot:${clientIp(req)}`, 10, 3600);
  const { ident } = forgotSchema.parse(await readJson(req));
  const found = await findUserByIdentifier(ident);
  if (found) await issueOtp(ident, 'reset');
  return Response.json({ message: 'اگر حسابی با این مشخصات وجود داشته باشد، کد ارسال شد', expires_in: OTP_TTL_SECONDS, resend_in: OTP_RESEND_SECONDS });
});
