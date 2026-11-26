'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { Restaurant } from '@/types/models';

interface Props {
  onClose: () => void;
  onCreated: () => void;
  restaurants: Restaurant[];
}

export default function CategoryModal({ onClose, onCreated, restaurants }: Props) {
  const [form, setForm] = useState({
    name: '',
    restaurant_id: '',
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
      formData.append('restaurant_id', form.restaurant_id);
      if (form.image) {
        formData.append('image', form.image);
      }

      await api.post('/admin/categories', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      onCreated();
      onClose();
    } catch (err: any) {
      alert(err.response?.data?.message || 'خطا در افزودن دسته‌بندی');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded w-full max-w-md shadow-lg">
        <h2 className="text-lg font-bold mb-4">افزودن دسته‌بندی</h2>

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
            <label className="block mb-1 text-sm">تصویر</label>
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