import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import { handler, parseId, readJson, type IdCtx } from '@/lib/http';
import { appBase, startPayment } from '@/lib/payment/service';
import { rateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const schema = z.object({ gateway: z.enum(['zarinpal', 'mellat'], { message: 'درگاه نامعتبر است' }) });

export const POST = handler<IdCtx>(async (req, ctx) => {
  const { user } = await requireAuth(req);
  const orderId = parseId((await ctx.params).id);
  await rateLimit(`pay:${user.id}`, 20, 3600);
  const { gateway } = schema.parse(await readJson(req));
  const redirectUrl = await startPayment({ userId: user.id, orderId, gateway, base: appBase(req) });
  return Response.json({ redirect_url: redirectUrl });
});
