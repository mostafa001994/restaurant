import { eq } from 'drizzle-orm';
import { getDb, orders } from '@/db';
import { requireRole } from '@/lib/auth';
import { parseBody } from '@/lib/body';
import { handler, HttpError, parseId, type IdCtx } from '@/lib/http';
import { loadOrders } from '@/lib/orders';
import { orderStatus } from '@/lib/admin/schemas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const PATCH = handler<IdCtx>(async (req, ctx) => {
  await requireRole(req, 'admin');
  const id = parseId((await ctx.params).id);
  const { status } = orderStatus.parse((await parseBody(req)).fields);
  const [row] = await getDb().update(orders).set({ status, updatedAt: new Date() }).where(eq(orders.id, id)).returning({ id: orders.id });
  if (!row) throw new HttpError(404, 'سفارش یافت نشد');
  const [order] = await loadOrders(eq(orders.id, id), { limit: 1 });
  return Response.json(order);
});
