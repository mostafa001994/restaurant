import { eq, inArray } from 'drizzle-orm';
import { getDb, permissions, rolePermission, roles } from '@/db';

type RoleRow = typeof roles.$inferSelect;
type PermRow = typeof permissions.$inferSelect;

export const permOut = (p: PermRow) => ({ id: p.id, name: p.name, slug: p.slug, label: p.label });

export async function rolesWithPermissions(rows: RoleRow[]) {
  if (!rows.length) return [];
  const links = await getDb()
    .select({ roleId: rolePermission.roleId, p: permissions })
    .from(rolePermission)
    .innerJoin(permissions, eq(rolePermission.permissionId, permissions.id))
    .where(inArray(rolePermission.roleId, rows.map((r) => r.id)));
  return rows.map((r) => ({
    id: r.id, name: r.name, slug: r.slug, label: r.label,
    permissions: links.filter((l) => l.roleId === r.id).map((l) => permOut(l.p)),
  }));
}

export async function syncPermissions(roleId: number, ids: number[]) {
  const db = getDb();
  const unique = [...new Set(ids)];
  const del = db.delete(rolePermission).where(eq(rolePermission.roleId, roleId));
  if (!unique.length) return void (await del);
  await db.batch([del, db.insert(rolePermission).values(unique.map((permissionId) => ({ roleId, permissionId })))]);
}
