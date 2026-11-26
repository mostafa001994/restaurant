import { and, asc, eq, inArray } from 'drizzle-orm';
import { getDb, productExtras, products } from '@/db';
import { handler, parseId, type IdCtx } from '@/lib/http';
import { serializeProduct } from '@/lib/serialize';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = handler<IdCtx>(async (_req, ctx) => {
  const id = parseId((await ctx.params).id);
  const db = getDb();
  const rows = await db.select().from(products).where(eq(products.restaurantId, id)).orderBy(asc(products.id));
  const extras = rows.length
    ? await db.select().from(productExtras).where(and(inArray(productExtras.productId, rows.map((p) => p.id)), eq(productExtras.isActive, true)))
    : [];
  return Response.json(rows.map((p) => serializeProduct(p, extras.filter((e) => e.productId === p.id))));
});
