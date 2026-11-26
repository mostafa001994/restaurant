import { eq } from 'drizzle-orm';
import { orders } from '@/db';
import { requireAuth } from '@/lib/auth';
import { handler, HttpError, parseId, type IdCtx } from '@/lib/http';
import { loadOrders } from '@/lib/orders';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = handler<IdCtx>(async (req, ctx) => {
  const { user } = await requireAuth(req);
  const [order] = await loadOrders(eq(orders.id, parseId((await ctx.params).id)), { limit: 1 });
  if (!order) throw new HttpError(404, 'سفارش یافت نشد');
  if (order.user_id !== user.id) throw new HttpError(403, 'دسترسی غیرمجاز');
  return Response.json(order);
});
