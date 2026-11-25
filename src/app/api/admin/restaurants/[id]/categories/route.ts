import { asc, eq, inArray } from 'drizzle-orm';
import { categories, getDb, products } from '@/db';
import { requireRole } from '@/lib/auth';
import { handler, parseId, type IdCtx } from '@/lib/http';
import { serializeCategory, serializeProductAdmin } from '@/lib/admin/serialize';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = handler<IdCtx>(async (req, ctx) => {
  await requireRole(req, 'admin');
  const db = getDb();
  const rows = await db.select().from(categories).where(eq(categories.restaurantId, parseId((await ctx.params).id))).orderBy(asc(categories.sortOrder), asc(categories.id));
  const withProducts = new URL(req.url).searchParams.get('_with') === 'products';
  const ps = withProducts && rows.length ? await db.select().from(products).where(inArray(products.categoryId, rows.map((c) => c.id))) : [];
  return Response.json(rows.map((c) => serializeCategory(c, withProducts ? { products: ps.filter((p) => p.categoryId === c.id).map((p) => serializeProductAdmin(p)) } : {})));
});
