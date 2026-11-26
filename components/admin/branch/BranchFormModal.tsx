'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Branch, Restaurant } from '@/types/models';

interface Props {
  branch?: Branch;
  onClose: () => void;
  onSaved: () => void;
}

export default function BranchFormModal({ branch, onClose, onSaved }: Props) {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [form, setForm] = useState({
    restaurant_id: branch?.restaurant_id || '',
    name: branch?.name || '',
    address: branch?.address || '',
    phone: branch?.phone || '',
  });
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    api.get('/admin/restaurants').then(res => {
      setRestaurants(res.data.data || res.data);
    });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    try {
      if (branch) {
        await api.put(`/admin/branches/${branch.id}`, form);
      } else {
        await api.post('/admin/branches', form);
      }
      onSaved();
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'خطا در ذخیره شعبه';
      setErrors([msg]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded w-full max-w-md shadow-lg">
        <h2 className="text-lg font-bold mb-4">{branch ? 'ویرایش شعبه' : 'ایجاد شعبه'}</h2>

        {errors.length > 0 && (
          <div className="bg-red-100 text-red-700 p-2 rounded mb-3 text-sm">
            {errors.map((err, i) => <div key={i}>{err}</div>)}
          </div>
        )}

        <select
          name="restaurant_id"
          value={form.restaurant_id}
          onChange={handleChange}
          className="w-full mb-2 p-2 border rounded"
          required
        >
          <option value="">انتخاب رستوران</option>
          {restaurants.map(r => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>

        <input name="name" placeholder="نام شعبه" value={form.name} onChange={handleChange} className="w-full mb-2 p-2 border rounded" required />
        <input name="address" placeholder="آدرس" value={form.address} onChange={handleChange} className="w-full mb-2 p-2 border rounded" />
        <input name="phone" placeholder="تلفن" value={form.phone} onChange={handleChange} className="w-full mb-2 p-2 border rounded" />

        <div className="flex justify-end gap-2 mt-4">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-300 rounded">انصراف</button>
          <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded">ذخیره</button>
        </div>
      </form>
    </div>
  );
}