'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchTransactions } from '@/lib/adminOrders';

const STATUS_LABELS: Record<string, string> = {
  pending: 'در انتظار',
  success: 'موفق',
  failed: 'ناموفق',
  refunded: 'بازگشت‌خورده',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  success: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  refunded: 'bg-gray-100 text-gray-700',
};

export default function TransactionsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');

  useEffect(() => {
    setLoading(true);
    fetchTransactions(page, status ? { status } : {})
      .then(setData)
      .finally(() => setLoading(false));
  }, [page, status]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">لیست پرداخت‌ها</h1>

      <div className="mb-4">
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="border rounded p-2 text-sm"
        >
          <option value="">همه وضعیت‌ها</option>
          <option value="pending">در انتظار</option>
          <option value="success">موفق</option>
          <option value="failed">ناموفق</option>
          <option value="refunded">بازگشت‌خورده</option>
        </select>
      </div>

      {loading ? (
        <p>در حال بارگذاری...</p>
      ) : (
        <>
          <table className="w-full bg-white rounded shadow text-sm">
            <thead>
              <tr className="text-right text-gray-500 border-b">
                <th className="p-2">#</th>
                <th>کاربر</th>
                <th>رستوران</th>
                <th>مبلغ</th>
                <th>درگاه</th>
                <th>وضعیت</th>
                <th>تاریخ</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data?.data?.map((t: any) => (
                <tr key={t.id} className="border-b last:border-0">
                  <td className="p-2">{t.id}</td>
                  <td>{t.user?.name ?? '—'}</td>
                  <td>{t.restaurant?.name ?? '—'}</td>
                  <td>{Number(t.amount).toLocaleString()} تومان</td>
                  <td>{t.gateway === 'zarinpal' ? 'زرین‌پال' : t.gateway === 'mellat' ? 'ملت' : t.gateway}</td>
                  <td>
                    <span className={`px-2 py-1 rounded text-xs ${STATUS_COLORS[t.status] ?? ''}`}>
                      {STATUS_LABELS[t.status] ?? t.status}
                    </span>
                  </td>
                  <td className="text-gray-500">{new Date(t.created_at).toLocaleDateString('fa-IR')}</td>
                  <td>
                    <Link href={`/admin/transactions/${t.id}`} className="text-blue-600 hover:underline">
                      جزئیات
                    </Link>
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
