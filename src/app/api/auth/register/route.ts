import { hashPassword } from '@/lib/crypto';
import { handler, readJson, clientIp } from '@/lib/http';
import { issueOtp, OTP_RESEND_SECONDS, OTP_TTL_SECONDS } from '@/lib/otp';
import { rateLimit } from '@/lib/rate-limit';
import { registerSchema } from '@/lib/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ثبت‌نام: هیچ حسابی تا تایید کد ساخته نمی‌شود؛ نام و هش رمز در ردیف OTP می‌ماند (جلوگیری از پیش‌دستی روی شماره‌ی دیگران)
export const POST = handler(async (req) => {
  await rateLimit(`ip:register:${clientIp(req)}`, 10, 3600);
  const { ident, name, password } = registerSchema.parse(await readJson(req));
  await issueOtp(ident, 'auth', JSON.stringify({ name, passwordHash: await hashPassword(password) }));
  return Response.json({ message: 'کد تایید ارسال شد', expires_in: OTP_TTL_SECONDS, resend_in: OTP_RESEND_SECONDS });
});
