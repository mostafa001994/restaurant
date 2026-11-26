'use client';

import { useEffect, useState } from 'react';
import { vendorApi } from '@/lib/vendor';

export default function VendorCategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    vendorApi.listCategories().then(setCategories).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleAdd = async () => {
    if (!name) return;
    await vendorApi.createCategory({ name });
    setName('');
    load();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('حذف این دسته‌بندی؟')) return;
    await vendorApi.deleteCategory(id);
    load();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">دسته‌بندی‌های غذا</h1>

      <div className="bg-white rounded shadow p-4 mb-4 flex gap-2">
        <input
          placeholder="نام دسته‌بندی"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border rounded p-2 text-sm flex-1"
        />
        <button onClick={handleAdd} className="bg-emerald-600 text-white px-4 py-2 rounded text-sm">
          + افزودن
        </button>
      </div>

      {loading ? (
        <p>در حال بارگذاری...</p>
      ) : (
        <div className="space-y-2">
          {categories.map((c) => (
            <div key={c.id} className="bg-white rounded shadow p-3 flex justify-between items-center text-sm">
              <span>{c.name} ({c.products?.length ?? 0} غذا)</span>
              <button onClick={() => handleDelete(c.id)} className="text-red-500 hover:underline">
                حذف
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
