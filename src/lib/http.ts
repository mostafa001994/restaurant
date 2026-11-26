import { ZodError } from 'zod';

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public extra?: Record<string, unknown>,
    public headers?: Record<string, string>,
  ) {
    super(message);
  }
}

/** همه‌ی خطاها را به JSON یکدست (سازگار با لاراول: {message, errors}) تبدیل می‌کند. */
export function handler<C = unknown>(fn: (req: Request, ctx: C) => Promise<Response>) {
  return async (req: Request, ctx: C): Promise<Response> => {
    try {
      return await fn(req, ctx);
    } catch (e) {
      if (e instanceof HttpError) {
        return Response.json({ message: e.message, ...e.extra }, { status: e.status, headers: e.headers });
      }
      if (e instanceof ZodError) {
        const errors: Record<string, string[]> = {};
        for (const i of e.issues) (errors[i.path.join('.') || '_'] ??= []).push(i.message);
        return Response.json({ message: e.issues[0]?.message ?? 'داده‌ی ورودی نامعتبر است', errors }, { status: 422 });
      }
      const code = pgCode(e);
      if (code === '23505') return Response.json({ message: 'این مقدار قبلاً ثبت شده است' }, { status: 422 });
      if (code === '23503') return Response.json({ message: 'مرجع نامعتبر است یا رکورد به داده‌های دیگر وابسته است' }, { status: 422 });
      console.error('[api]', e);
      const detail = process.env.NODE_ENV !== 'production' && e instanceof Error ? { detail: e.message } : {};
      return Response.json({ message: 'خطای داخلی سرور', ...detail }, { status: 500 });
    }
  };
}

/** فقط application/json — درخواست‌های cross-site ساده (فرم HTML) رد می‌شوند. */
export async function readJson(req: Request): Promise<Record<string, unknown>> {
  const ct = (req.headers.get('content-type') ?? '').toLowerCase();
  if (!ct.includes('application/json')) throw new HttpError(415, 'Content-Type باید application/json باشد');
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new HttpError(400, 'بدنه‌ی درخواست JSON معتبر نیست');
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new HttpError(400, 'بدنه‌ی درخواست باید یک شیء JSON باشد');
  return body as Record<string, unknown>;
}

/** برای مسیرهایی که بدنه اختیاری است (refresh/logout با کوکی). */
export async function readJsonOptional(req: Request): Promise<Record<string, unknown>> {
  const ct = (req.headers.get('content-type') ?? '').toLowerCase();
  if (!ct.includes('application/json')) return {};
  try {
    const b = await req.json();
    return b && typeof b === 'object' && !Array.isArray(b) ? (b as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export function clientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for');
  return (xff?.split(',')[0] ?? req.headers.get('x-real-ip') ?? 'unknown').trim();
}

export function isWebClient(req: Request): boolean {
  return req.headers.get('x-client') === 'web';
}

export function parseCookies(req: Request): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of (req.headers.get('cookie') ?? '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

/** پارامتر عددی مسیر؛ نامعتبر = 404 */
export function parseId(v: string): number {
  const n = Number(v);
  if (!Number.isInteger(n) || n < 1 || n > 2_147_483_647) throw new HttpError(404, 'یافت نشد');
  return n;
}

export type IdCtx = { params: Promise<{ id: string }> };

/** کد خطای Postgres (Drizzle خطا را در cause می‌پیچد) */
function pgCode(e: unknown): string | undefined {
  const x = e as { code?: string; cause?: { code?: string } } | null;
  return x?.cause?.code ?? x?.code;
}
