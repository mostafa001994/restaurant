import { asc, desc, eq, type SQL } from 'drizzle-orm';
import { getDb, orders, restaurants, users } from '@/db';
import { serializeOrder } from '../serialize';

/** سبک‌ترین لیست سفارش‌ها برای داشبورد (با نام کاربر/رستوران) */
export async function dashboardOrders(opts: { where?: SQL; limit?: number; oldestFirst?: boolean; withPhone?: boolean }) {
  const rows = await getDb()
    .select({ o: orders, u: { id: users.id, name: users.name, phone: users.phone }, r: { id: restaurants.id, name: restaurants.name, address: restaurants.address } })
    .from(orders).leftJoin(users, eq(orders.userId, users.id)).leftJoin(restaurants, eq(orders.restaurantId, restaurants.id))
    .where(opts.where)
    .orderBy(opts.oldestFirst ? asc(orders.createdAt) : desc(orders.createdAt), opts.oldestFirst ? asc(orders.id) : desc(orders.id))
    .limit(opts.limit ?? 50);
  return rows.map(({ o, u, r }) => ({
    ...serializeOrder(o, r ? { id: r.id, name: r.name } : null, []),
    user: u ? (opts.withPhone ? u : { id: u.id, name: u.name }) : null,
    restaurant: r ? { id: r.id, name: r.name, address: r.address } : null,
  }));
}
