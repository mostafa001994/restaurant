import { eq } from 'drizzle-orm';
import { getDb, permissions } from '@/db';
import { requireRole } from '@/lib/auth';
import { parseBody } from '@/lib/body';
import { handler, HttpError, parseId, type IdCtx } from '@/lib/http';
import { permissionSchema } from '@/lib/admin/schemas';
import { permOut } from '@/lib/admin/roles';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const PUT = handler<IdCtx>(async (req, ctx) => {
  await requireRole(req, 'admin');
  const d = permissionSchema.parse((await parseBody(req)).fields);
  const [row] = await getDb().update(permissions).set({ ...d, updatedAt: new Date() }).where(eq(permissions.id, parseId((await ctx.params).id))).returning();
  if (!row) throw new HttpError(404, 'دسترسی یافت نشد');
  return Response.json(permOut(row));
});

export const DELETE = handler<IdCtx>(async (req, ctx) => {
  await requireRole(req, 'admin');
  const [row] = await getDb().delete(permissions).where(eq(permissions.id, parseId((await ctx.params).id))).returning({ id: permissions.id });
  if (!row) throw new HttpError(404, 'دسترسی یافت نشد');
  return Response.json({ message: 'دسترسی با موفقیت حذف شد' });
});
