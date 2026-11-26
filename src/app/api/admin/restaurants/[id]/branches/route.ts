import { desc, eq } from 'drizzle-orm';
import { branches, getDb } from '@/db';
import { requireRole } from '@/lib/auth';
import { handler, parseId, type IdCtx } from '@/lib/http';
import { serializeBranch } from '@/lib/serialize';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = handler<IdCtx>(async (req, ctx) => {
  await requireRole(req, 'admin');
  const rows = await getDb().select().from(branches).where(eq(branches.restaurantId, parseId((await ctx.params).id))).orderBy(desc(branches.id));
  return Response.json(rows.map(serializeBranch));
});
