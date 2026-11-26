'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Category, Restaurant } from '@/types/models';
import CategoryModal from '@/components/admin/category/CategoryModal';
import CategoryEditModal from '@/components/admin/category/CategoryEditModal';

export default function CategoryListPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const loadCategories = () => {
    api.get('/admin/categories')
      .then(res => {
        if (Array.isArray(res.data.data)) {
          setCategories(res.data.data);
        } else if (Array.isArray(res.data.items)) {
          setCategories(res.data.items);
        } else if (Array.isArray(res.data)) {
          setCategories(res.data);
        } else {
          setCategories([]);
        }
      })
      .catch(() => setCategories([]));
  };

  const loadRestaurants = () => {
    api.get('/admin/restaurants')
      .then(res => {
        if (Array.isArray(res.data.data)) {
          setRestaurants(res.data.data);
        } else if (Array.isArray(res.data.items)) {
          setRestaurants(res.data.items);
        } else if (Array.isArray(res.data)) {
          setRestaurants(res.data);
        } else {
          setRestaurants([]);
        }
      })
      .catch(() => setRestaurants([]));
  };

  useEffect(() => {
    loadCategories();
    loadRestaurants();
  }, []);

  return (
    <div className="p-4">
      <button
        onClick={() => setShowCreateModal(true)}
        className="bg-blue-600 text-white px-4 py-2 rounded mb-4"
      >
        افزودن دسته‌بندی
      </button>

      <table className="w-full border text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2">تصویر</th>
            <th className="p-2">نام</th>
            <th className="p-2">رستوران</th>
            <th className="p-2">عملیات</th>
          </tr>
        </thead>
        <tbody>
          {categories.map(cat => (
            <tr key={cat.id} className="border-t">
              <td className="p-2">
                {cat.image ? (
                  <img
                    src={`${process.env.NEXT_PUBLIC_API_URL}/storage/${cat.image}`}
                    alt={cat.name}
                    className="w-12 h-12 object-cover rounded"
                  />
                ) : '—'}
              </td>
              <td className="p-2">{cat.name}</td>
              <td className="p-2">{cat.restaurant?.name ?? '—'}</td>
              <td className="p-2 flex gap-2">
                <button
                  onClick={() => {
                    setSelectedCategory(cat);
                    setShowEditModal(true);
                  }}
                  className="text-blue-600 hover:underline"
                >
                  ویرایش
                </button>
                <button
                  onClick={async () => {
                    if (!confirm('آیا مطمئن هستید؟')) return;
                    await api.delete(`/admin/categories/${cat.id}`);
                    loadCategories();
                  }}
                  className="text-red-600 hover:underline"
                >
                  حذف
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showCreateModal && (
        <CategoryModal
          onClose={() => setShowCreateModal(false)}
          onCreated={loadCategories}
          restaurants={restaurants}
        />
      )}

      {showEditModal && selectedCategory && (
        <CategoryEditModal
          category={selectedCategory}
          onClose={() => {
            setShowEditModal(false);
            setSelectedCategory(null);
          }}
          onUpdated={loadCategories}
          restaurants={restaurants}
        />
      )}
    </div>
  );
}