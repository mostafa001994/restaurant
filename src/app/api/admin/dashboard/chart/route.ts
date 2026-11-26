import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { handler } from '@/lib/http';
import { chart } from '@/lib/stats';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const q = z.object({
  metric: z.enum(['orders', 'revenue', 'users', 'restaurants'], { message: 'معیار نامعتبر است' }),
  period: z.enum(['day', 'week', 'month', 'year'], { message: 'بازه‌ی زمانی نامعتبر است' }),
});

export const GET = handler(async (req) => {
  await requireRole(req, 'admin');
  const p = q.parse(Object.fromEntries(new URL(req.url).searchParams));
  return Response.json(await chart(p.metric, p.period));
});
