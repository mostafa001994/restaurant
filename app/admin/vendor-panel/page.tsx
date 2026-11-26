'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { vendorApi } from '@/lib/vendor';
import ProductExtrasModal from '@/components/vendor/ProductExtrasModal';

type Tab = 'info' | 'branches' | 'categories' | 'products' | 'orders';

export default function AdminVendorPanelPage() {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [restaurantId, setRestaurantId] = useState<number | ''>('');
  const [tab, setTab] = useState<Tab>('info');

  useEffect(() => {
    api.get('/admin/restaurants').then((res) => setRestaurants(res.data.data ?? res.data));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">مدیریت رستوران‌ها (امکانات وندور از پنل ادمین)</h1>

      <div className="mb-4">
        <select
          value={restaurantId}
          onChange={(e) => setRestaurantId(e.target.value ? Number(e.target.value) : '')}
          className="border rounded p-2 text-sm"
        >
          <option value="">-- یک رستوران را برای مدیریت انتخاب کنید --</option>
          {restaurants.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
      </div>

      {!restaurantId ? (
        <p className="text-gray-500 text-sm">ابتدا یک رستوران انتخاب کنید.</p>
      ) : (
        <>
          <div className="flex gap-2 mb-4 flex-wrap">
            {([
              ['info', 'اطلاعات رستوران'],
              ['branches', 'شعبه‌ها'],
              ['categories', 'دسته‌بندی‌ها'],
              ['products', 'غذاها'],
              ['orders', 'سفارش‌ها'],
            ] as [Tab, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`text-sm px-3 py-1 rounded-full border ${
                  tab === key ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === 'info' && <RestaurantInfoTab restaurantId={restaurantId} />}
          {tab === 'branches' && <BranchesTab restaurantId={restaurantId} />}
          {tab === 'categories' && <CategoriesTab restaurantId={restaurantId} />}
          {tab === 'products' && <ProductsTab restaurantId={restaurantId} />}
          {tab === 'orders' && <OrdersTab restaurantId={restaurantId} />}
        </>
      )}
    </div>
  );
}

function RestaurantInfoTab({ restaurantId }: { restaurantId: number }) {
  const [form, setForm] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    vendorApi.getRestaurant(restaurantId).then(setForm);
  }, [restaurantId]);

  if (!form) return <p>در حال بارگذاری...</p>;

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await vendorApi.updateRestaurant(
        { name: form.name, description: form.description, address: form.address, open_time: form.open_time, close_time: form.close_time },
        restaurantId
      );
      setForm(updated);
      alert('ذخیره شد');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded shadow p-4 max-w-xl space-y-3">
      <input value={form.name ?? ''} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="نام" className="w-full border rounded p-2 text-sm" />
      <textarea value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="توضیحات" className="w-full border rounded p-2 text-sm" />
      <input value={form.address ?? ''} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="آدرس" className="w-full border rounded p-2 text-sm" />
      <button onClick={handleSave} disabled={saving} className="bg-blue-600 text-white px-4 py-2 rounded text-sm disabled:opacity-50">
        {saving ? 'در حال ذخیره...' : 'ذخیره'}
      </button>
    </div>
  );
}

function BranchesTab({ restaurantId }: { restaurantId: number }) {
  const [branches, setBranches] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', address: '', phone: '' });

  const load = () => vendorApi.listBranches(restaurantId).then(setBranches);
  useEffect(() => { load(); }, [restaurantId]);

  const handleAdd = async () => {
    if (!form.name) return;
    await vendorApi.createBranch(form, restaurantId);
    setForm({ name: '', address: '', phone: '' });
    load();
  };

  return (
    <div>
      <div className="bg-white rounded shadow p-4 mb-4 flex gap-2 flex-wrap">
        <input placeholder="نام شعبه" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="border rounded p-2 text-sm" />
        <input placeholder="آدرس" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="border rounded p-2 text-sm flex-1" />
        <input placeholder="تلفن" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="border rounded p-2 text-sm" />
        <button onClick={handleAdd} className="bg-emerald-600 text-white px-4 py-2 rounded text-sm">+ افزودن</button>
      </div>
      <div className="space-y-2">
        {branches.map((b) => (
          <div key={b.id} className="bg-white rounded shadow p-3 flex justify-between text-sm">
            <span>{b.name} — {b.address}</span>
            <button onClick={async () => { await vendorApi.deleteBranch(b.id, restaurantId); load(); }} className="text-red-500 hover:underline">حذف</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function CategoriesTab({ restaurantId }: { restaurantId: number }) {
  const [categories, setCategories] = useState<any[]>([]);
  const [name, setName] = useState('');

  const load = () => vendorApi.listCategories(restaurantId).then(setCategories);
  useEffect(() => { load(); }, [restaurantId]);

  const handleAdd = async () => {
    if (!name) return;
    await vendorApi.createCategory({ name }, restaurantId);
    setName('');
    load();
  };

  return (
    <div>
      <div className="bg-white rounded shadow p-4 mb-4 flex gap-2">
        <input placeholder="نام دسته‌بندی" value={name} onChange={(e) => setName(e.target.value)} className="border rounded p-2 text-sm flex-1" />
        <button onClick={handleAdd} className="bg-emerald-600 text-white px-4 py-2 rounded text-sm">+ افزودن</button>
      </div>
      <div className="space-y-2">
        {categories.map((c) => (
          <div key={c.id} className="bg-white rounded shadow p-3 flex justify-between text-sm">
            <span>{c.name}</span>
            <button onClick={async () => { await vendorApi.deleteCategory(c.id, restaurantId); load(); }} className="text-red-500 hover:underline">حذف</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProductsTab({ restaurantId }: { restaurantId: number }) {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [extrasFor, setExtrasFor] = useState<{ id: number; name: string } | null>(null);
  const [form, setForm] = useState({ name: '', price: '', stock: '', category_id: '', preparation_minutes: '30' });

  const load = () => {
    Promise.all([vendorApi.listProducts(restaurantId), vendorApi.listCategories(restaurantId)]).then(([p, c]) => {
      setProducts(p.data ?? p);
      setCategories(c);
    });
  };
  useEffect(() => { load(); }, [restaurantId]);

  const handleAdd = async () => {
    if (!form.name || !form.category_id) return;
    await vendorApi.createProduct(form, restaurantId);
    setForm({ name: '', price: '', stock: '', category_id: '', preparation_minutes: '30' });
    load();
  };

  return (
    <div>
      <div className="bg-white rounded shadow p-4 mb-4 grid grid-cols-2 md:grid-cols-5 gap-2">
        <input placeholder="نام غذا" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="border rounded p-2 text-sm col-span-2" />
        <input placeholder="قیمت" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="border rounded p-2 text-sm" />
        <input placeholder="موجودی" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="border rounded p-2 text-sm" />
        <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="border rounded p-2 text-sm">
          <option value="">دسته‌بندی</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button onClick={handleAdd} className="bg-emerald-600 text-white px-4 py-2 rounded text-sm col-span-2 md:col-span-5">+ افزودن غذا</button>
      </div>

      <table className="w-full bg-white rounded shadow text-sm">
        <thead>
          <tr className="text-right text-gray-500 border-b">
            <th className="p-2">نام</th><th>قیمت</th><th>موجودی</th><th></th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id} className="border-b last:border-0">
              <td className="p-2">{p.name}</td>
              <td>{Number(p.price).toLocaleString()} تومان</td>
              <td>{p.stock}</td>
              <td>
                <button onClick={() => setExtrasFor({ id: p.id, name: p.name })} className="text-blue-600 hover:underline ml-3">مخلفات</button>
                <button onClick={async () => { await vendorApi.deleteProduct(p.id, restaurantId); load(); }} className="text-red-500 hover:underline">حذف</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {extrasFor && (
        <ProductExtrasModal productId={extrasFor.id} productName={extrasFor.name} onClose={() => setExtrasFor(null)} />
      )}
    </div>
  );
}

function OrdersTab({ restaurantId }: { restaurantId: number }) {
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    vendorApi.listOrders(1, restaurantId).then((data) => setOrders(data.data ?? data));
  }, [restaurantId]);

  return (
    <div className="space-y-2">
      {orders.length === 0 ? (
        <p className="text-sm text-gray-500">سفارشی ثبت نشده است</p>
      ) : (
        orders.map((o) => (
          <div key={o.id} className="bg-white rounded shadow p-3 text-sm">
            سفارش #{o.id} — {o.user?.name} — {Number(o.final_price).toLocaleString()} تومان — {o.status}
          </div>
        ))
      )}
    </div>
  );
}
