'use client';

import { useEffect, useState } from 'react';
import { fetchRecentOrders } from '@/lib/dashboard';

const STATUS_LABELS: Record<string, string> = {
  pending: 'در انتظار پرداخت',
  accepted: 'تایید شده',
  preparing: 'در حال آماده‌سازی',
  ready_for_pickup: 'آماده تحویل به پیک',
  on_the_way: 'در راه',
  delivered: 'تحویل داده شده',
  cancelled: 'لغو شده',
};

export default function RecentOrdersList() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentOrders()
      .then(setOrders)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="font-bold mb-3">آخرین سفارش‌ها</h3>

      {loading ? (
        <p className="text-sm text-gray-500">در حال بارگذاری...</p>
      ) : orders.length === 0 ? (
        <p className="text-sm text-gray-500">سفارشی ثبت نشده است</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-right text-gray-500 border-b">
              <th className="py-2">#</th>
              <th>مشتری</th>
              <th>رستوران</th>
              <th>مبلغ</th>
              <th>وضعیت</th>
              <th>پرداخت</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b last:border-0">
                <td className="py-2">{o.id}</td>
                <td>{o.user?.name ?? '—'}</td>
                <td>{o.restaurant?.name ?? '—'}</td>
                <td>{Number(o.final_price).toLocaleString()} تومان</td>
                <td>{STATUS_LABELS[o.status] ?? o.status}</td>
                <td>{o.payment_status === 'paid' ? '✅' : '❌'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
