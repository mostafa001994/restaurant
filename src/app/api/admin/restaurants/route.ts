import { count, desc, eq, inArray } from 'drizzle-orm';
import { branches, getDb, restaurants, users } from '@/db';
import { requireRole } from '@/lib/auth';
import { parseBody, dec } from '@/lib/body';
import { handler } from '@/lib/http';
import { pageOf, paginated } from '@/lib/pagination';
import { restaurantCreate } from '@/lib/admin/schemas';
import { serializeRestaurantAdmin, userBrief } from '@/lib/admin/serialize';
import { deleteImage, saveImage } from '@/lib/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = handler(async (req) => {
  await requireRole(req, 'admin');
  const { page, perPage, offset } = pageOf(req, 10);
  const db = getDb();
  const [rows, [total]] = await Promise.all([
    db.select({ r: restaurants, u: { id: users.id, name: users.name, email: users.email, phone: users.phone } })
      .from(restaurants).leftJoin(users, eq(restaurants.userId, users.id))
      .orderBy(desc(restaurants.createdAt), desc(restaurants.id)).limit(perPage).offset(offset),
    db.select({ n: count() }).from(restaurants),
  ]);
  const bs = rows.length ? await db.select().from(branches).where(inArray(branches.restaurantId, rows.map((x) => x.r.id))) : [];
  return Response.json(paginated(rows.map((x) => serializeRestaurantAdmin(x.r, { user: userBrief(x.u), branches: bs.filter((b) => b.restaurantId === x.r.id) })), total?.n ?? 0, page, perPage));
});

export const POST = handler(async (req) => {
  await requireRole(req, 'admin');
  const { fields, files } = await parseBody(req);
  const d = restaurantCreate.parse(fields);
  const logo = files.logo ? await saveImage(files.logo, 'restaurants/logos') : null;
  const cover = files.cover_image ? await saveImage(files.cover_image, 'restaurants/covers') : null;
  try {
    const [row] = await getDb().insert(restaurants).values({
      userId: d.user_id, name: d.name, description: d.description ?? null, address: d.address ?? '',
      latitude: dec(d.latitude), longitude: dec(d.longitude), openTime: d.open_time ?? null, closeTime: d.close_time ?? null,
      isOpen: d.is_open ?? true, status: d.status, logo, coverImage: cover,
    }).returning();
    return Response.json(serializeRestaurantAdmin(row!), { status: 201 });
  } catch (e) {
    await Promise.all([deleteImage(logo), deleteImage(cover)]); // آپلودهای بی‌صاحب پاک شوند
    throw e;
  }
});
