import { randomUUID } from 'node:crypto';
import { AwsClient } from 'aws4fetch';
import { env } from './env';
import { HttpError } from './http';

const MAX_BYTES = 4 * 1024 * 1024; // محدودیت بدنه‌ی تابع ورسل ~4.5MB
const TYPES: Record<string, { ext: string; magic: (b: Uint8Array) => boolean }> = {
  'image/jpeg': { ext: 'jpg', magic: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  'image/png': { ext: 'png', magic: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },
  'image/webp': { ext: 'webp', magic: (b) => b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 },
};

function client() {
  const e = env();
  if (!e.S3_ENDPOINT || !e.S3_BUCKET || !e.S3_ACCESS_KEY || !e.S3_SECRET_KEY) {
    throw new HttpError(503, 'ذخیره‌سازی فایل (S3) پیکربندی نشده است');
  }
  const aws = new AwsClient({ accessKeyId: e.S3_ACCESS_KEY, secretAccessKey: e.S3_SECRET_KEY, region: e.S3_REGION, service: 's3' });
  const base = `${e.S3_ENDPOINT.replace(/\/$/, '')}/${e.S3_BUCKET}`; // path-style
  return { aws, base };
}

/** تصویر را اعتبارسنجی (نوع واقعی با magic bytes، حجم) و آپلود می‌کند؛ کلید نسبی (مثل restaurants/logos/x.png) برمی‌گردد. */
export async function saveImage(file: File, folder: string): Promise<string> {
  const t = TYPES[file.type];
  if (!t) throw new HttpError(422, 'فقط تصویر JPG، PNG یا WEBP مجاز است');
  if (file.size > MAX_BYTES) throw new HttpError(422, 'حجم تصویر حداکثر ۴ مگابایت است');
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!t.magic(bytes)) throw new HttpError(422, 'فایل ارسالی تصویر معتبر نیست');

  const { aws, base } = client();
  const key = `${folder}/${randomUUID()}.${t.ext}`;
  const acl = env().S3_ACL;
  const res = await aws.fetch(`${base}/${key}`, {
    method: 'PUT',
    body: bytes,
    headers: { 'Content-Type': file.type, ...(acl ? { 'x-amz-acl': acl } : {}) },
    signal: AbortSignal.timeout(20_000),
  }).catch(() => null);
  if (!res || !res.ok) {
    console.error('[s3:put]', res?.status, await res?.text().catch(() => ''));
    throw new HttpError(502, 'آپلود تصویر ناموفق بود');
  }
  return key;
}

/** حذف بهترین‌تلاش (شکست آن نباید درخواست را خراب کند) */
export async function deleteImage(key: string | null | undefined): Promise<void> {
  if (!key || key.includes('..')) return;
  try {
    const { aws, base } = client();
    await aws.fetch(`${base}/${key}`, { method: 'DELETE', signal: AbortSignal.timeout(10_000) });
  } catch (e) {
    console.error('[s3:delete]', key, e);
  }
}
