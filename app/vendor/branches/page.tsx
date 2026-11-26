'use client';

import { useEffect, useState } from 'react';
import { vendorApi } from '@/lib/vendor';

export default function VendorBranchesPage() {
  const [branches, setBranches] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', address: '', phone: '' });
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    vendorApi.listBranches().then(setBranches).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleAdd = async () => {
    if (!form.name) return;
    await vendorApi.createBranch(form);
    setForm({ name: '', address: '', phone: '' });
    load();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('حذف این شعبه؟')) return;
    await vendorApi.deleteBranch(id);
    load();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">شعبه‌های رستوران</h1>

      <div className="bg-white rounded shadow p-4 mb-4 flex gap-2 flex-wrap">
        <input
          placeholder="نام شعبه"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="border rounded p-2 text-sm"
        />
        <input
          placeholder="آدرس"
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
          className="border rounded p-2 text-sm flex-1"
        />
        <input
          placeholder="تلفن"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className="border rounded p-2 text-sm"
        />
        <button onClick={handleAdd} className="bg-emerald-600 text-white px-4 py-2 rounded text-sm">
          + افزودن شعبه
        </button>
      </div>

      {loading ? (
        <p>در حال بارگذاری...</p>
      ) : (
        <div className="space-y-2">
          {branches.map((b) => (
            <div key={b.id} className="bg-white rounded shadow p-3 flex justify-between items-center text-sm">
              <div>
                <p className="font-bold">{b.name}</p>
                <p className="text-gray-500">{b.address} — {b.phone}</p>
              </div>
              <button onClick={() => handleDelete(b.id)} className="text-red-500 hover:underline">
                حذف
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
