import { and, desc, eq } from 'drizzle-orm';
import { getDb, products, reviews, users } from '@/db';
import { requireAuth } from '@/lib/auth';
import { handler, HttpError, parseId, readJson, type IdCtx } from '@/lib/http';
import { deliveredOrderFor } from '@/lib/reviews';
import { reviewSchema } from '@/lib/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = handler<IdCtx>(async (_req, ctx) => {
  const productId = parseId((await ctx.params).id);
  const rows = await getDb()
    .select({ id: reviews.id, rating: reviews.rating, comment: reviews.comment, createdAt: reviews.createdAt, userName: users.name })
    .from(reviews)
    .innerJoin(users, eq(reviews.userId, users.id))
    .where(and(eq(reviews.productId, productId), eq(reviews.isApproved, true)))
    .orderBy(desc(reviews.createdAt));
  const avg = rows.length ? rows.reduce((s, r) => s + r.rating, 0) / rows.length : 0;
  return Response.json({
    reviews: rows.map((r) => ({ id: r.id, rating: r.rating, comment: r.comment, created_at: r.createdAt.toISOString(), user: { name: r.userName } })),
    average_rating: Math.round(avg * 10) / 10,
    count: rows.length,
  });
});

export const POST = handler<IdCtx>(async (req, ctx) => {
  const { user } = await requireAuth(req);
  const productId = parseId((await ctx.params).id);
  const { rating, comment } = reviewSchema.parse(await readJson(req));
  const db = getDb();

  const [product] = await db.select({ id: products.id, restaurantId: products.restaurantId }).from(products).where(eq(products.id, productId)).limit(1);
  if (!product) throw new HttpError(404, 'غذا یافت نشد');

  const orderId = await deliveredOrderFor(user.id, productId);
  if (!orderId) throw new HttpError(403, 'فقط کاربرانی که این غذا را خریده و تحویل گرفته‌اند می‌توانند نظر ثبت کنند');

  // یکتایی (user, product) در DB تضمین شده؛ شرط رقابتی با onConflictDoNothing امن است
  const [row] = await db
    .insert(reviews)
    .values({ userId: user.id, restaurantId: product.restaurantId, productId, orderId, rating, comment, isApproved: false })
    .onConflictDoNothing()
    .returning({ id: reviews.id });
  if (!row) throw new HttpError(422, 'شما قبلاً برای این غذا نظر ثبت کرده‌اید');

  return Response.json({ message: 'نظر شما ثبت شد و بعد از تایید ادمین نمایش داده می‌شود', review: { id: row.id } }, { status: 201 });
});
