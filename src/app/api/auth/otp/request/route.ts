import { handler, readJson, clientIp } from '@/lib/http';
import { issueOtp, OTP_RESEND_SECONDS, OTP_TTL_SECONDS } from '@/lib/otp';
import { rateLimit } from '@/lib/rate-limit';
import { requestOtpSchema } from '@/lib/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ورود/ثبت‌نام بدون رمز: برای شناسه‌ی جدید، حساب پس از تایید کد ساخته می‌شود (بدون افشای وجود حساب)
export const POST = handler(async (req) => {
  await rateLimit(`ip:otp:${clientIp(req)}`, 20, 3600);
  const { ident } = requestOtpSchema.parse(await readJson(req));
  await issueOtp(ident, 'auth');
  return Response.json({ message: 'کد تایید ارسال شد', expires_in: OTP_TTL_SECONDS, resend_in: OTP_RESEND_SECONDS });
});
