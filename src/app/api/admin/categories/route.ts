import { asc, desc, eq, inArray } from 'drizzle-orm';
import { categories, getDb, products, restaurants } from '@/db';
import { requireRole } from '@/lib/auth';
import { parseBody } from '@/lib/body';
import { handler } from '@/lib/http';
import { categoryCreate } from '@/lib/admin/schemas';
import { serializeCategory, serializeProductAdmin } from '@/lib/admin/serialize';
import { serializeRestaurant } from '@/lib/serialize';
import { deleteImage, saveImage } from '@/lib/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = handler(async (req) => {
  await requireRole(req, 'admin');
  const db = getDb();
  const cats = await db.select().from(categories).orderBy(desc(categories.id));
  const [ps, rs] = await Promise.all([
    cats.length ? db.select().from(products).where(inArray(products.categoryId, cats.map((c) => c.id))).orderBy(asc(products.id)) : [],
    db.select().from(restaurants),
  ]);
  const rById = new Map(rs.map((r) => [r.id, serializeRestaurant(r)]));
  return Response.json(cats.map((c) => serializeCategory(c, {
    restaurant: rById.get(c.restaurantId) ?? null,
    products: ps.filter((p) => p.categoryId === c.id).map((p) => ({ ...serializeProductAdmin(p), restaurant: rById.get(p.restaurantId) ?? null })),
  })));
});

export const POST = handler(async (req) => {
  await requireRole(req, 'admin');
  const { fields, files } = await parseBody(req);
  const d = categoryCreate.parse(fields);
  const image = files.image ? await saveImage(files.image, 'categories') : null;
  try {
    const [row] = await getDb().insert(categories).values({ restaurantId: d.restaurant_id, name: d.name, sortOrder: d.sort_order ?? 0, image }).returning();
    return Response.json(serializeCategory(row!), { status: 201 });
  } catch (e) { await deleteImage(image); throw e; }
});
