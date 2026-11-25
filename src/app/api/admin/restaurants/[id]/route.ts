import { eq, inArray } from 'drizzle-orm';
import { branches, categories, getDb, products, restaurants, users } from '@/db';
import { requireRole } from '@/lib/auth';
import { compact, dec, methodOverride, parseBody, type Parsed } from '@/lib/body';
import { handler, HttpError, parseId, type IdCtx } from '@/lib/http';
import { restaurantUpdate } from '@/lib/admin/schemas';
import { serializeCategory, serializeProductAdmin, serializeRestaurantAdmin, userBrief } from '@/lib/admin/serialize';
import { deleteImage, saveImage } from '@/lib/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function find(id: number) {
  const [r] = await getDb().select().from(restaurants).where(eq(restaurants.id, id)).limit(1);
  if (!r) throw new HttpError(404, 'رستوران یافت نشد');
  return r;
}

async function update(id: number, { fields, files }: Parsed) {
  const cur = await find(id);
  const d = restaurantUpdate.parse(fields);
  const logo = files.logo ? await saveImage(files.logo, 'restaurants/logos') : undefined;
  const cover = files.cover_image ? await saveImage(files.cover_image, 'restaurants/covers') : undefined;
  try {
    const [row] = await getDb().update(restaurants).set({
      ...compact({
        userId: d.user_id, name: d.name, description: d.description, address: d.address === null ? '' : d.address,
        latitude: d.latitude === undefined ? undefined : dec(d.latitude), longitude: d.longitude === undefined ? undefined : dec(d.longitude),
        openTime: d.open_time, closeTime: d.close_time, isOpen: d.is_open, status: d.status, logo, coverImage: cover,
      }),
      updatedAt: new Date(),
    }).where(eq(restaurants.id, id)).returning();
    if (logo) await deleteImage(cur.logo);
    if (cover) await deleteImage(cur.coverImage);
    return Response.json(serializeRestaurantAdmin(row!));
  } catch (e) {
    await Promise.all([deleteImage(logo), deleteImage(cover)]);
    throw e;
  }
}

async function remove(id: number) {
  const cur = await find(id);
  await getDb().delete(restaurants).where(eq(restaurants.id, id)); // FK: شعبه/دسته/غذا cascade
  await Promise.all([deleteImage(cur.logo), deleteImage(cur.coverImage)]);
  return Response.json({ message: 'رستوران با موفقیت حذف شد' });
}

export const GET = handler<IdCtx>(async (req, ctx) => {
  await requireRole(req, 'admin');
  const id = parseId((await ctx.params).id);
  const db = getDb();
  const r = await find(id);
  const [[u], bs, cats] = await Promise.all([
    db.select({ id: users.id, name: users.name, email: users.email, phone: users.phone }).from(users).where(eq(users.id, r.userId)).limit(1),
    db.select().from(branches).where(eq(branches.restaurantId, id)),
    db.select().from(categories).where(eq(categories.restaurantId, id)),
  ]);
  const ps = cats.length ? await db.select().from(products).where(inArray(products.categoryId, cats.map((c) => c.id))) : [];
  return Response.json({
    ...serializeRestaurantAdmin(r, { user: userBrief(u ?? null), branches: bs }),
    categories: cats.map((c) => serializeCategory(c, { products: ps.filter((p) => p.categoryId === c.id).map((p) => serializeProductAdmin(p)) })),
  });
});

export const PUT = handler<IdCtx>(async (req, ctx) => {
  await requireRole(req, 'admin');
  return update(parseId((await ctx.params).id), await parseBody(req));
});

// فرانت فعلی با POST + ?_method=PUT (multipart) ارسال می‌کند
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
