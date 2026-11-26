import { env } from '@/lib/env';

export const runtime = 'nodejs';

// سازگار با کلاینت‌های فعلی که آدرس تصویر را `${BASE}/storage/${path}` می‌سازند: به آدرس عمومی S3 ریدایرکت می‌کند
export async function GET(_req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const key = path.join('/');
  const pub = env().S3_PUBLIC_URL;
  if (!pub || key.includes('..') || !/^[\w\-./]+$/.test(key)) return new Response('Not found', { status: 404 });
  return new Response(null, {
    status: 302,
    headers: { Location: `${pub.replace(/\/$/, '')}/${key}`, 'Cache-Control': 'public, max-age=86400' },
  });
}
