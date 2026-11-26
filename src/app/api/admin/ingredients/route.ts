import { desc } from 'drizzle-orm';
import { getDb, ingredients } from '@/db';
import { requireRole } from '@/lib/auth';
import { parseBody } from '@/lib/body';
import { handler } from '@/lib/http';
import { nameOnly } from '@/lib/admin/schemas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const out = (i: typeof ingredients.$inferSelect) => ({ id: i.id, name: i.name, created_at: i.createdAt.toISOString() });

export const GET = handler(async (req) => {
  await requireRole(req, 'admin');
  return Response.json((await getDb().select().from(ingredients).orderBy(desc(ingredients.id))).map(out));
});

export const POST = handler(async (req) => {
  await requireRole(req, 'admin');
  const { name } = nameOnly.parse((await parseBody(req)).fields);
  const [row] = await getDb().insert(ingredients).values({ name }).returning();
  return Response.json(out(row!), { status: 201 });
});
