'use client';

import { useEffect, useState } from 'react';
import { vendorApi } from '@/lib/vendor';
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

// مراحلی که خود رستوران‌دار مجاز به تغییر آن‌هاست (تحویل به پیک/مشتری خارج از این پنل است)
const VENDOR_STATUSES = ['accepted', 'preparing', 'ready_for_pickup', 'cancelled'];

export default function VendorOrdersPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [prepInputs, setPrepInputs] = useState<Record<number, string>>({});

  const load = (p: number) => {
    setLoading(true);
    vendorApi.listOrders(p).then(setData).finally(() => setLoading(false));
  };

  useEffect(() => load(page), [page]);

  const handleStatusChange = async (id: number, status: string) => {
    await vendorApi.updateOrderStatus(id, status);
    load(page);
  };

  const handlePrepSave = async (id: number) => {
    const minutes = Number(prepInputs[id]);
    if (!minutes || minutes < 1) return;
    await vendorApi.updatePreparationTime(id, minutes);
    load(page);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">سفارش‌های رستوران</h1>

      {loading ? (
        <p>در حال بارگذاری...</p>
      ) : (
        <>
          <div className="space-y-3">
            {data?.data?.map((o: any) => (
              <div key={o.id} className="bg-white rounded shadow p-4 text-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold">سفارش #{o.id} — {o.user?.name} — {o.user?.phone}</p>
                    <p className="text-gray-500">{o.delivery_address}</p>
                    <p className="text-gray-500">
                      مبلغ: {Number(o.final_price).toLocaleString()} تومان —{' '}
                      {o.payment_status === 'paid' ? '✅ پرداخت‌شده' : '❌ پرداخت‌نشده'}
                    </p>
                    <ul className="text-gray-500 mt-1">
                      {o.items?.map((item: any) => (
                        <li key={item.id}>{item.product?.name} × {item.quantity}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="text-left space-y-2">
                    {o.payment_status === 'paid' && (
                      <OrderCountdown initialRemainingSeconds={o.remaining_seconds} />
                    )}

                    <select
                      value={o.status}
                      onChange={(e) => handleStatusChange(o.id, e.target.value)}
                      disabled={!o.payment_status || o.payment_status !== 'paid'}
                      className="border rounded p-1 text-sm block"
                    >
                      {VENDOR_STATUSES.map((s) => (
                        <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                      ))}
                      {!VENDOR_STATUSES.includes(o.status) && (
                        <option value={o.status}>{STATUS_LABELS[o.status] ?? o.status}</option>
                      )}
                    </select>

                    <div className="flex gap-1">
                      <input
                        type="number"
                        placeholder="زمان آماده‌سازی (دقیقه)"
                        value={prepInputs[o.id] ?? ''}
                        onChange={(e) => setPrepInputs({ ...prepInputs, [o.id]: e.target.value })}
                        className="border rounded p-1 text-sm w-24"
                      />
                      <button
                        onClick={() => handlePrepSave(o.id)}
                        className="bg-blue-600 text-white px-2 py-1 rounded text-xs"
                      >
                        ثبت زمان
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {data && (
            <div className="flex gap-2 mt-4">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1 border rounded disabled:opacity-50">قبلی</button>
              <span className="px-2 py-1 text-sm text-gray-500">صفحه {data.current_page} از {data.last_page}</span>
              <button disabled={data.current_page >= data.last_page} onClick={() => setPage((p) => p + 1)} className="px-3 py-1 border rounded disabled:opacity-50">بعدی</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
