'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { Category, Restaurant } from '@/types/models';

interface Props {
  category: Category;
  onClose: () => void;
  onUpdated: () => void;
  restaurants: Restaurant[];
}

export default function CategoryEditModal({ category, onClose, onUpdated, restaurants }: Props) {
  const [form, setForm] = useState({
    name: category.name || '',
    restaurant_id: category.restaurant_id || '',
    image: null as File | null
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, files } = e.target as HTMLInputElement;
    if (name === 'image' && files) {
      setForm({ ...form, image: files[0] });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('restaurant_id', String(form.restaurant_id)); // ← تبدیل به رشته
      if (form.image instanceof File) {
        formData.append('image', form.image);
      }

      // استفاده از _method=PUT برای آپدیت
      await api.post(`/admin/categories/${category.id}?_method=PUT`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      onUpdated(); // بعد از ذخیره، لیست رو به‌روز کن
      onClose();
    } catch (err: any) {
      alert(err.response?.data?.message || 'خطا در ویرایش دسته‌بندی');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded w-full max-w-md shadow-lg">
        <h2 className="text-lg font-bold mb-4">ویرایش دسته‌بندی</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 text-sm">نام دسته‌بندی</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full border rounded p-2"
              required
            />
          </div>

          <div>
            <label className="block mb-1 text-sm">انتخاب رستوران</label>
            <select
              name="restaurant_id"
              value={form.restaurant_id}
              onChange={handleChange}
              className="w-full border rounded p-2"
              required
            >
              <option value="">انتخاب کنید</option>
              {restaurants.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-1 text-sm">تصویر جدید (اختیاری)</label>
            <input
              type="file"
              name="image"
              accept="image/*"
              onChange={handleChange}
              className="w-full border rounded p-2"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 rounded"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              {loading ? 'در حال ذخیره...' : 'ذخیره'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}