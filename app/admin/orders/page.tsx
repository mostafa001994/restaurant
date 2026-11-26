'use client';

import { useEffect, useState } from 'react';
import { fetchAdminOrders, updateOrderStatus } from '@/lib/adminOrders';

const STATUSES = ['pending', 'accepted', 'preparing', 'ready_for_pickup', 'on_the_way', 'delivered', 'cancelled'];

const STATUS_LABELS: Record<string, string> = {
  pending: 'در انتظار پرداخت',
  accepted: 'تایید شده',
  preparing: 'در حال آماده‌سازی',
  ready_for_pickup: 'آماده تحویل به پیک',
  on_the_way: 'در راه',
  delivered: 'تحویل داده شده',
  cancelled: 'لغو شده',
};

export default function AdminOrdersPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const load = (p: number) => {
    setLoading(true);
    fetchAdminOrders(p)
      .then(setData)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load(page);
  }, [page]);

  const handleStatusChange = async (id: number, status: string) => {
    await updateOrderStatus(id, status);
    load(page);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">مدیریت سفارش‌ها</h1>

      {loading ? (
        <p>در حال بارگذاری...</p>
      ) : (
        <>
          <table className="w-full bg-white rounded shadow text-sm">
            <thead>
              <tr className="text-right text-gray-500 border-b">
                <th className="p-2">#</th>
                <th>مشتری</th>
                <th>رستوران</th>
                <th>مبلغ</th>
                <th>پرداخت</th>
                <th>وضعیت</th>
              </tr>
            </thead>
            <tbody>
              {data?.data?.map((o: any) => (
                <tr key={o.id} className="border-b last:border-0">
                  <td className="p-2">{o.id}</td>
                  <td>{o.user?.name ?? '—'}</td>
                  <td>{o.restaurant?.name ?? '—'}</td>
                  <td>{Number(o.final_price).toLocaleString()} تومان</td>
                  <td>{o.payment_status === 'paid' ? '✅ پرداخت‌شده' : '❌ پرداخت‌نشده'}</td>
                  <td className="p-2">
                    <select
                      value={o.status}
                      onChange={(e) => handleStatusChange(o.id, e.target.value)}
                      className="border rounded p-1 text-sm"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABELS[s]}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {data && (
            <div className="flex gap-2 mt-4">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                قبلی
              </button>
              <span className="px-2 py-1 text-sm text-gray-500">
                صفحه {data.current_page} از {data.last_page}
              </span>
              <button
                disabled={data.current_page >= data.last_page}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                بعدی
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
