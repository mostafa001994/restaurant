import { desc, eq } from 'drizzle-orm';
import { getDb, roles, users } from '@/db';
import { requireRole } from '@/lib/auth';
import { hashPassword } from '@/lib/crypto';
import { parseBody } from '@/lib/body';
import { handler, HttpError } from '@/lib/http';
import { userCreate } from '@/lib/admin/schemas';
import { normalizeContacts, serializeUserAdmin } from '@/lib/admin/users';
import { findUserById } from '@/lib/users';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = handler(async (req) => {
  await requireRole(req, 'admin');
  const rows = await getDb().select({ user: users, role: roles }).from(users).innerJoin(roles, eq(users.roleId, roles.id)).orderBy(desc(users.id)).limit(1000);
  return Response.json(rows.map(serializeUserAdmin));
});

export const POST = handler(async (req) => {
  await requireRole(req, 'admin');
  const d = userCreate.parse((await parseBody(req)).fields);
  const { email, phone } = normalizeContacts(d.email, d.phone);
  if (!email && !phone) throw new HttpError(422, 'ایمیل یا شماره موبایل لازم است');
  const now = new Date();
  const [row] = await getDb().insert(users).values({
    name: d.name, email, phone, roleId: d.role_id, passwordHash: await hashPassword(d.password),
    emailVerifiedAt: email ? now : null, phoneVerifiedAt: phone ? now : null, // ادمین تایید می‌کند
  }).returning({ id: users.id });
  return Response.json(serializeUserAdmin((await findUserById(row!.id))!), { status: 201 });
});
