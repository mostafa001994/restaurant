import { sql } from 'drizzle-orm';
import { getDb, rateLimits } from '@/db';
import { HttpError } from './http';

/**
 * Rate limit با پنجره‌ی ثابت، کاملاً اتمیک (یک upsert) و بدون Redis.
 * اگر از limit بگذرد، 429 با Retry-After برمی‌گرداند.
 */
export async function rateLimit(key: string, limit: number, windowSec: number): Promise<void> {
  const db = getDb();
  const now = new Date();
  const nowIso = now.toISOString();
  const resetAt = new Date(now.getTime() + windowSec * 1000);
  const resetIso = resetAt.toISOString();

  const [row] = await db
    .insert(rateLimits)
    .values({ key, count: 1, resetAt })
    .onConflictDoUpdate({
      target: rateLimits.key,
      set: {
        count: sql`CASE WHEN ${rateLimits.resetAt} <= ${nowIso}::timestamptz THEN 1 ELSE ${rateLimits.count} + 1 END`,
        resetAt: sql`CASE WHEN ${rateLimits.resetAt} <= ${nowIso}::timestamptz THEN ${resetIso}::timestamptz ELSE ${rateLimits.resetAt} END`,
      },
    })
    .returning({ count: rateLimits.count, resetAt: rateLimits.resetAt });

  // پاکسازی تصادفی ردیف‌های منقضی (بدون نیاز به cron)
  if (Math.random() < 0.01) {
    void db.delete(rateLimits).where(sql`${rateLimits.resetAt} < now() - interval '1 day'`).catch(() => {});
  }

  if (row && row.count > limit) {
    const retry = Math.max(1, Math.ceil((row.resetAt.getTime() - Date.now()) / 1000));
    throw new HttpError(429, 'تعداد درخواست‌ها زیاد است؛ کمی بعد دوباره تلاش کنید', { retry_after: retry }, { 'Retry-After': String(retry) });
  }
}
