import { requireRole } from '@/lib/auth';
import { handler } from '@/lib/http';
import { dashboardOrders } from '@/lib/admin/dashboard-orders';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = handler(async (req) => {
  await requireRole(req, 'admin');
  const limit = Math.min(Math.max(Number(new URL(req.url).searchParams.get('limit')) || 10, 1), 50);
  return Response.json(await dashboardOrders({ limit }));
});
