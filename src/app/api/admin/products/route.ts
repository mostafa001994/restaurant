import { count, desc } from 'drizzle-orm';
import { getDb, products } from '@/db';
import { requireRole } from '@/lib/auth';
import { dec, parseBody } from '@/lib/body';
import { handler } from '@/lib/http';
import { pageOf } from '@/lib/pagination';
import { productCreate } from '@/lib/admin/schemas';
import { assertCategoryBelongs, syncIngredients, withRelations } from '@/lib/admin/products';
import { deleteImage, saveImage } from '@/lib/storage';
import { eq } from 'drizzle-orm';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = handler(async (req) => {
  await requireRole(req, 'admin');
  const { page, perPage, offset } = pageOf(req, 20);
  const db = getDb();
  const [rows, [total]] = await Promise.all([
    db.select().from(products).orderBy(desc(products.id)).limit(perPage).offset(offset),
    db.select({ n: count() }).from(products),
  ]);
  const n = total?.n ?? 0;
  return Response.json({ items: await withRelations(rows), pagination: { current_page: page, last_page: Math.max(1, Math.ceil(n / perPage)), total: n } });
});

export const POST = handler(async (req) => {
  await requireRole(req, 'admin');
  const { fields, files } = await parseBody(req);
  const d = productCreate.parse(fields);
  await assertCategoryBelongs(d.category_id, d.restaurant_id);
  const image = files.image ? await saveImage(files.image, 'products') : null;
  const db = getDb();
  let id: number | undefined;
  try {
    const [row] = await db.insert(products).values({
      categoryId: d.category_id, restaurantId: d.restaurant_id, name: d.name, description: d.description ?? null,
      price: String(d.price), discountPrice: dec(d.discount_price), stock: d.stock, preparationMinutes: d.preparation_minutes ?? 30,
      isAvailable: d.status === 'active', image,
    }).returning();
    id = row!.id;
    if (d.ingredients?.length) await syncIngredients(id, d.ingredients);
    return Response.json((await withRelations([row!]))[0], { status: 201 });
  } catch (e) {
    if (id) await db.delete(products).where(eq(products.id, id)); // غذای نیمه‌کاره نماند
    await deleteImage(image);
    throw e;
  }
});
