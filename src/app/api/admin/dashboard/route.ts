import { requireRole } from '@/lib/auth';
import { handler } from '@/lib/http';
import { overview } from '@/lib/stats';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = handler(async (req) => {
  await requireRole(req, 'admin');
  return Response.json(await overview());
});
