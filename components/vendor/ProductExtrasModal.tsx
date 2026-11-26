'use client';

import { useEffect, useState } from 'react';
import { vendorApi } from '@/lib/vendor';
import type { ProductExtra } from '@/types/models';

interface Props {
  productId: number;
  productName: string;
  onClose: () => void;
}

export default function ProductExtrasModal({ productId, productName, onClose }: Props) {
  const [extras, setExtras] = useState<ProductExtra[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('0');

  const load = () => {
    setLoading(true);
    vendorApi.listExtras(productId).then(setExtras).finally(() => setLoading(false));
  };

  useEffect(load, [productId]);

  const handleAdd = async () => {
    if (!name) return;
    await vendorApi.createExtra(productId, { name, price: Number(price) || 0 });
    setName('');
    setPrice('0');
    load();
  };

  const handleToggleActive = async (extra: ProductExtra) => {
    await vendorApi.updateExtra(productId, extra.id, { is_active: !extra.is_active });
    load();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('حذف این مخلفات؟')) return;
    await vendorApi.deleteExtra(productId, id);
    load();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold">مخلفات «{productName}»</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-xl leading-none">×</button>
        </div>

        <div className="flex gap-2 mb-4">
          <input
            placeholder="نام (مثلاً سالاد)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border rounded p-2 text-sm flex-1"
          />
          <input
            type="number"
            placeholder="قیمت (۰ = رایگان)"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="border rounded p-2 text-sm w-28"
          />
          <button onClick={handleAdd} className="bg-emerald-600 text-white px-3 rounded text-sm">
            افزودن
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-gray-500">در حال بارگذاری...</p>
        ) : extras.length === 0 ? (
          <p className="text-sm text-gray-500">هنوز مخلفاتی برای این غذا ثبت نشده است</p>
        ) : (
          <div className="space-y-2">
            {extras.map((e) => (
              <div key={e.id} className="flex justify-between items-center text-sm border-b pb-1">
                <div>
                  <span className={e.is_active ? '' : 'line-through text-gray-400'}>{e.name}</span>{' '}
                  <span className="text-gray-500">{e.price > 0 ? `${e.price.toLocaleString()} تومان` : 'رایگان'}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleToggleActive(e)} className="text-blue-600 hover:underline">
                    {e.is_active ? 'غیرفعال کردن' : 'فعال کردن'}
                  </button>
                  <button onClick={() => handleDelete(e.id)} className="text-red-500 hover:underline">
                    حذف
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
