import { and, eq, lt, or, sql } from 'drizzle-orm';
import { getDb, orders, paymentGatewaySettings, transactions } from '@/db';
import { env } from '../env';
import { HttpError } from '../http';
import { GATEWAY_NAMES, GATEWAYS, type GatewaySetting } from './gateways';

export type SettingRow = typeof paymentGatewaySettings.$inferSelect;

let seeded = false;
/** ردیف تنظیمات هر دو درگاه را (غیرفعال) می‌سازد تا پنل ادمین همیشه چیزی برای ویرایش داشته باشد. */
export async function ensureGateways(): Promise<void> {
  if (seeded) return;
  await getDb()
    .insert(paymentGatewaySettings)
    .values(Object.entries(GATEWAY_NAMES).map(([key, name]) => ({ key, name, isEnabled: false, sandbox: true })))
    .onConflictDoNothing();
  seeded = true;
}

async function getSetting(key: string): Promise<SettingRow | null> {
  await ensureGateways();
  const [row] = await getDb().select().from(paymentGatewaySettings).where(eq(paymentGatewaySettings.key, key)).limit(1);
  return row ?? null;
}

const toSetting = (r: SettingRow): GatewaySetting => ({
  key: r.key, sandbox: r.sandbox, merchantId: r.merchantId, terminalId: r.terminalId, username: r.username, passwordEnc: r.passwordEnc,
});

export async function availableGateways() {
  await ensureGateways();
  const rows = await getDb().select({ key: paymentGatewaySettings.key, name: paymentGatewaySettings.name }).from(paymentGatewaySettings).where(eq(paymentGatewaySettings.isEnabled, true));
  return rows;
}

export const appBase = (req: Request) => (env().APP_URL ?? new URL(req.url).origin).replace(/\/$/, '');

/** شروع پرداخت: تراکنش pending می‌سازد و آدرس درگاه را برمی‌گرداند. */
export async function startPayment(opts: { userId: number; orderId: number; gateway: string; base: string }): Promise<string> {
  const db = getDb();
  const [order] = await db.select().from(orders).where(eq(orders.id, opts.orderId)).limit(1);
  if (!order) throw new HttpError(404, 'سفارش یافت نشد');
  if (order.userId !== opts.userId) throw new HttpError(403, 'دسترسی غیرمجاز');
  if (order.paymentStatus === 'paid') throw new HttpError(422, 'این سفارش قبلاً پرداخت شده است');
  if (order.status === 'cancelled') throw new HttpError(422, 'این سفارش لغو شده است');

  const gw = GATEWAYS[opts.gateway];
  const setting = await getSetting(opts.gateway);
  if (!gw || !setting || !setting.isEnabled) throw new HttpError(422, 'این درگاه پرداخت در حال حاضر فعال نیست');

  const amount = Math.round(Number(order.finalPrice));
  if (!(amount > 0)) throw new HttpError(422, 'مبلغ سفارش نامعتبر است');

  const started = await gw.start({
    orderId: order.id,
    amount,
    callbackUrl: `${opts.base}/api/payment/callback/${opts.gateway}/${order.id}`,
    setting: toSetting(setting),
  });

  await db.insert(transactions).values({
    orderId: order.id,
    userId: order.userId,
    restaurantId: order.restaurantId,
    amount: String(amount),
    type: 'debit',
    gateway: opts.gateway,
    transactionId: started.authority,
    status: 'pending',
    meta: started.meta,
  });
  await db.update(orders).set({ paymentGateway: opts.gateway, updatedAt: new Date() }).where(eq(orders.id, order.id));
  return started.redirectUrl;
}

/** سفارش را «یک بار» پرداخت‌شده می‌کند و زمان تحویل را (مثل DeliveryEstimator لاراول) محاسبه می‌کند. */
async function markOrderPaid(orderId: number): Promise<boolean> {
  const res = await getDb().execute(sql`
    WITH m AS (
      SELECT COALESCE(
        o.preparation_minutes,
        (SELECT max(p.preparation_minutes) FROM order_items oi JOIN products p ON p.id = oi.product_id WHERE oi.order_id = o.id),
        30
      ) AS mins
      FROM orders o WHERE o.id = ${orderId}
    )
    UPDATE orders
    SET payment_status = 'paid', status = 'accepted', paid_at = now(),
        preparation_minutes = m.mins,
        estimated_delivery_at = now() + make_interval(mins => m.mins),
        updated_at = now()
    FROM m
    WHERE orders.id = ${orderId} AND orders.payment_status = 'unpaid' AND orders.status <> 'cancelled'
    RETURNING orders.id
  `);
  return res.rows.length > 0;
}

