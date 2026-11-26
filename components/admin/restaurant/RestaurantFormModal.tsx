'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Restaurant, User } from '@/types/models';
import dynamic from 'next/dynamic';
import BaseModal from '@/components/ui/BaseModal';
import { getImageUrl } from '@/lib/helpers';

const LocationPicker = dynamic(() => import('@/components/location/LocationPicker'), { ssr: false });

interface Props {
  restaurant?: Restaurant;
  onClose: () => void;
  onSaved: () => void;
}

export default function RestaurantFormModal({ restaurant, onClose, onSaved }: Props) {
  const [owners, setOwners] = useState<User[]>([]);
  const [form, setForm] = useState({
    user_id: restaurant?.user_id || '',
    name: restaurant?.name || '',
    description: restaurant?.description || '',
    address: restaurant?.address || '',
    latitude: restaurant?.latitude?.toString() || '',
    longitude: restaurant?.longitude?.toString() || '',
    open_time: restaurant?.open_time || '',
    close_time: restaurant?.close_time || '',
    is_open: restaurant?.is_open ? 1 : 0,
    status: restaurant?.status || 'active',
  });
  const [logo, setLogo] = useState<File | null>(null);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    api.get('/admin/users?role=restaurant_owner').then(res => {
      setOwners(res.data.data || res.data);
    });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    const data = new FormData();
    Object.entries(form).forEach(([key, value]) => data.append(key, String(value)));
    if (logo) data.append('logo', logo);
    if (coverImage) data.append('cover_image', coverImage);

    try {
      if (restaurant) {
        await api.post(`/admin/restaurants/${restaurant.id}?_method=PUT`, data);
      } else {
        await api.post('/admin/restaurants', data);
      }
      onSaved();
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'خطا در ذخیره رستوران';
      setErrors([msg]);
    }
  };

  return (
    <BaseModal onClose={onClose} widthClass="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-3">
        <h2 className="text-lg font-bold mb-4">{restaurant ? 'ویرایش رستوران' : 'ایجاد رستوران'}</h2>

        {errors.length > 0 && (
          <div className="bg-red-100 text-red-700 p-2 rounded mb-3 text-sm">
            {errors.map((err, i) => (
              <div key={i}>{err}</div>
            ))}
          </div>
        )}

        {/* انتخاب مالک */}
        <select
          name="user_id"
          value={form.user_id}
          onChange={handleChange}
          className="w-full mb-2 p-2 border rounded"
          required
        >
          <option value="">انتخاب مالک رستوران</option>
          {owners.map(o => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>

        <input
          name="name"
          placeholder="نام"
          value={form.name}
          onChange={handleChange}
          className="w-full mb-2 p-2 border rounded"
          required
        />
        <textarea
          name="description"
          placeholder="توضیحات"
          value={form.description}
          onChange={handleChange}
          className="w-full mb-2 p-2 border rounded"
        />

        {/* موقعیت روی نقشه */}
        <LocationPicker
          initial={{
            lat: form.latitude ? parseFloat(form.latitude) : 35.6892,
            lng: form.longitude ? parseFloat(form.longitude) : 51.389,
            address: form.address || 'تهران',
          }}
          onConfirm={loc => {
            setForm({
              ...form,
              address: loc.address,
              latitude: loc.lat.toString(),
              longitude: loc.lng.toString(),
            });
          }}
        />

        {/* زمان‌ها */}
        <input type="time" name="open_time" value={form.open_time} onChange={handleChange} className="w-full mb-2 p-2 border rounded" />
        <input type="time" name="close_time" value={form.close_time} onChange={handleChange} className="w-full mb-2 p-2 border rounded" />

        {/* وضعیت */}
        <select name="is_open" value={form.is_open} onChange={handleChange} className="w-full mb-2 p-2 border rounded">
          <option value={1}>باز است</option>
          <option value={0}>بسته است</option>
        </select>

        <select name="status" value={form.status} onChange={handleChange} className="w-full mb-2 p-2 border rounded">
          <option value="active">فعال</option>
          <option value="inactive">غیرفعال</option>
          <option value="pending">در انتظار تأیید</option>
        </select>

        {/* لوگو */}
        <label className="block text-sm mb-1">لوگو:</label>
        {restaurant?.logo && !logo && (
          <img src={getImageUrl(restaurant.logo)} alt="لوگوی فعلی" className="w-16 h-16 object-cover rounded mb-2 border" />
        )}
        <input type="file" accept="image/*" onChange={e => setLogo(e.target.files?.[0] || null)} className="w-full mb-2 p-2 border rounded" />

        {/* کاور */}
        <label className="block text-sm mb-1">تصویر کاور:</label>
        {restaurant?.cover_image && !coverImage && (
          <img src={getImageUrl(restaurant.cover_image)} alt="کاور فعلی" className="w-full h-32 object-cover rounded mb-2 border" />
        )}
        <input type="file" accept="image/*" onChange={e => setCoverImage(e.target.files?.[0] || null)} className="w-full mb-2 p-2 border rounded" />

        <div className="flex justify-end gap-2 mt-4">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-300 rounded">
            انصراف
          </button>
          <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded">
            ذخیره
          </button>
        </div>
      </form>
    </BaseModal>
  );
}