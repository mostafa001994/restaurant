import { clientIp, handler, parseId } from '@/lib/http';
import { appBase, handleCallback } from '@/lib/payment/service';
import { rateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ gateway: string; orderId: string }> };

// زرین‌پال با GET و بانک ملت با POST (فرم) برمی‌گردد
const run = handler<Ctx>(async (req, ctx) => {
  await rateLimit(`ip:pay-cb:${clientIp(req)}`, 60, 60);
  const { gateway, orderId } = await ctx.params;
  const params: Record<string, string> = Object.fromEntries(new URL(req.url).searchParams);
  if (req.method === 'POST' && (req.headers.get('content-type') ?? '').includes('application/x-www-form-urlencoded')) {
    for (const [k, v] of await req.formData()) if (typeof v === 'string') params[k] = v;
  }
  const location = await handleCallback({ gateway, orderId: parseId(orderId), params, base: appBase(req) });
  return new Response(null, { status: 303, headers: { Location: location } }); // 303: بعد از POST بانک، مرورگر GET می‌زند
});

export const GET = run;
export const POST = run;
