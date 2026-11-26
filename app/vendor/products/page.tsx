'use client';

import { useEffect, useState } from 'react';
import { vendorApi } from '@/lib/vendor';
import ProductExtrasModal from '@/components/vendor/ProductExtrasModal';

export default function VendorProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [extrasFor, setExtrasFor] = useState<{ id: number; name: string } | null>(null);
  const [form, setForm] = useState({
    name: '',
    price: '',
    stock: '',
    category_id: '',
    preparation_minutes: '30',
  });

  const load = () => {
    setLoading(true);
    Promise.all([vendorApi.listProducts(), vendorApi.listCategories()])
      .then(([p, c]) => {
        setProducts(p.data ?? p);
        setCategories(c);
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleAdd = async () => {
    if (!form.name || !form.category_id) {
      alert('نام و دسته‌بندی الزامی است');
      return;
    }
    try {
      await vendorApi.createProduct(form);
      setForm({ name: '', price: '', stock: '', category_id: '', preparation_minutes: '30' });
      load();
    } catch (err: any) {
      alert(err.response?.data?.message || 'خطا در ثبت غذا');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('حذف این غذا؟')) return;
    await vendorApi.deleteProduct(id);
    load();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">غذاهای رستوران</h1>

      <div className="bg-white rounded shadow p-4 mb-4 grid grid-cols-2 md:grid-cols-5 gap-2">
        <input
          placeholder="نام غذا"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="border rounded p-2 text-sm col-span-2"
        />
        <input
          placeholder="قیمت (تومان)"
          type="number"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          className="border rounded p-2 text-sm"
        />
        <input
          placeholder="موجودی"
          type="number"
          value={form.stock}
          onChange={(e) => setForm({ ...form, stock: e.target.value })}
          className="border rounded p-2 text-sm"
        />
        <select
          value={form.category_id}
          onChange={(e) => setForm({ ...form, category_id: e.target.value })}
          className="border rounded p-2 text-sm"
        >
          <option value="">دسته‌بندی</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <div className="col-span-2 md:col-span-5 flex gap-2 items-center">
          <label className="text-xs text-gray-600 whitespace-nowrap">
            زمان آماده‌سازی (دقیقه) — مبنای تایمر تحویل سفارش
          </label>
          <input
            type="number"
            value={form.preparation_minutes}
            onChange={(e) => setForm({ ...form, preparation_minutes: e.target.value })}
            className="border rounded p-2 text-sm w-24"
          />
          <button onClick={handleAdd} className="bg-emerald-600 text-white px-4 py-2 rounded text-sm mr-auto">
            + افزودن غذا
          </button>
        </div>
      </div>

      {loading ? (
        <p>در حال بارگذاری...</p>
      ) : (
        <table className="w-full bg-white rounded shadow text-sm">
          <thead>
            <tr className="text-right text-gray-500 border-b">
              <th className="p-2">نام</th>
              <th>قیمت</th>
              <th>موجودی</th>
              <th>زمان آماده‌سازی</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b last:border-0">
                <td className="p-2">{p.name}</td>
                <td>{Number(p.price).toLocaleString()} تومان</td>
                <td>{p.stock}</td>
                <td>{p.preparation_minutes} دقیقه</td>
                <td>
                  <button
                    onClick={() => setExtrasFor({ id: p.id, name: p.name })}
                    className="text-blue-600 hover:underline ml-3"
                  >
                    مخلفات
                  </button>
                  <button onClick={() => handleDelete(p.id)} className="text-red-500 hover:underline">
                    حذف
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {extrasFor && (
        <ProductExtrasModal
          productId={extrasFor.id}
          productName={extrasFor.name}
          onClose={() => setExtrasFor(null)}
        />
      )}
    </div>
  );
}
