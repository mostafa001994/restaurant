import { env } from './env';
import { HttpError } from './http';
import type { Identifier } from './phone';

const TIMEOUT = 8000;

/** ارسال کد: پیامک (کاوه‌نگار) یا ایمیل (Resend). در dev بدون provider، کد در لاگ چاپ می‌شود. */
export async function sendOtp(to: Identifier, code: string): Promise<void> {
  const e = env();

  if (to.type === 'phone') {
    if (e.KAVENEGAR_API_KEY) {
      const res = await fetch(`https://api.kavenegar.com/v1/${e.KAVENEGAR_API_KEY}/verify/lookup.json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ receptor: to.value, token: code, template: e.KAVENEGAR_TEMPLATE }),
        signal: AbortSignal.timeout(TIMEOUT),
      }).catch(() => null);
      if (!res || !res.ok) throw new HttpError(502, 'ارسال پیامک ناموفق بود؛ دوباره تلاش کنید');
      return;
    }
  } else if (e.RESEND_API_KEY && e.MAIL_FROM) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${e.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: e.MAIL_FROM,
        to: to.value,
        subject: 'کد تایید',
        text: `کد تایید شما: ${code}\nاین کد تا ۲ دقیقه معتبر است.`,
      }),
      signal: AbortSignal.timeout(TIMEOUT),
    }).catch(() => null);
    if (!res || !res.ok) throw new HttpError(502, 'ارسال ایمیل ناموفق بود؛ دوباره تلاش کنید');
    return;
  }

  if (e.NODE_ENV === 'production') {
    throw new HttpError(503, 'سرویس ارسال کد پیکربندی نشده است');
  }
  console.log(`[DEV OTP] ${to.value} → ${code}`);
}
