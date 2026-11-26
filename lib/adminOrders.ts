// lib/adminOrders.ts
import { api } from '@/lib/api';

export async function fetchAdminOrders(page = 1) {
  const res = await api.get(`/admin/orders?page=${page}`);
  return res.data;
}

export async function fetchAdminOrder(id: number) {
  const res = await api.get(`/admin/orders/${id}`);
  return res.data;
}

export async function updateOrderStatus(id: number, status: string) {
  const res = await api.patch(`/admin/orders/${id}/status`, { status });
  return res.data;
}

export interface PaymentGatewaySettingDTO {
  id: number;
  key: 'zarinpal' | 'mellat';
  name: string;
  is_enabled: boolean;
  sandbox: boolean;
  merchant_id?: string | null;
  terminal_id?: string | null;
  username?: string | null;
}

export async function fetchPaymentGateways(): Promise<PaymentGatewaySettingDTO[]> {
  const res = await api.get('/admin/payment-gateways');
  return res.data;
}

export async function createPaymentGateway(key: 'zarinpal' | 'mellat'): Promise<PaymentGatewaySettingDTO> {
  const res = await api.post('/admin/payment-gateways', { key });
  return res.data;
}

export async function updatePaymentGateway(id: number, data: Partial<PaymentGatewaySettingDTO> & { password?: string }) {
  const res = await api.put(`/admin/payment-gateways/${id}`, data);
  return res.data;
}

export async function fetchTransactions(page = 1, filters: { status?: string; gateway?: string } = {}) {
  const res = await api.get('/admin/transactions', { params: { page, ...filters } });
  return res.data;
}

export async function fetchTransaction(id: number) {
  const res = await api.get(`/admin/transactions/${id}`);
  return res.data;
}
