import { asc } from 'drizzle-orm';
import { getDb, paymentGatewaySettings } from '@/db';
import { requireRole } from '@/lib/auth';
import { GATEWAY_NAMES } from '@/lib/payment/gateways';
import { ensureGateways } from '@/lib/payment/service';
import { handler, HttpError, readJson } from '@/lib/http';
import { serializeGateway } from '@/lib/payment/serialize';
import { gatewayCreateSchema } from '@/lib/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = handler(async (req) => {
  await requireRole(req, 'admin');
  await ensureGateways();
  const rows = await getDb().select().from(paymentGatewaySettings).orderBy(asc(paymentGatewaySettings.key));
  return Response.json(rows.map(serializeGateway)); // رمز هرگز برنمی‌گردد
});

export const POST = handler(async (req) => {
  await requireRole(req, 'admin');
  const { key } = gatewayCreateSchema.parse(await readJson(req));
  const [row] = await getDb().insert(paymentGatewaySettings).values({ key, name: GATEWAY_NAMES[key]! }).onConflictDoNothing().returning();
  if (!row) throw new HttpError(422, 'این درگاه قبلاً ثبت شده است');
  return Response.json(serializeGateway(row), { status: 201 });
});
