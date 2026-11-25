import { and, count, desc, eq, type SQL } from 'drizzle-orm';
import { getDb, products, restaurants, reviews, users } from '@/db';
import { requireRole } from '@/lib/auth';
import { handler } from '@/lib/http';
import { pageOf, paginated } from '@/lib/pagination';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = handler(async (req) => {
  await requireRole(req, 'admin');
  const { page, perPage, offset } = pageOf(req, 20);
  const status = new URL(req.url).searchParams.get('status');
  const conds: SQL[] = [];
  if (status === 'pending') conds.push(eq(reviews.isApproved, false));
  if (status === 'approved') conds.push(eq(reviews.isApproved, true));
  const where = conds.length ? and(...conds) : undefined;
  const db = getDb();
  const [rows, [total]] = await Promise.all([
    db.select({ r: reviews, u: { id: users.id, name: users.name }, p: { id: products.id, name: products.name }, rs: { id: restaurants.id, name: restaurants.name } })
      .from(reviews).leftJoin(users, eq(reviews.userId, users.id)).leftJoin(products, eq(reviews.productId, products.id)).leftJoin(restaurants, eq(reviews.restaurantId, restaurants.id))
      .where(where).orderBy(desc(reviews.id)).limit(perPage).offset(offset),
    db.select({ n: count() }).from(reviews).where(where),
  ]);
  return Response.json(paginated(rows.map(({ r, u, p, rs }) => ({
    id: r.id, user_id: r.userId, restaurant_id: r.restaurantId, product_id: r.productId, order_id: r.orderId,
    rating: r.rating, comment: r.comment, images: r.images ?? [], is_approved: r.isApproved, created_at: r.createdAt.toISOString(),
    user: u, product: p, restaurant: rs,
  })), total?.n ?? 0, page, perPage));
});
