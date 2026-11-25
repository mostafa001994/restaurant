import { sql } from 'drizzle-orm';
import { getDb } from '@/db';

export type Metric = 'orders' | 'revenue' | 'users' | 'restaurants';
export type Period = 'day' | 'week' | 'month' | 'year';

/** هر رستوران‌دار فقط آمار رستوران خودش (restaurantId)؛ ادمین کل پلتفرم */
export async function overview(restaurantId?: number) {
  const where = restaurantId ? sql`WHERE restaurant_id = ${restaurantId}` : sql``;
  const paid = restaurantId ? sql`WHERE payment_status = 'paid' AND restaurant_id = ${restaurantId}` : sql`WHERE payment_status = 'paid'`;
  const res = await getDb().execute(sql`
    SELECT
      (SELECT count(*) FROM orders ${where})::int AS orders_count,
      (SELECT COALESCE(sum(final_price), 0) FROM orders ${paid})::float8 AS revenue,
      (SELECT count(*) FROM users)::int AS users_count,
      (SELECT count(*) FROM restaurants)::int AS restaurants_count
  `);
  const r = res.rows[0] as { orders_count: number; revenue: number; users_count: number; restaurants_count: number };
  return restaurantId ? { orders_count: r.orders_count, revenue: r.revenue } : r;
}

// فقط مقادیر ثابت وارد sql.raw می‌شوند (whitelist) — ورودی کاربر هرگز
const TABLE: Record<Metric, { table: string; extra: string; sum: string }> = {
  orders: { table: 'orders', extra: '', sum: '0' },
  revenue: { table: 'orders', extra: "AND payment_status = 'paid'", sum: 'SUM(final_price)' },
  users: { table: 'users', extra: '', sum: '0' },
  restaurants: { table: 'restaurants', extra: '', sum: '0' },
};
const BUCKET = (col: string): Record<Period, { expr: string; since: string }> => {
  const local = `(${col} AT TIME ZONE 'Asia/Tehran')`;
  return {
    day: { expr: `to_char(${local}, 'YYYY-MM-DD')`, since: '30 days' },
    week: { expr: `to_char(${local}, 'IYYYIW')`, since: '12 weeks' },
    month: { expr: `to_char(${local}, 'YYYY-MM')`, since: '12 months' },
    year: { expr: `to_char(${local}, 'YYYY')`, since: '5 years' },
  };
};

export async function chart(metric: Metric, period: Period, restaurantId?: number) {
  const m = TABLE[metric];
  const b = BUCKET('created_at')[period];
  const scoped = restaurantId && m.table === 'orders' ? sql`AND restaurant_id = ${restaurantId}` : sql``;
  const res = await getDb().execute(sql`
    SELECT ${sql.raw(b.expr)} AS bucket, count(*)::int AS count, COALESCE(${sql.raw(m.sum)}, 0)::float8 AS sum
    FROM ${sql.raw(m.table)}
    WHERE created_at >= now() - interval '${sql.raw(b.since)}' ${sql.raw(m.extra)} ${scoped}
    GROUP BY bucket ORDER BY bucket
  `);
  return (res.rows as { bucket: string; count: number; sum: number }[]).map((r) => ({ label: r.bucket, value: metric === 'revenue' ? r.sum : r.count }));
}
