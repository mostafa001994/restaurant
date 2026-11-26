import type { paymentGatewaySettings } from '@/db';

export function serializeGateway(r: typeof paymentGatewaySettings.$inferSelect) {
  return {
    id: r.id,
    key: r.key,
    name: r.name,
    is_enabled: r.isEnabled,
    sandbox: r.sandbox,
    merchant_id: r.merchantId,
    terminal_id: r.terminalId,
    username: r.username,
    has_password: !!r.passwordEnc,
    created_at: r.createdAt.toISOString(),
  };
}

export function serializeTransaction(t: typeof import('@/db').transactions.$inferSelect) {
  return {
    id: t.id,
    order_id: t.orderId,
    user_id: t.userId,
    restaurant_id: t.restaurantId,
    amount: Number(t.amount),
    currency: t.currency,
    type: t.type,
    gateway: t.gateway,
    transaction_id: t.transactionId,
    status: t.status,
    meta: t.meta,
    created_at: t.createdAt.toISOString(),
  };
}
