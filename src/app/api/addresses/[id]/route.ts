import { and, eq } from 'drizzle-orm';
import { addresses, getDb } from '@/db';
import { requireAuth } from '@/lib/auth';
import { handler, HttpError, parseId, readJson, type IdCtx } from '@/lib/http';
import { serializeAddress } from '@/lib/serialize';
import { addressSchema } from '@/lib/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const PUT = handler<IdCtx>(async (req, ctx) => {
  const { user } = await requireAuth(req);
  const id = parseId((await ctx.params).id);
  const d = addressSchema.parse(await readJson(req));
  const db = getDb();
  if (d.is_default) await db.update(addresses).set({ isDefault: false }).where(eq(addresses.userId, user.id));
  const [row] = await db
    .update(addresses)
    .set({
      title: d.title,
      fullName: d.full_name,
      phone: d.phone,
      province: d.province,
      city: d.city,
      postalCode: d.postal_code,
      addressLine: d.address_line,
      plaque: d.plaque,
      lat: d.lat == null ? null : String(d.lat),
      lng: d.lng == null ? null : String(d.lng),
      isDefault: d.is_default,
      updatedAt: new Date(),
    })
    .where(and(eq(addresses.id, id), eq(addresses.userId, user.id))) // مالکیت در خود کوئری
    .returning();
  if (!row) throw new HttpError(404, 'آدرس یافت نشد');
  return Response.json(serializeAddress(row));
});

export const DELETE = handler<IdCtx>(async (req, ctx) => {
  const { user } = await requireAuth(req);
  const id = parseId((await ctx.params).id);
  const [row] = await getDb().delete(addresses).where(and(eq(addresses.id, id), eq(addresses.userId, user.id))).returning({ id: addresses.id });
  if (!row) throw new HttpError(404, 'آدرس یافت نشد');
  return Response.json({ message: 'آدرس حذف شد' });
});
