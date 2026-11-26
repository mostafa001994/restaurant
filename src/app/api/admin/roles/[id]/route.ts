import { count, eq } from 'drizzle-orm';
import { getDb, roles, users } from '@/db';
import { requireRole } from '@/lib/auth';
import { parseBody } from '@/lib/body';
import { handler, HttpError, parseId, type IdCtx } from '@/lib/http';
import { roleSchema } from '@/lib/admin/schemas';
import { rolesWithPermissions, syncPermissions } from '@/lib/admin/roles';
import { PROTECTED_ROLES } from '@/lib/admin/users';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function find(id: number) {
  const [r] = await getDb().select().from(roles).where(eq(roles.id, id)).limit(1);
  if (!r) throw new HttpError(404, 'نقش یافت نشد');
  return r;
}

export const PUT = handler<IdCtx>(async (req, ctx) => {
  await requireRole(req, 'admin');
  const id = parseId((await ctx.params).id);
  const cur = await find(id);
  const d = roleSchema.parse((await parseBody(req)).fields);
  if (PROTECTED_ROLES.includes(cur.slug) && d.slug !== cur.slug) throw new HttpError(422, 'شناسه‌ی (slug) نقش‌های پایه قابل تغییر نیست');
  const [row] = await getDb().update(roles).set({ name: d.name, slug: d.slug }).where(eq(roles.id, id)).returning();
  if (d.permissions) await syncPermissions(id, d.permissions);
  return Response.json((await rolesWithPermissions([row!]))[0]);
});

export const DELETE = handler<IdCtx>(async (req, ctx) => {
  await requireRole(req, 'admin');
  const id = parseId((await ctx.params).id);
  const cur = await find(id);
  if (PROTECTED_ROLES.includes(cur.slug)) throw new HttpError(422, 'نقش‌های پایه قابل حذف نیستند');
  const [u] = await getDb().select({ n: count() }).from(users).where(eq(users.roleId, id));
  if ((u?.n ?? 0) > 0) throw new HttpError(422, 'این نقش به کاربرانی تخصیص داده شده و قابل حذف نیست. اول نقش آن کاربران را عوض کنید.');
  await getDb().delete(roles).where(eq(roles.id, id)); // role_permission cascade
  return Response.json({ message: 'نقش با موفقیت حذف شد' });
});
