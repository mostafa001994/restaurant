import { eq } from 'drizzle-orm';
import { getDb, paymentGatewaySettings } from '@/db';
import { requireRole } from '@/lib/auth';
import { encryptSecret } from '@/lib/crypto';
import { handler, HttpError, parseId, readJson, type IdCtx } from '@/lib/http';
import { serializeGateway } from '@/lib/payment/serialize';
import { gatewayUpdateSchema } from '@/lib/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const PUT = handler<IdCtx>(async (req, ctx) => {
  await requireRole(req, 'admin');
  const id = parseId((await ctx.params).id);
  const d = gatewayUpdateSchema.parse(await readJson(req));
  const db = getDb();

  const [cur] = await db.select().from(paymentGatewaySettings).where(eq(paymentGatewaySettings.id, id)).limit(1);
  if (!cur) throw new HttpError(404, 'درگاه یافت نشد');

  const next = {
    isEnabled: d.is_enabled ?? cur.isEnabled,
    sandbox: d.sandbox ?? cur.sandbox,
    merchantId: d.merchant_id !== undefined ? d.merchant_id || null : cur.merchantId,
    terminalId: d.terminal_id !== undefined ? d.terminal_id || null : cur.terminalId,
    username: d.username !== undefined ? d.username || null : cur.username,
    passwordEnc: d.password ? encryptSecret(d.password) : cur.passwordEnc,
  };

  // جلوگیری از فعال‌کردن درگاهِ ناقص (واقعی)
  if (next.isEnabled) {
    if (cur.key === 'zarinpal' && !next.sandbox && !next.merchantId) throw new HttpError(422, 'برای زرین‌پال واقعی، merchant_id لازم است');
    if (cur.key === 'mellat' && (!next.terminalId || !next.username || !next.passwordEnc)) throw new HttpError(422, 'برای بانک ملت، شماره ترمینال، نام کاربری و رمز لازم است');
  }

  const [row] = await db.update(paymentGatewaySettings).set({ ...next, updatedAt: new Date() }).where(eq(paymentGatewaySettings.id, id)).returning();
  return Response.json(serializeGateway(row!));
});
