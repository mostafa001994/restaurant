import { eq, inArray, sql } from 'drizzle-orm';
import { getDb, productExtras, products, restaurants } from '@/db';
import { requireAuth } from '@/lib/auth';
import { handler, HttpError, readJson } from '@/lib/http';
import { loadOrders } from '@/lib/orders';
import { orders } from '@/db';
import { rateLimit } from '@/lib/rate-limit';
import { orderSchema } from '@/lib/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = handler(async (req) => {
  const { user } = await requireAuth(req);
  return Response.json({ data: await loadOrders(eq(orders.userId, user.id), { limit: 20 }) }); // شکل صفحه‌بندی لاراول
});

export const POST = handler(async (req) => {
  const { user } = await requireAuth(req);
  await rateLimit(`order:${user.id}`, 20, 3600);
  const d = orderSchema.parse(await readJson(req));
  const db = getDb();

  const [restaurant] = await db.select({ id: restaurants.id, status: restaurants.status, isOpen: restaurants.isOpen }).from(restaurants).where(eq(restaurants.id, d.restaurant_id)).limit(1);
  if (!restaurant || restaurant.status !== 'active') throw new HttpError(422, 'رستوران یافت نشد');
  if (!restaurant.isOpen) throw new HttpError(422, 'رستوران در حال حاضر بسته است');

  // قیمت‌ها همیشه از DB خوانده می‌شوند، نه از کلاینت
  const productIds = [...new Set(d.items.map((i) => i.product_id))];
  const prows = await db.select().from(products).where(inArray(products.id, productIds));
  const byId = new Map(prows.filter((p) => p.restaurantId === d.restaurant_id).map((p) => [p.id, p]));
  if (byId.size !== productIds.length) throw new HttpError(422, 'یک یا چند غذا متعلق به این رستوران نیستند');

  const extraRows = await db.select().from(productExtras).where(inArray(productExtras.productId, productIds));
  const extraById = new Map(extraRows.map((e) => [e.id, e]));

  let total = 0;
  const lines = d.items.map((line) => {
    const p = byId.get(line.product_id)!;
    if (!p.isAvailable || (p.stock !== null && p.stock < line.quantity)) throw new HttpError(422, `«${p.name}» در حال حاضر موجود نیست`);

    const price = Number(p.price);
    const pct = Number(p.discountPrice ?? 0);
    const unit = pct > 0 ? Math.round((price - (price * pct) / 100) * 100) / 100 : price;

    const selected = line.extras.map((x) => {
      const e = extraById.get(x.extra_id);
      if (!e || e.productId !== p.id || !e.isActive) throw new HttpError(422, 'یکی از مخلفات انتخاب‌شده معتبر نیست');
      return { extra_id: e.id, name: e.name, price: Number(e.price), quantity: x.quantity };
    });
    const lineTotal = unit * line.quantity + selected.reduce((s, e) => s + e.price * e.quantity, 0);
    total += lineTotal;
    return { product_id: p.id, quantity: line.quantity, unit_price: unit, total_price: lineTotal, selected_options: selected.length ? selected : null };
  });

  const deliveryFee = 0; // فعلاً ثابت؛ بعداً بر اساس فاصله
  const finalPrice = total + deliveryFee;

  // سفارش + آیتم‌ها در «یک» دستور SQL (اتمیک؛ درایور HTTP تراکنش تعاملی ندارد)
  const res = await db.execute(sql`
    WITH o AS (
      INSERT INTO orders (user_id, restaurant_id, total_price, delivery_fee, discount, final_price, status, payment_status, payment_method, delivery_address, delivery_lat, delivery_lng)
      VALUES (${user.id}, ${d.restaurant_id}, ${total}, ${deliveryFee}, 0, ${finalPrice}, 'pending', 'unpaid', 'online', ${d.delivery_address}, ${d.delivery_lat ?? null}, ${d.delivery_lng ?? null})
      RETURNING id
    )
    INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price, selected_options)
    SELECT o.id, x.product_id, x.quantity, x.unit_price, x.total_price, x.selected_options
    FROM o, jsonb_to_recordset(${JSON.stringify(lines)}::jsonb) AS x(product_id int, quantity int, unit_price numeric, total_price numeric, selected_options jsonb)
    RETURNING order_id
  `);
  const orderId = Number((res.rows[0] as { order_id: number }).order_id);

  const [order] = await loadOrders(eq(orders.id, orderId), { limit: 1 });
  return Response.json(order, { status: 201 });
});
