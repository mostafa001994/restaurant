'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Branch } from '@/types/models';

export default function RestaurantBranchesModal({ restaurantId, onClose }: { restaurantId: number; onClose: () => void }) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/admin/restaurants/${restaurantId}/branches`).then(res => {
      setBranches(res.data);
      setLoading(false);
    });
  }, [restaurantId]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded w-full max-w-lg shadow-lg overflow-y-auto max-h-[90vh]">
        <h2 className="text-lg font-bold mb-4">شعب رستوران</h2>

        {loading ? (
          <div className="text-center py-4">در حال بارگذاری...</div>
        ) : branches.length === 0 ? (
          <div className="text-center text-gray-500">هیچ شعبه‌ای ثبت نشده</div>
        ) : (
          <table className="w-full border text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 border">نام شعبه</th>
                <th className="p-2 border">آدرس</th>
                <th className="p-2 border">تلفن</th>
              </tr>
            </thead>
            <tbody>
              {branches.map(b => (
                <tr key={b.id}>
                  <td className="p-2 border">{b.name}</td>
                  <td className="p-2 border">{b.address}</td>
                  <td className="p-2 border">{b.phone}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="flex justify-end mt-4">
          <button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded">بستن</button>
        </div>
      </div>
    </div>
  );
}