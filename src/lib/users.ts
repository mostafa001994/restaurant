import { eq } from 'drizzle-orm';
import { getDb, roles, users } from '@/db';
import { env } from './env';
import type { Identifier } from './phone';

export type UserRow = typeof users.$inferSelect;
export type RoleRow = typeof roles.$inferSelect;
export type LoadedUser = { user: UserRow; role: RoleRow };

const ROLE_SEED = [
  { name: 'Customer', slug: 'customer', label: 'مشتری' },
  { name: 'Vendor', slug: 'vendor', label: 'فروشنده' },
  { name: 'Rider', slug: 'rider', label: 'پیک' },
  { name: 'Admin', slug: 'admin', label: 'مدیر' },
];

let rolesReady = false;

/** نقش‌های پایه را (idempotent) می‌سازد؛ نیازی به seed دستی برای مشتری نیست. */
export async function ensureRoles(): Promise<void> {
  if (rolesReady) return;
  await getDb().insert(roles).values(ROLE_SEED).onConflictDoNothing();
  rolesReady = true;
}

export async function getRoleBySlug(slug: string): Promise<RoleRow> {
  await ensureRoles();
  const [r] = await getDb().select().from(roles).where(eq(roles.slug, slug)).limit(1);
  if (!r) throw new Error(`role ${slug} missing`);
  return r;
}

const base = () => getDb().select({ user: users, role: roles }).from(users).innerJoin(roles, eq(users.roleId, roles.id));

export async function findUserByIdentifier(id: Identifier): Promise<LoadedUser | null> {
  const col = id.type === 'phone' ? users.phone : users.email;
  const [row] = await base().where(eq(col, id.value)).limit(1);
  return row ?? null;
}

export async function findUserById(id: number): Promise<LoadedUser | null> {
  const [row] = await base().where(eq(users.id, id)).limit(1);
  return row ?? null;
}

/** کاربر را (در صورت نبودن) می‌سازد و شناسه را تایید‌شده علامت می‌زند؛ payload ثبت‌نام را اعمال می‌کند. */
export async function upsertVerifiedUser(
  id: Identifier,
  extra: { name?: string; passwordHash?: string },
): Promise<LoadedUser> {
  const db = getDb();
  const customer = await getRoleBySlug('customer');
  const now = new Date();
  const verifiedAt = id.type === 'phone' ? { phoneVerifiedAt: now } : { emailVerifiedAt: now };

  await db
    .insert(users)
    .values({
      ...(id.type === 'phone' ? { phone: id.value } : { email: id.value }),
      name: extra.name ?? null,
      passwordHash: extra.passwordHash ?? null,
      roleId: customer.id,
      ...verifiedAt,
    })
    .onConflictDoNothing();

  const found = await findUserByIdentifier(id);
  if (!found) throw new Error('user upsert failed');

  await db
    .update(users)
    .set({
      ...(id.type === 'phone'
        ? { phoneVerifiedAt: found.user.phoneVerifiedAt ?? now }
        : { emailVerifiedAt: found.user.emailVerifiedAt ?? now }),
      ...(extra.passwordHash ? { passwordHash: extra.passwordHash, failedLogins: 0, lockedUntil: null } : {}),
      ...(extra.name && !found.user.name ? { name: extra.name } : {}),
      lastLoginAt: now,
      updatedAt: now,
    })
    .where(eq(users.id, found.user.id));

  return (await findUserById(found.user.id)) as LoadedUser;
}

/** شکل خروجی سازگار با اپ فلاتر: snake_case، role به‌صورت شیء، is_admin */
export function serializeUser({ user, role }: LoadedUser) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    avatar: user.avatar,
    avatar_url: publicFileUrl(user.avatar) ?? defaultAvatarUrl(),
    role: { id: role.id, name: role.name, slug: role.slug },
    is_admin: role.slug === 'admin',
    email_verified: !!user.emailVerifiedAt,
    phone_verified: !!user.phoneVerifiedAt,
    is_verified: !!(user.phoneVerifiedAt || user.emailVerifiedAt),
    email_verified_at: user.emailVerifiedAt?.toISOString() ?? null,
    phone_verified_at: user.phoneVerifiedAt?.toISOString() ?? null,
    created_at: user.createdAt.toISOString(),
    updated_at: user.updatedAt.toISOString(),
  };
}


const appBase = () => (env().APP_URL ?? '').replace(/\/$/, '');
/** کلید نسبی ذخیره‌شده → آدرس کامل (از طریق ریدایرکت /storage). APP_URL باید تنظیم باشد تا فرانتِ جدا بتواند تصویر را بخواند. */
export const publicFileUrl = (key: string | null) => (key ? `${appBase()}/storage/${key}` : null);
export const defaultAvatarUrl = () => `${appBase()}/default-avatar.svg`;
