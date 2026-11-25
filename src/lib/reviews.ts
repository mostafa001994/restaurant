import { and, eq } from 'drizzle-orm';
import { getDb, orderItems, orders, reviews } from '@/db';

/** آخرین سفارش «تحویل‌شده»ی کاربر که شامل این غذاست (اثبات خرید) */
export async function deliveredOrderFor(userId: number, productId: number): Promise<number | null> {
  const [row] = await getDb()
    .select({ orderId: orders.id })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(and(eq(orderItems.productId, productId), eq(orders.userId, userId), eq(orders.status, 'delivered')))
    .limit(1);
  return row?.orderId ?? null;
}

export async function hasReviewed(userId: number, productId: number): Promise<boolean> {
  const [row] = await getDb().select({ id: reviews.id }).from(reviews).where(and(eq(reviews.userId, userId), eq(reviews.productId, productId))).limit(1);
  return !!row;
}
