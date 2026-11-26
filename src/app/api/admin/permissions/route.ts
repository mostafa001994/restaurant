import { asc } from 'drizzle-orm';
import { getDb, permissions } from '@/db';
import { requireRole } from '@/lib/auth';
import { parseBody } from '@/lib/body';
import { handler } from '@/lib/http';
import { permissionSchema } from '@/lib/admin/schemas';
import { permOut } from '@/lib/admin/roles';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = handler(async (req) => {
  await requireRole(req, 'admin');
  return Response.json((await getDb().select().from(permissions).orderBy(asc(permissions.name))).map(permOut));
});

export const POST = handler(async (req) => {
  await requireRole(req, 'admin');
  const d = permissionSchema.parse((await parseBody(req)).fields);
  const [row] = await getDb().insert(permissions).values(d).returning();
  return Response.json(permOut(row!), { status: 201 });
});
