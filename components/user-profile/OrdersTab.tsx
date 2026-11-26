'use client';

import { useEffect, useState } from 'react';
import { fetchMyOrders } from '@/lib/orders';
import type { Order } from '@/types/models';
import OrderCountdown from '@/components/OrderCountdown';

const STATUS_LABELS: Record<string, string> = {
  pending: 'در انتظار پرداخت',
  accepted: 'تایید شده',
  preparing: 'در حال آماده‌سازی',
  ready_for_pickup: 'آماده تحویل به پیک',
  on_the_way: 'در راه',
  delivered: 'تحویل داده شده',
  cancelled: 'لغو شده',
};

export default function OrdersTab() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyOrders()
      .then((res) => setOrders(res.data ?? []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-center mt-10 text-amber-500">در حال بارگذاری سفارشات...</p>;

  return (
    <div>
      <h2 className="text-xl font-bold mb-4 text-emerald-950">سفارشات من</h2>

      {orders.length === 0 ? (
        <p className="text-gray-500">هنوز سفارشی ثبت نکرده‌اید</p>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="border rounded p-4 flex justify-between items-center">
              <div>
                <p className="font-bold">
                  سفارش #{order.id} — {order.restaurant?.name}
                </p>
                <p className="text-sm text-gray-600">
                  وضعیت: {STATUS_LABELS[order.status] ?? order.status}
                  {' · '}
                  {order.payment_status === 'paid' ? 'پرداخت‌شده' : 'پرداخت‌نشده'}
                </p>
                <p className="text-sm text-gray-600">{order.final_price.toLocaleString()} تومان</p>
              </div>

              <div className="text-left">
                {order.payment_status === 'paid' && order.status !== 'delivered' && order.status !== 'cancelled' ? (
                  <OrderCountdown initialRemainingSeconds={order.remaining_seconds} />
                ) : (
                  <span className="text-xs text-gray-400">—</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
