import { count, eq } from 'drizzle-orm';
import { getDb, roles, users } from '@/db';
import { HttpError } from '../http';
import { parseIdentifier } from '../phone';
import type { LoadedUser } from '../users';

export function serializeUserAdmin({ user, role }: LoadedUser) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    avatar: user.avatar,
    role_id: role.id,
    role: { id: role.id, name: role.name, slug: role.slug, label: role.label },
    is_verified: !!(user.phoneVerifiedAt || user.emailVerifiedAt),
    last_login_at: user.lastLoginAt?.toISOString() ?? null,
    created_at: user.createdAt.toISOString(),
  };
}

/** ایمیل/موبایل را نرمال‌سازی می‌کند (موبایل باید ایران معتبر باشد) */
export function normalizeContacts(email?: string | null, phone?: string | null) {
  let e: string | null = null;
  let p: string | null = null;
  if (email) {
    const id = parseIdentifier(email);
    if (!id || id.type !== 'email') throw new HttpError(422, 'ایمیل نامعتبر است');
    e = id.value;
  }
  if (phone) {
    const id = parseIdentifier(phone);
    if (!id || id.type !== 'phone') throw new HttpError(422, 'شماره موبایل نامعتبر است');
    p = id.value;
  }
  return { email: e, phone: p };
}

export async function adminCount(): Promise<number> {
  const [r] = await getDb().select({ n: count() }).from(users).innerJoin(roles, eq(users.roleId, roles.id)).where(eq(roles.slug, 'admin'));
  return r?.n ?? 0;
}

export const PROTECTED_ROLES = ['customer', 'vendor', 'rider', 'admin'];
