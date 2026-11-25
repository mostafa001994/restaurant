import { count, desc, eq } from 'drizzle-orm';
import { branches, getDb, restaurants } from '@/db';
import { requireRole } from '@/lib/auth';
import { dec, parseBody } from '@/lib/body';
import { handler } from '@/lib/http';
import { pageOf, paginated } from '@/lib/pagination';
import { branchCreate } from '@/lib/admin/schemas';
import { restaurantBrief } from '@/lib/admin/serialize';
import { serializeBranch } from '@/lib/serialize';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = handler(async (req) => {
  await requireRole(req, 'admin');
  const { page, perPage, offset } = pageOf(req, 10);
  const db = getDb();
  const [rows, [total]] = await Promise.all([
    db.select({ b: branches, r: { id: restaurants.id, name: restaurants.name } }).from(branches).leftJoin(restaurants, eq(branches.restaurantId, restaurants.id)).orderBy(desc(branches.id)).limit(perPage).offset(offset),
    db.select({ n: count() }).from(branches),
  ]);
  return Response.json(paginated(rows.map((x) => ({ ...serializeBranch(x.b), restaurant: restaurantBrief(x.r) })), total?.n ?? 0, page, perPage));
});

export const POST = handler(async (req) => {
  await requireRole(req, 'admin');
  const d = branchCreate.parse((await parseBody(req)).fields);
  const [row] = await getDb().insert(branches).values({
    restaurantId: d.restaurant_id, name: d.name, address: d.address ?? null, phone: d.phone ?? null,
    latitude: dec(d.latitude), longitude: dec(d.longitude), isActive: d.is_active ?? true,
  }).returning();
  return Response.json(serializeBranch(row!), { status: 201 });
});
