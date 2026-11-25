import { z } from 'zod';
import { HttpError } from './http';

export type Parsed = { fields: Record<string, unknown>; files: Record<string, File> };

/** JSON یا multipart را (مثل Laravel) به {fields, files} تبدیل می‌کند؛ کلیدهای `name[]` آرایه می‌شوند. */
export async function parseBody(req: Request): Promise<Parsed> {
  const ct = (req.headers.get('content-type') ?? '').toLowerCase();
  if (ct.includes('application/json')) {
    let b: unknown;
    try { b = await req.json(); } catch { throw new HttpError(400, 'بدنه‌ی درخواست JSON معتبر نیست'); }
    if (!b || typeof b !== 'object' || Array.isArray(b)) throw new HttpError(400, 'بدنه‌ی درخواست نامعتبر است');
    return { fields: b as Record<string, unknown>, files: {} };
  }
  if (ct.includes('multipart/form-data') || ct.includes('application/x-www-form-urlencoded')) {
    const fd = await req.formData().catch(() => { throw new HttpError(400, 'فرم نامعتبر است (حجم کل درخواست حداکثر ~۴ مگابایت)'); });
    const fields: Record<string, unknown> = {};
    const files: Record<string, File> = {};
    for (const [rawKey, v] of fd) {
      if (typeof v !== 'string') { if (v.size > 0) files[rawKey] = v; continue; }
      if (rawKey.endsWith('[]')) {
        const k = rawKey.slice(0, -2);
        ((fields[k] ??= []) as string[]).push(v);
      } else fields[rawKey] = v;
    }
    return { fields, files };
  }
  throw new HttpError(415, 'Content-Type باید JSON یا multipart باشد');
}

/** override مثل لاراول: ‎?_method=PUT یا فیلد _method */
export function methodOverride(req: Request, fields: Record<string, unknown>): string | null {
  const m = new URL(req.url).searchParams.get('_method') ?? (typeof fields._method === 'string' ? fields._method : null);
  return m ? m.toUpperCase() : null;
}

// ── اسکیمای کمکی: فرم‌ها همه‌چیز را رشته می‌فرستند ──
export const boolish = z.preprocess((v) => {
  if (v === true || v === 1 || v === '1' || v === 'true' || v === 'on') return true;
  if (v === false || v === 0 || v === '0' || v === 'false' || v === 'off') return false;
  return v;
}, z.boolean());

const empty = (v: unknown) => (v === '' || v === undefined ? null : v);
export const numNull = z.preprocess(empty, z.coerce.number().nullable());
export const intNull = z.preprocess(empty, z.coerce.number().int().nullable());
export const textNull = (max: number) => z.preprocess(empty, z.string().trim().max(max).nullable());
export const hhmm = z.preprocess(empty, z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'ساعت با قالب HH:MM باشد').nullable());

/** فقط کلیدهای تعریف‌شده (undefined حذف می‌شود) تا PATCH/PUT جزئی فیلدهای دیگر را null نکند */
export function compact<T extends Record<string, unknown>>(o: T): Partial<T> {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as Partial<T>;
}

export const dec = (n: number | null | undefined) => (n == null ? null : String(n));
