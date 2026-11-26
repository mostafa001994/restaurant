import { eq } from 'drizzle-orm';
import { getDb, restaurants, users } from '@/db';
import { requireRole } from '@/lib/auth';
import { hashPassword } from '@/lib/crypto';
import { parseBody } from '@/lib/body';
import { handler, HttpError, parseId, type IdCtx } from '@/lib/http';
import { userUpdate } from '@/lib/admin/schemas';
import { adminCount, normalizeContacts, serializeUserAdmin } from '@/lib/admin/users';
import { revokeAllForUser } from '@/lib/tokens';
import { findUserById } from '@/lib/users';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function find(id: number) {
  const u = await findUserById(id);
  if (!u) throw new HttpError(404, 'کاربر یافت نشد');
  return u;
}

export const GET = handler<IdCtx>(async (req, ctx) => {
  await requireRole(req, 'admin');
  return Response.json(serializeUserAdmin(await find(parseId((await ctx.params).id))));
});

export const PUT = handler<IdCtx>(async (req, ctx) => {
  const me = await requireRole(req, 'admin');
  const id = parseId((await ctx.params).id);
  const cur = await find(id);
  const d = userUpdate.parse((await parseBody(req)).fields);
  const { email, phone } = normalizeContacts(d.email, d.phone);
  if (!email && !phone) throw new HttpError(422, 'ایمیل یا شماره موبایل لازم است');
  if (d.password && d.password.length < 6) throw new HttpError(422, 'رمز عبور حداقل ۶ کاراکتر');

  // قفل‌شدن از پنل: نه خود را از ادمین خارج کن، نه آخرین ادمین را
  if (cur.role.slug === 'admin' && d.role_id !== cur.role.id) {
    if (me.user.id === id) throw new HttpError(422, 'نقش خودتان را نمی‌توانید تغییر دهید');
    if ((await adminCount()) <= 1) throw new HttpError(422, 'آخرین ادمین سیستم را نمی‌توان تغییر داد');
  }

  const now = new Date();
  await getDb().update(users).set({
    name: d.name, email, phone, roleId: d.role_id,
    emailVerifiedAt: d.is_verified && email ? (email === cur.user.email ? cur.user.emailVerifiedAt ?? now : now) : null,
    phoneVerifiedAt: d.is_verified && phone ? (phone === cur.user.phone ? cur.user.phoneVerifiedAt ?? now : now) : null,
    ...(d.password ? { passwordHash: await hashPassword(d.password), failedLogins: 0, lockedUntil: null } : {}),
    updatedAt: now,
  }).where(eq(users.id, id));
  if (d.password) await revokeAllForUser(id); // با تغییر رمز، نشست‌های قبلی باطل
  return Response.json(serializeUserAdmin(await find(id)));
});

export const DELETE = handler<IdCtx>(async (req, ctx) => {
  const me = await requireRole(req, 'admin');
  const id = parseId((await ctx.params).id);
  const cur = await find(id);
  if (me.user.id === id) throw new HttpError(422, 'حساب خودتان را نمی‌توانید حذف کنید');
  if (cur.role.slug === 'admin' && (await adminCount()) <= 1) throw new HttpError(422, 'آخرین ادمین سیستم را نمی‌توان حذف کرد');
  const [owned] = await getDb().select({ id: restaurants.id }).from(restaurants).where(eq(restaurants.userId, id)).limit(1);
  if (owned) throw new HttpError(422, 'این کاربر صاحب رستوران است؛ اول رستوران را به کاربر دیگری منتقل یا حذف کنید');
  await getDb().delete(users).where(eq(users.id, id)); // سفارش‌ها user_id=null می‌شوند
  return Response.json({ message: 'کاربر با موفقیت حذف شد' });
});
