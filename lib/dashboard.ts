// lib/dashboard.ts
import { api } from '@/lib/api';

export interface DashboardOverview {
  orders_count: number;
  revenue: number;
  users_count: number;
  restaurants_count: number;
}

export type ChartMetric = 'orders' | 'revenue' | 'users' | 'restaurants';
export type ChartPeriod = 'day' | 'week' | 'month' | 'year';

export interface ChartPoint {
  label: string;
  value: number;
}

export async function fetchOverview(): Promise<DashboardOverview> {
  const res = await api.get('/admin/dashboard');
  return res.data;
}

export async function fetchChart(metric: ChartMetric, period: ChartPeriod): Promise<ChartPoint[]> {
  const res = await api.get('/admin/dashboard/chart', { params: { metric, period } });
  return res.data;
}

export async function fetchRecentOrders() {
  const res = await api.get('/admin/dashboard/recent-orders');
  return res.data;
}

export async function fetchReadyForPickup() {
  const res = await api.get('/admin/dashboard/ready-for-pickup');
  return res.data;
}
