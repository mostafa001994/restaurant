import { and, asc, desc, eq, inArray, type SQL } from 'drizzle-orm';
import { getDb, orderItems, orders, products, restaurants } from '@/db';
import { serializeOrder } from './serialize';

/** سفارش‌ها را با رستوران و آیتم‌ها (با نام غذا) بار می‌کند — ۳ کوئری، بدون N+1 */
export async function loadOrders(where: SQL | undefined, opts: { limit?: number } = {}) {
  const db = getDb();
  const rows = await db.select().from(orders).where(where).orderBy(desc(orders.createdAt), desc(orders.id)).limit(opts.limit ?? 50);
  if (!rows.length) return [];

  const ids = rows.map((o) => o.id);
  const rids = [...new Set(rows.map((o) => o.restaurantId))];
  const [rs, items] = await Promise.all([
    db.select({ id: restaurants.id, name: restaurants.name }).from(restaurants).where(inArray(restaurants.id, rids)),
    db
      .select({ item: orderItems, product: { id: products.id, name: products.name } })
      .from(orderItems)
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(inArray(orderItems.orderId, ids))
      .orderBy(asc(orderItems.id)),
  ]);

  return rows.map((o) =>
    serializeOrder(
      o,
      rs.find((r) => r.id === o.restaurantId) ?? null,
      items.filter((i) => i.item.orderId === o.id),
    ),
  );
}

export const orderOwnedBy = (orderId: number, userId: number) => and(eq(orders.id, orderId), eq(orders.userId, userId));
