import { desc, eq, inArray } from 'drizzle-orm';
import { branches, getDb, restaurants } from '@/db';
import { handler } from '@/lib/http';
import { serializeRestaurant } from '@/lib/serialize';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = handler(async () => {
  const db = getDb();
  const rows = await db.select().from(restaurants).where(eq(restaurants.status, 'active')).orderBy(desc(restaurants.createdAt));
  const bs = rows.length ? await db.select().from(branches).where(inArray(branches.restaurantId, rows.map((r) => r.id))) : [];
  return Response.json(rows.map((r) => serializeRestaurant(r, bs.filter((b) => b.restaurantId === r.id))));
});