const frontBase = (base: string) => (env().FRONTEND_URL ?? base).replace(/\/$/, '');
const result = (base: string, orderId: number, ok: boolean, message?: string) =>
  `${frontBase(base)}/payment/result?order_id=${orderId}&status=${ok ? 'success' : 'failed'}${message ? `&message=${encodeURIComponent(message)}` : ''}`;

/** بازگشت از بانک. آدرس صفحه‌ی نتیجه را برمی‌گرداند (هرگز throw نمی‌کند برای خطاهای درگاه). */
export async function handleCallback(opts: { gateway: string; orderId: number; params: Record<string, string>; base: string }): Promise<string> {
  const { gateway, orderId, params, base } = opts;
  const db = getDb();
  const gw = GATEWAYS[gateway];
  const setting = await getSetting(gateway);
  if (!gw || !setting) return result(base, orderId, false, 'درگاه نامعتبر است');

  // تراکنش با شناسه‌ی بانک + سفارش + درگاه پیدا می‌شود؛ authority دیگران برای این سفارش بی‌اثر است
  const authority = gw.authorityFrom(params);
  const [tx] = authority
    ? await db.select().from(transactions).where(and(eq(transactions.gateway, gateway), eq(transactions.transactionId, authority), eq(transactions.orderId, orderId))).limit(1)
    : [];
  if (!tx) return result(base, orderId, false, 'تراکنش نامعتبر است');

  if (tx.status === 'success') return result(base, orderId, true);
  if (tx.status === 'failed') return result(base, orderId, false, 'پرداخت ناموفق بود');

  // فقط یک درخواست اجازه‌ی verify دارد (جلوگیری از دوبار settle/ثبت)؛ processing قدیمی‌تر از ۲ دقیقه دوباره قابل claim است
  const [claimed] = await db
    .update(transactions)
    .set({ status: 'processing', updatedAt: new Date() })
    .where(and(eq(transactions.id, tx.id), or(eq(transactions.status, 'pending'), and(eq(transactions.status, 'processing'), lt(transactions.updatedAt, new Date(Date.now() - 120_000))))))
    .returning({ id: transactions.id });
  if (!claimed) return result(base, orderId, false, 'پرداخت در حال بررسی است؛ کمی بعد وضعیت سفارش را ببینید');

  let v;
  try {
    v = await gw.verify({
      params,
      tx: { orderId, amount: Number(tx.amount), transactionId: tx.transactionId!, meta: (tx.meta as Record<string, unknown>) ?? null },
      setting: toSetting(setting),
    });
  } catch (e) {
    console.error('[payment:verify]', gateway, orderId, e);
    v = { success: false, refId: null, message: e instanceof HttpError ? e.message : 'خطا در تایید پرداخت', raw: { error: String(e) } };
  }

  if (!v.success) {
    await db.update(transactions).set({ status: 'failed', meta: v.raw ?? null, updatedAt: new Date() }).where(eq(transactions.id, tx.id));
    return result(base, orderId, false, v.message ?? 'پرداخت ناموفق بود');
  }

  const paid = await markOrderPaid(orderId);
  await db
    .update(transactions)
    .set({ status: 'success', transactionId: tx.transactionId, meta: { ...(v.raw as object), ref_id: v.refId, order_paid: paid }, updatedAt: new Date() })
    .where(eq(transactions.id, tx.id));

  if (!paid) {
    // پول گرفته شده ولی سفارش دیگر قابل پرداخت نبود (مثلاً لغو شده) → نیاز به پیگیری دستی
    console.error('[payment] captured but order not payable', orderId, tx.id);
    return result(base, orderId, false, 'پرداخت انجام شد اما سفارش لغو شده بود؛ با پشتیبانی تماس بگیرید');
  }
  return result(base, orderId, true);
}
