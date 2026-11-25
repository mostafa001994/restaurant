import { eq } from 'drizzle-orm';
import { getDb, orders, users } from '@/db';
import { requireRole } from '@/lib/auth';
import { handler, HttpError, parseId, type IdCtx } from '@/lib/http';
import { loadOrders } from '@/lib/orders';
import { userBrief } from '@/lib/admin/serialize';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = handler<IdCtx>(async (req, ctx) => {
  await requireRole(req, 'admin');
  const [order] = await loadOrders(eq(orders.id, parseId((await ctx.params).id)), { limit: 1 });
  if (!order) throw new HttpError(404, 'سفارش یافت نشد');
  const [u] = order.user_id ? await getDb().select({ id: users.id, name: users.name, email: users.email, phone: users.phone }).from(users).where(eq(users.id, order.user_id)).limit(1) : [];
  return Response.json({ ...order, user: userBrief(u ?? null) });
});
