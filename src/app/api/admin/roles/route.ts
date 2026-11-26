import { asc } from 'drizzle-orm';
import { getDb, roles } from '@/db';
import { requireRole } from '@/lib/auth';
import { parseBody } from '@/lib/body';
import { handler } from '@/lib/http';
import { roleSchema } from '@/lib/admin/schemas';
import { rolesWithPermissions, syncPermissions } from '@/lib/admin/roles';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = handler(async (req) => {
  await requireRole(req, 'admin');
  return Response.json(await rolesWithPermissions(await getDb().select().from(roles).orderBy(asc(roles.name))));
});

export const POST = handler(async (req) => {
  await requireRole(req, 'admin');
  const d = roleSchema.parse((await parseBody(req)).fields);
  const [row] = await getDb().insert(roles).values({ name: d.name, slug: d.slug }).returning();
  if (d.permissions?.length) await syncPermissions(row!.id, d.permissions);
  return Response.json((await rolesWithPermissions([row!]))[0], { status: 201 });
});
