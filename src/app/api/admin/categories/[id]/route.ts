import { eq } from 'drizzle-orm';
import { categories, getDb, restaurants } from '@/db';
import { requireRole } from '@/lib/auth';
import { compact, methodOverride, parseBody, type Parsed } from '@/lib/body';
import { handler, HttpError, parseId, type IdCtx } from '@/lib/http';
import { categoryUpdate } from '@/lib/admin/schemas';
import { serializeCategory } from '@/lib/admin/serialize';
import { serializeRestaurant } from '@/lib/serialize';
import { deleteImage, saveImage } from '@/lib/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function find(id: number) {
  const [c] = await getDb().select().from(categories).where(eq(categories.id, id)).limit(1);
  if (!c) throw new HttpError(404, 'دسته‌بندی یافت نشد');
  return c;
}

async function update(id: number, { fields, files }: Parsed) {
  const cur = await find(id);
  const d = categoryUpdate.parse(fields);
  const image = files.image ? await saveImage(files.image, 'categories') : undefined;
  try {
    const [row] = await getDb().update(categories).set({
      ...compact({ restaurantId: d.restaurant_id, name: d.name, sortOrder: d.sort_order ?? undefined, image }), updatedAt: new Date(),
    }).where(eq(categories.id, id)).returning();
    if (image) await deleteImage(cur.image);
    return Response.json(serializeCategory(row!));
  } catch (e) { await deleteImage(image); throw e; }
}

async function remove(id: number) {
  const cur = await find(id);
  await getDb().delete(categories).where(eq(categories.id, id)); // غذاهای این دسته cascade حذف می‌شوند
  await deleteImage(cur.image);
  return Response.json({ message: 'دسته‌بندی حذف شد' });
}

export const GET = handler<IdCtx>(async (req, ctx) => {
  await requireRole(req, 'admin');
  const c = await find(parseId((await ctx.params).id));
  const [r] = await getDb().select().from(restaurants).where(eq(restaurants.id, c.restaurantId)).limit(1);
  return Response.json(serializeCategory(c, { restaurant: r ? serializeRestaurant(r) : null }));
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
