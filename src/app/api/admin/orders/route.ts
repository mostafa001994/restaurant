import { count, desc, eq } from 'drizzle-orm';
import { getDb, orders, restaurants, users } from '@/db';
import { requireRole } from '@/lib/auth';
import { handler } from '@/lib/http';
import { pageOf, paginated } from '@/lib/pagination';
import { restaurantBrief, userBrief } from '@/lib/admin/serialize';
import { serializeOrder } from '@/lib/serialize';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = handler(async (req) => {
  await requireRole(req, 'admin');
  const { page, perPage, offset } = pageOf(req, 20);
  const db = getDb();
  const [rows, [total]] = await Promise.all([
    db.select({ o: orders, u: { id: users.id, name: users.name, email: users.email, phone: users.phone }, r: { id: restaurants.id, name: restaurants.name } })
      .from(orders).leftJoin(users, eq(orders.userId, users.id)).leftJoin(restaurants, eq(orders.restaurantId, restaurants.id))
      .orderBy(desc(orders.createdAt), desc(orders.id)).limit(perPage).offset(offset),
    db.select({ n: count() }).from(orders),
  ]);
  return Response.json(paginated(rows.map(({ o, u, r }) => ({ ...serializeOrder(o, restaurantBrief(r), []), user: userBrief(u) })), total?.n ?? 0, page, perPage));
});
