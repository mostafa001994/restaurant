import { sql } from 'drizzle-orm';
import { getDb } from '@/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const has = (k: string) => !!process.env[k]?.trim();

// عیب‌یابی استقرار: فقط true/false برمی‌گرداند، هیچ مقداری را فاش نمی‌کند
export async function GET() {
  const secret = process.env.AUTH_SECRET?.trim() ?? '';
  const env = {
    DATABASE_URL: has('DATABASE_URL'),
    AUTH_SECRET: !secret ? 'missing' : secret.length >= 32 ? 'ok' : 'too_short',
    APP_URL: has('APP_URL'),
    sms_kavenegar: has('KAVENEGAR_API_KEY'),
    email_resend: has('RESEND_API_KEY') && has('MAIL_FROM'),
    s3: has('S3_ENDPOINT') && has('S3_BUCKET') && has('S3_ACCESS_KEY') && has('S3_SECRET_KEY') && has('S3_PUBLIC_URL'),
  };

  let db: 'skipped' | 'unreachable' | 'tables_missing' | 'ok' = 'skipped';
  if (env.DATABASE_URL) {
    try {
      const r = await getDb().execute(sql`select to_regclass('public.users') as t`);
      db = (r.rows[0] as { t: string | null }).t ? 'ok' : 'tables_missing';
    } catch {
      db = 'unreachable';
    }
  }
  const healthy = env.DATABASE_URL && env.AUTH_SECRET === 'ok' && db === 'ok';
  return Response.json({ healthy, env, db }, { status: healthy ? 200 : 503 });
}
