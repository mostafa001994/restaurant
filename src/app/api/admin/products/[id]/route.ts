import { eq } from 'drizzle-orm';
import { getDb, products } from '@/db';
import { requireRole } from '@/lib/auth';
import { compact, dec, methodOverride, parseBody, type Parsed } from '@/lib/body';
import { handler, HttpError, parseId, type IdCtx } from '@/lib/http';
import { productUpdate } from '@/lib/admin/schemas';
import { assertCategoryBelongs, syncIngredients, withRelations } from '@/lib/admin/products';
import { deleteImage, saveImage } from '@/lib/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function find(id: number) {
  const [p] = await getDb().select().from(products).where(eq(products.id, id)).limit(1);
  if (!p) throw new HttpError(404, 'محصول یافت نشد');
  return p;
}

async function update(id: number, { fields, files }: Parsed) {
  const cur = await find(id);
  const d = productUpdate.parse(fields);
  if (d.category_id !== undefined || d.restaurant_id !== undefined) {
    await assertCategoryBelongs(d.category_id ?? cur.categoryId, d.restaurant_id ?? cur.restaurantId);
  }
  const image = files.image ? await saveImage(files.image, 'products') : undefined;
  try {
    const [row] = await getDb().update(products).set({
      ...compact({
        categoryId: d.category_id, restaurantId: d.restaurant_id, name: d.name, description: d.description,
        price: d.price === undefined ? undefined : String(d.price),
        discountPrice: d.discount_price === undefined ? undefined : dec(d.discount_price),
        stock: d.stock, preparationMinutes: d.preparation_minutes ?? undefined,
        isAvailable: d.status === undefined ? undefined : d.status === 'active', image,
      }),
      updatedAt: new Date(),
    }).where(eq(products.id, id)).returning();
    if (d.ingredients) await syncIngredients(id, d.ingredients);
    if (image) await deleteImage(cur.image);
    return Response.json((await withRelations([row!]))[0]);
  } catch (e) { await deleteImage(image); throw e; }
}

async function remove(id: number) {
  const cur = await find(id);
  await getDb().delete(products).where(eq(products.id, id)); // مواد/مخلفات cascade
  await deleteImage(cur.image);
  return Response.json({ message: 'محصول با موفقیت حذف شد' });
}

export const GET = handler<IdCtx>(async (req, ctx) => {
  await requireRole(req, 'admin');
  return Response.json((await withRelations([await find(parseId((await ctx.params).id))]))[0]);
});

export const PUT = handler<IdCtx>(async (req, ctx) => {
  await requireRole(req, 'admin');
  return update(parseId((await ctx.params).id), await parseBody(req));
});

export const POST = handler<IdCtx>(async (req, ctx) => {
  await requireRole(req, 'admin');
  const id = parseId((await ctx.params).id);
  const body = await parseBody(req);
  const m = methodOverride(req, body.fields);
  if (m === 'PUT' || m === 'PATCH') return update(id, body);
  if (m === 'DELETE') return remove(id);
  throw new HttpError(405, 'متد پشتیبانی نمی‌شود');
});

export const DELETE = handler<IdCtx>(async (req, ctx) => {
  await requireRole(req, 'admin');
  return remove(parseId((await ctx.params).id));
});
