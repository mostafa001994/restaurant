import { handler } from '@/lib/http';
import { availableGateways } from '@/lib/payment/service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = handler(async () => Response.json(await availableGateways()));
