import { and, count, desc, eq, type SQL } from 'drizzle-orm';
import { getDb, restaurants, transactions, users } from '@/db';
import { requireRole } from '@/lib/auth';
import { handler } from '@/lib/http';
import { serializeTransaction } from '@/lib/payment/serialize';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PER_PAGE = 20;

export const GET = handler(async (req) => {
  await requireRole(req, 'admin');
  const q = new URL(req.url).searchParams;
  const page = Math.max(1, Math.min(10_000, Number(q.get('page')) || 1));
  const conds: SQL[] = [];
  if (q.get('status')) conds.push(eq(transactions.status, q.get('status')!));
  if (q.get('gateway')) conds.push(eq(transactions.gateway, q.get('gateway')!));
  const where = conds.length ? and(...conds) : undefined;

  const db = getDb();
  const [rows, [total]] = await Promise.all([
    db
      .select({ tx: transactions, user: { id: users.id, name: users.name, email: users.email, phone: users.phone }, restaurant: { id: restaurants.id, name: restaurants.name } })
      .from(transactions)
      .leftJoin(users, eq(transactions.userId, users.id))
      .leftJoin(restaurants, eq(transactions.restaurantId, restaurants.id))
      .where(where)
      .orderBy(desc(transactions.id))
      .limit(PER_PAGE)
      .offset((page - 1) * PER_PAGE),
    db.select({ n: count() }).from(transactions).where(where),
  ]);
  const n = total?.n ?? 0;
  return Response.json({
    data: rows.map((r) => ({ ...serializeTransaction(r.tx), user: r.user, restaurant: r.restaurant })),
    current_page: page,
    per_page: PER_PAGE,
    total: n,
    last_page: Math.max(1, Math.ceil(n / PER_PAGE)),
  });
});
