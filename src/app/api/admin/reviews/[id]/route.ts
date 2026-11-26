import { eq } from 'drizzle-orm';
import { getDb, reviews } from '@/db';
import { requireRole } from '@/lib/auth';
import { parseBody } from '@/lib/body';
import { handler, HttpError, parseId, type IdCtx } from '@/lib/http';
import { reviewUpdate } from '@/lib/admin/schemas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const PATCH = handler<IdCtx>(async (req, ctx) => {
  await requireRole(req, 'admin');
  const { is_approved } = reviewUpdate.parse((await parseBody(req)).fields);
  const [row] = await getDb().update(reviews).set({ isApproved: is_approved, updatedAt: new Date() }).where(eq(reviews.id, parseId((await ctx.params).id))).returning();
  if (!row) throw new HttpError(404, 'نظر یافت نشد');
  return Response.json({ id: row.id, is_approved: row.isApproved });
});

export const DELETE = handler<IdCtx>(async (req, ctx) => {
  await requireRole(req, 'admin');
  const [row] = await getDb().delete(reviews).where(eq(reviews.id, parseId((await ctx.params).id))).returning({ id: reviews.id });
  if (!row) throw new HttpError(404, 'نظر یافت نشد');
  return Response.json({ message: 'نظر با موفقیت حذف شد' });
});
