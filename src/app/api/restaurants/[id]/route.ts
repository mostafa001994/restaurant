import { and, eq } from 'drizzle-orm';
import { branches, getDb, restaurants } from '@/db';
import { handler, HttpError, parseId, type IdCtx } from '@/lib/http';
import { serializeRestaurant } from '@/lib/serialize';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = handler<IdCtx>(async (_req, ctx) => {
  const id = parseId((await ctx.params).id);
  const db = getDb();
  const [r] = await db.select().from(restaurants).where(and(eq(restaurants.id, id), eq(restaurants.status, 'active'))).limit(1);
  if (!r) throw new HttpError(404, 'رستوران یافت نشد');
  return Response.json(serializeRestaurant(r, await db.select().from(branches).where(eq(branches.restaurantId, id))));
});
