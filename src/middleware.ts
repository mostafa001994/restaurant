import { NextResponse, type NextRequest } from 'next/server';

// CORS برای فرانت جدا (مثلاً پروژه‌ی دیگری روی ورسل). فقط originهای فهرست‌شده در CORS_ALLOWED_ORIGINS؛ احراز هویت با Bearer است، پس credentials لازم نیست.
const allowed = () =>
  (process.env.CORS_ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((s) => s.trim().replace(/\/$/, ''))
    .filter(Boolean);

const corsHeaders = (origin: string): Record<string, string> => ({
  'Access-Control-Allow-Origin': origin,
  'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization,Content-Type,Accept,X-Client',
  'Access-Control-Max-Age': '86400',
  Vary: 'Origin',
});

export function middleware(req: NextRequest) {
  const origin = req.headers.get('origin');
  const ok = !!origin && allowed().includes(origin);

  if (req.method === 'OPTIONS') return new NextResponse(null, { status: 204, headers: ok ? corsHeaders(origin) : { Vary: 'Origin' } });

  const res = NextResponse.next();
  if (ok) for (const [k, v] of Object.entries(corsHeaders(origin))) res.headers.set(k, v);
  return res;
}

export const config = { matcher: ['/api/:path*'] };
