'use client';

import { useEffect, useState } from 'react';
import { vendorApi } from '@/lib/vendor';

export default function VendorRestaurantPage() {
  const [form, setForm] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    vendorApi.getRestaurant().then(setForm);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await vendorApi.updateRestaurant({
        name: form.name,
        description: form.description,
        address: form.address,
        open_time: form.open_time,
        close_time: form.close_time,
      });
      setForm(updated);
      alert('اطلاعات رستوران ذخیره شد');
    } catch (err: any) {
      alert(err.response?.data?.message || 'خطا در ذخیره‌سازی');
    } finally {
      setSaving(false);
    }
  };

  if (!form) return <p>در حال بارگذاری...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">اطلاعات رستوران</h1>

      <div className="bg-white rounded shadow p-4 max-w-xl space-y-3">
        <input
          name="name"
          value={form.name ?? ''}
          onChange={handleChange}
          placeholder="نام رستوران"
          className="w-full border rounded p-2 text-sm"
        />
        <textarea
          name="description"
          value={form.description ?? ''}
          onChange={handleChange}
          placeholder="توضیحات"
          className="w-full border rounded p-2 text-sm"
        />
        <input
          name="address"
          value={form.address ?? ''}
          onChange={handleChange}
          placeholder="آدرس"
          className="w-full border rounded p-2 text-sm"
        />
        <div className="flex gap-2">
          <input
            name="open_time"
            value={form.open_time ?? ''}
            onChange={handleChange}
            placeholder="ساعت باز شدن (HH:mm)"
            className="w-full border rounded p-2 text-sm"
          />
          <input
            name="close_time"
            value={form.close_time ?? ''}
            onChange={handleChange}
            placeholder="ساعت بسته شدن (HH:mm)"
            className="w-full border rounded p-2 text-sm"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 text-sm"
        >
          {saving ? 'در حال ذخیره...' : 'ذخیره'}
        </button>
      </div>
    </div>
  );
}
