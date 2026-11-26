import { desc, eq } from 'drizzle-orm';
import { addresses, getDb } from '@/db';
import { requireAuth } from '@/lib/auth';
import { handler, readJson } from '@/lib/http';
import { serializeAddress } from '@/lib/serialize';
import { addressSchema } from '@/lib/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = handler(async (req) => {
  const { user } = await requireAuth(req);
  const rows = await getDb().select().from(addresses).where(eq(addresses.userId, user.id)).orderBy(desc(addresses.isDefault), desc(addresses.id));
  return Response.json(rows.map(serializeAddress));
});

export const POST = handler(async (req) => {
  const { user } = await requireAuth(req);
  const d = addressSchema.parse(await readJson(req));
  const db = getDb();
  if (d.is_default) await db.update(addresses).set({ isDefault: false }).where(eq(addresses.userId, user.id));
  const [row] = await db
    .insert(addresses)
    .values({
      userId: user.id,
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
    })
    .returning();
  return Response.json(serializeAddress(row!), { status: 201 });
});
