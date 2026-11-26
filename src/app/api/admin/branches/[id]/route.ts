import { eq } from 'drizzle-orm';
import { branches, getDb } from '@/db';
import { requireRole } from '@/lib/auth';
import { compact, dec, parseBody } from '@/lib/body';
import { handler, HttpError, parseId, type IdCtx } from '@/lib/http';
import { branchUpdate } from '@/lib/admin/schemas';
import { serializeBranch } from '@/lib/serialize';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const PUT = handler<IdCtx>(async (req, ctx) => {
  await requireRole(req, 'admin');
  const id = parseId((await ctx.params).id);
  const d = branchUpdate.parse((await parseBody(req)).fields);
  const [row] = await getDb().update(branches).set({
    ...compact({
      restaurantId: d.restaurant_id, name: d.name, address: d.address, phone: d.phone,
      latitude: d.latitude === undefined ? undefined : dec(d.latitude), longitude: d.longitude === undefined ? undefined : dec(d.longitude), isActive: d.is_active,
    }),
    updatedAt: new Date(),
  }).where(eq(branches.id, id)).returning();
  if (!row) throw new HttpError(404, 'شعبه یافت نشد');
  return Response.json(serializeBranch(row));
});

export const DELETE = handler<IdCtx>(async (req, ctx) => {
  await requireRole(req, 'admin');
  const [row] = await getDb().delete(branches).where(eq(branches.id, parseId((await ctx.params).id))).returning({ id: branches.id });
  if (!row) throw new HttpError(404, 'شعبه یافت نشد');
  return Response.json({ message: 'شعبه با موفقیت حذف شد' });
});
