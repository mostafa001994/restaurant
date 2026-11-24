import { and, desc, eq, gt, isNull, sql } from 'drizzle-orm';
import { getDb, otpCodes } from '@/db';
import { generateOtp, hmac, safeEqualHex } from './crypto';
import { HttpError } from './http';
import type { Identifier } from './phone';
import { rateLimit } from './rate-limit';
import { sendOtp } from './sms';

export const OTP_TTL_SECONDS = 120;
export const OTP_RESEND_SECONDS = 60;
const MAX_ATTEMPTS = 5;

export type OtpPurpose = 'auth' | 'reset';

const digest = (purpose: OtpPurpose, id: Identifier, code: string) => hmac(`${purpose}:${id.value}:${code}`);

/** صدور کد جدید (کد قبلی باطل می‌شود). payload فقط پس از تایید کد اعمال می‌شود. */
export async function issueOtp(id: Identifier, purpose: OtpPurpose, payload?: string): Promise<void> {
  await rateLimit(`otp-cd:${purpose}:${id.value}`, 1, OTP_RESEND_SECONDS); // کولداون ۶۰ ثانیه
  await rateLimit(`otp-hr:${purpose}:${id.value}`, 5, 3600); // سقف ساعتی

  const db = getDb();
  const now = new Date();
  await db
    .update(otpCodes)
    .set({ consumedAt: now })
    .where(and(eq(otpCodes.identifier, id.value), eq(otpCodes.purpose, purpose), isNull(otpCodes.consumedAt)));

  const code = generateOtp();
  const [row] = await db
    .insert(otpCodes)
    .values({
      identifier: id.value,
      purpose,
      codeHash: digest(purpose, id, code),
      payload: payload ?? null,
      expiresAt: new Date(now.getTime() + OTP_TTL_SECONDS * 1000),
    })
    .returning({ id: otpCodes.id });

  try {
    await sendOtp(id, code);
  } catch (e) {
    if (row) await db.delete(otpCodes).where(eq(otpCodes.id, row.id));
    throw e;
  }
}

const INVALID = () => new HttpError(400, 'کد تایید نادرست یا منقضی شده است');

/** بررسی کد؛ در صورت موفقیت کد اتمیک مصرف می‌شود و payload (اگر بود) برمی‌گردد. */
export async function verifyOtp(id: Identifier, purpose: OtpPurpose, code: string): Promise<string | null> {
  await rateLimit(`otp-vf:${purpose}:${id.value}`, 10, 600);

  const db = getDb();
  const now = new Date();
  const [row] = await db
    .select()
    .from(otpCodes)
    .where(
      and(
        eq(otpCodes.identifier, id.value),
        eq(otpCodes.purpose, purpose),
        isNull(otpCodes.consumedAt),
        gt(otpCodes.expiresAt, now),
      ),
    )
    .orderBy(desc(otpCodes.createdAt))
    .limit(1);
  if (!row) throw INVALID();

  // اول تعداد تلاش را (اتمیک) زیاد کن، بعد مقایسه کن؛ پس brute-force سقف ۵ تلاش دارد
  const [bumped] = await db
    .update(otpCodes)
    .set({ attempts: sql`${otpCodes.attempts} + 1` })
    .where(and(eq(otpCodes.id, row.id), isNull(otpCodes.consumedAt)))
    .returning({ attempts: otpCodes.attempts });
  if (!bumped) throw INVALID();
  if (bumped.attempts > MAX_ATTEMPTS) {
    await db.update(otpCodes).set({ consumedAt: now }).where(eq(otpCodes.id, row.id));
    throw new HttpError(429, 'تعداد تلاش‌ها بیش از حد مجاز است؛ کد جدید دریافت کنید');
  }

  if (!safeEqualHex(row.codeHash, digest(purpose, id, code))) throw INVALID();

  const [consumed] = await db
    .update(otpCodes)
    .set({ consumedAt: now })
    .where(and(eq(otpCodes.id, row.id), isNull(otpCodes.consumedAt), gt(otpCodes.expiresAt, now)))
    .returning({ id: otpCodes.id });
  if (!consumed) throw INVALID();

  return row.payload;
}
