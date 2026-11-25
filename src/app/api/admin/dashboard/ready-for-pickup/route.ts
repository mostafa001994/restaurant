import { and, eq } from 'drizzle-orm';
import { orders } from '@/db';
import { requireRole } from '@/lib/auth';
import { handler } from '@/lib/http';
import { dashboardOrders } from '@/lib/admin/dashboard-orders';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// اول سفارش‌هایی که زودتر آماده شده‌اند (FIFO برای اختصاص پیک)
export const GET = handler(async (req) => {
  await requireRole(req, 'admin');
  return Response.json(await dashboardOrders({ where: and(eq(orders.paymentStatus, 'paid'), eq(orders.status, 'ready_for_pickup')), oldestFirst: true, withPhone: true }));
});
