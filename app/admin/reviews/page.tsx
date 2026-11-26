'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function AdminReviewsPage() {
  const [data, setData] = useState<any>(null);
  const [status, setStatus] = useState<'pending' | 'approved' | ''>('pending');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get('/admin/reviews', { params: status ? { status } : {} })
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(load, [status]);

  const handleApprove = async (id: number, approve: boolean) => {
    await api.patch(`/admin/reviews/${id}`, { is_approved: approve });
    load();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('حذف این نظر؟')) return;
    await api.delete(`/admin/reviews/${id}`);
    load();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">مدیریت نظرات</h1>

      <div className="flex gap-2 mb-4">
        {(['pending', 'approved', ''] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`text-sm px-3 py-1 rounded-full border ${status === s ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300'}`}
          >
            {s === 'pending' ? 'در انتظار تایید' : s === 'approved' ? 'تاییدشده' : 'همه'}
          </button>
        ))}
      </div>

      {loading ? (
        <p>در حال بارگذاری...</p>
      ) : data?.data?.length === 0 ? (
        <p className="text-gray-500 text-sm">نظری در این وضعیت وجود ندارد</p>
      ) : (
        <div className="space-y-3">
          {data?.data?.map((r: any) => (
            <div key={r.id} className="bg-white rounded shadow p-4 text-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold">{r.product?.name} — {r.user?.name}</p>
                  <p className="text-amber-600">{'⭐'.repeat(r.rating)}</p>
                  <p className="text-gray-600 mt-1">{r.comment}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(r.created_at).toLocaleDateString('fa-IR')}</p>
                </div>
                <div className="flex gap-2">
                  {!r.is_approved ? (
                    <button onClick={() => handleApprove(r.id, true)} className="text-green-600 hover:underline">تایید</button>
                  ) : (
                    <button onClick={() => handleApprove(r.id, false)} className="text-amber-600 hover:underline">لغو تایید</button>
                  )}
                  <button onClick={() => handleDelete(r.id)} className="text-red-500 hover:underline">حذف</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
