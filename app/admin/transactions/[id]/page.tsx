'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { fetchTransaction } from '@/lib/adminOrders';

export default function TransactionDetailPage() {
  const params = useParams();
  const [tx, setTx] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransaction(Number(params.id))
      .then(setTx)
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <p>در حال بارگذاری...</p>;
  if (!tx) return <p>تراکنش پیدا نشد</p>;

  return (
    <div>
      <Link href="/admin/transactions" className="text-blue-600 hover:underline text-sm">
        ← بازگشت به لیست پرداخت‌ها
      </Link>

      <h1 className="text-2xl font-bold mt-2 mb-6">جزئیات تراکنش #{tx.id}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded shadow p-4 space-y-2 text-sm">
          <h2 className="font-bold mb-2">اطلاعات تراکنش</h2>
          <p>مبلغ: {Number(tx.amount).toLocaleString()} تومان</p>
          <p>درگاه: {tx.gateway === 'zarinpal' ? 'زرین‌پال' : tx.gateway === 'mellat' ? 'ملت' : tx.gateway}</p>
          <p>کد پیگیری: {tx.transaction_id ?? '—'}</p>
          <p>وضعیت: {tx.status}</p>
          <p>تاریخ: {new Date(tx.created_at).toLocaleString('fa-IR')}</p>
        </div>

        <div className="bg-white rounded shadow p-4 space-y-2 text-sm">
          <h2 className="font-bold mb-2">اطلاعات کاربر و سفارش</h2>
          <p>کاربر: {tx.user?.name} — {tx.user?.phone}</p>
          <p>رستوران: {tx.restaurant?.name}</p>
          {tx.order && (
            <>
              <p>شماره سفارش: #{tx.order.id}</p>
              <p>وضعیت سفارش: {tx.order.status}</p>
              <div className="mt-2">
                <p className="font-bold">آیتم‌ها:</p>
                <ul className="list-disc pr-5">
                  {tx.order.items?.map((item: any) => (
                    <li key={item.id}>
                      {item.product?.name} × {item.quantity} — {Number(item.total_price).toLocaleString()} تومان
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>

        {tx.meta && (
          <div className="bg-white rounded shadow p-4 md:col-span-2">
            <h2 className="font-bold mb-2 text-sm">پاسخ خام درگاه پرداخت</h2>
            <pre className="text-xs bg-gray-50 p-3 rounded overflow-x-auto" dir="ltr">
              {JSON.stringify(tx.meta, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
