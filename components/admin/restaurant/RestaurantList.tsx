'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Restaurant } from '@/types/models';
import RestaurantDetails from './RestaurantDetails';

export default function RestaurantList({ onEdit }: { onEdit: (restaurant: Restaurant) => void }) {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<number | null>(null);

  const loadRestaurants = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/restaurants?page=${page}`);
      setRestaurants(res.data.data);
      setLastPage(res.data.last_page);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRestaurants();
  }, [page]);

  const handleDelete = async (id: number) => {
    if (!confirm('آیا از حذف این رستوران مطمئن هستید؟')) return;
    try {
      await api.delete(`/admin/restaurants/${id}`);
      loadRestaurants();
    } catch (err: any) {
      alert(err.response?.data?.message || 'خطا در حذف رستوران');
    }
  };

  return (
    <div className="bg-white p-4 rounded shadow">
      <h2 className="text-lg font-bold mb-4">لیست رستوران‌ها</h2>

      {loading ? (
        <div className="text-center py-4">در حال بارگذاری...</div>
      ) : (
        <table className="w-full border text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border">نام</th>
              <th className="p-2 border">مالک</th>
              <th className="p-2 border">وضعیت</th>
              <th className="p-2 border">باز/بسته</th>
              <th className="p-2 border">عملیات</th>
            </tr>
          </thead>
          <tbody>
            {restaurants.map(r => (
              <tr key={r.id}>
                <td className="p-2 border">{r.name}</td>
                <td className="p-2 border">{r.user?.name || '-'}</td>
                <td className="p-2 border">{r.status}</td>
                <td className="p-2 border">{r.is_open ? 'باز' : 'بسته'}</td>
                <td className="p-2 border flex flex-wrap gap-2">
                  <button
                    onClick={() => onEdit(r)}
                    className="px-2 py-1 bg-blue-500 text-white rounded"
                  >
                    ویرایش
                  </button>
                  <button
                    onClick={() => handleDelete(r.id)}
                    className="px-2 py-1 bg-red-500 text-white rounded"
                  >
                    حذف
                  </button>
                  <button
                    onClick={() => setSelectedRestaurantId(r.id)}
                    className="px-2 py-1 bg-purple-600 text-white rounded"
                  >
                    مشاهده جزئیات
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* صفحه‌بندی */}
      <div className="flex gap-2 mt-4 justify-center">
        {Array.from({ length: lastPage }, (_, i) => i + 1).map(p => (
          <button
            key={p}
            onClick={() => setPage(p)}
            className={`px-3 py-1 rounded ${p === page ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* مودال جزئیات */}
      {selectedRestaurantId && (
        <RestaurantDetails
          restaurantId={selectedRestaurantId}
          onClose={() => setSelectedRestaurantId(null)}
        />
      )}
    </div>
  );
}