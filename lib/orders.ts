// lib/orders.ts
import { api } from '@/lib/api';
import type { Order, PaymentGateway } from '@/types/models';

export interface CreateOrderPayload {
  restaurant_id: number;
  delivery_address: string;
  delivery_lat?: number | null;
  delivery_lng?: number | null;
  items: {
    product_id: number;
    quantity: number;
    extras?: { extra_id: number; quantity: number }[];
  }[];
}

export async function createOrder(payload: CreateOrderPayload): Promise<Order> {
  const res = await api.post('/orders', payload);
  return res.data;
}

export async function fetchGateways(): Promise<PaymentGateway[]> {
  const res = await api.get('/payment/gateways');
  return res.data;
}

export async function payOrder(orderId: number, gateway: 'zarinpal' | 'mellat'): Promise<string> {
  const res = await api.post(`/orders/${orderId}/pay`, { gateway });
  return res.data.redirect_url;
}

export async function fetchMyOrders(): Promise<{ data: Order[]; [key: string]: any }> {
  const res = await api.get('/orders');
  return res.data;
}

export async function fetchOrder(orderId: number): Promise<Order> {
  const res = await api.get(`/orders/${orderId}`);
  return res.data;
}
