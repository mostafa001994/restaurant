'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Restaurant, Branch, Category, Product } from '@/types/models';

export default function RestaurantDetails({ restaurantId, onClose }: { restaurantId: number; onClose: () => void }) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [resRestaurant, resBranches, resCategories] = await Promise.all([
          api.get(`/admin/restaurants/${restaurantId}`),
          api.get(`/admin/restaurants/${restaurantId}/branches`),
          api.get(`/admin/restaurants/${restaurantId}/categories?_with=products`),
        ]);

        setRestaurant(resRestaurant.data);
        setBranches(resBranches.data);
        setCategories(resCategories.data);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [restaurantId]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded shadow-lg">در حال بارگذاری...</div>
      </div>
    );
  }

  if (!restaurant) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white p-6 rounded w-full max-w-4xl shadow-lg space-y-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold">اطلاعات رستوران</h2>

        {/* اطلاعات پایه */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><strong>نام:</strong> {restaurant.name}</div>
          <div><strong>مالک:</strong> {restaurant.user?.name}</div>
          <div><strong>آدرس:</strong> {restaurant.address}</div>
          <div><strong>وضعیت:</strong> {restaurant.status}</div>
          <div><strong>باز است؟</strong> {restaurant.is_open ? 'بله' : 'خیر'}</div>
          <div><strong>ساعت کاری:</strong> {restaurant.open_time} - {restaurant.close_time}</div>
        </div>

        {/* تصاویر */}
        <div className="flex gap-4 mt-4">
          {restaurant.logo && <img src={restaurant.logo} alt="لوگو" className="w-20 h-20 object-cover rounded" />}
          {restaurant.cover_image && <img src={restaurant.cover_image} alt="کاور" className="w-40 h-20 object-cover rounded" />}
        </div>

        {/* شعب */}
        <div>
          <h3 className="text-lg font-semibold mt-6 mb-2">شعب</h3>
          {branches.length === 0 ? (
            <div className="text-gray-500 text-sm">هیچ شعبه‌ای ثبت نشده</div>
          ) : (
            <ul className="list-disc pl-5 text-sm">
              {branches.map(b => (
                <li key={b.id}>
                  <strong>{b.name}</strong> — {b.address} ({b.phone})
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* دسته‌بندی‌ها و منو */}
        <div>
          <h3 className="text-lg font-semibold mt-6 mb-2">منو</h3>
          {categories.length === 0 ? (
            <div className="text-gray-500 text-sm">هیچ دسته‌بندی‌ای ثبت نشده</div>
          ) : (
            categories.map(cat => (
              <div key={cat.id} className="mb-4">
                <h4 className="font-bold text-sm mb-1">{cat.name}</h4>
                {cat.products?.length ? (
                  <ul className="list-disc pl-5 text-sm">
                    {cat.products.map(p => (
                      <li key={p.id}>
                        {p.name} — {p.price} تومان
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-gray-400 text-xs">بدون محصول</div>
                )}
              </div>
            ))
          )}
        </div>

        <div className="flex justify-end mt-6">
          <button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded">بستن</button>
        </div>
      </div>
    </div>
  );
}