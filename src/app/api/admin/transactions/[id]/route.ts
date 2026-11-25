import { eq } from 'drizzle-orm';
import { getDb, restaurants, transactions, users } from '@/db';
import { requireRole } from '@/lib/auth';
import { handler, HttpError, parseId, type IdCtx } from '@/lib/http';
import { loadOrders } from '@/lib/orders';
import { orders } from '@/db';
import { serializeTransaction } from '@/lib/payment/serialize';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = handler<IdCtx>(async (req, ctx) => {
  await requireRole(req, 'admin');
  const id = parseId((await ctx.params).id);
  const [row] = await getDb()
    .select({ tx: transactions, user: { id: users.id, name: users.name, email: users.email, phone: users.phone }, restaurant: { id: restaurants.id, name: restaurants.name } })
    .from(transactions)
    .leftJoin(users, eq(transactions.userId, users.id))
    .leftJoin(restaurants, eq(transactions.restaurantId, restaurants.id))
    .where(eq(transactions.id, id))
    .limit(1);
  if (!row) throw new HttpError(404, 'تراکنش یافت نشد');
  const [order] = row.tx.orderId ? await loadOrders(eq(orders.id, row.tx.orderId), { limit: 1 }) : [];
  return Response.json({ ...serializeTransaction(row.tx), user: row.user, restaurant: row.restaurant, order: order ?? null });
});
