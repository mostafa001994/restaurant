import { eq } from 'drizzle-orm';
import { getDb, ingredients } from '@/db';
import { requireRole } from '@/lib/auth';
import { parseBody } from '@/lib/body';
import { handler, HttpError, parseId, type IdCtx } from '@/lib/http';
import { nameOnly } from '@/lib/admin/schemas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const PUT = handler<IdCtx>(async (req, ctx) => {
  await requireRole(req, 'admin');
  const { name } = nameOnly.parse((await parseBody(req)).fields);
  const [row] = await getDb().update(ingredients).set({ name, updatedAt: new Date() }).where(eq(ingredients.id, parseId((await ctx.params).id))).returning();
  if (!row) throw new HttpError(404, 'یافت نشد');
  return Response.json({ id: row.id, name: row.name });
});

export const DELETE = handler<IdCtx>(async (req, ctx) => {
  await requireRole(req, 'admin');
  const [row] = await getDb().delete(ingredients).where(eq(ingredients.id, parseId((await ctx.params).id))).returning({ id: ingredients.id });
  if (!row) throw new HttpError(404, 'یافت نشد');
  return Response.json({ message: 'Deleted successfully' });
});
