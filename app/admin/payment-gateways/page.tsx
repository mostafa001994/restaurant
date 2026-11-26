'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  fetchPaymentGateways,
  createPaymentGateway,
  updatePaymentGateway,
  PaymentGatewaySettingDTO,
} from '@/lib/adminOrders';

const ALL_SUPPORTED: { key: 'zarinpal' | 'mellat'; label: string }[] = [
  { key: 'zarinpal', label: 'زرین‌پال' },
  { key: 'mellat', label: 'بانک ملت' },
];

export default function PaymentGatewaysPage() {
  const [gateways, setGateways] = useState<PaymentGatewaySettingDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);
  const [addKey, setAddKey] = useState('');
  const [adding, setAdding] = useState(false);

  const load = () => {
    setLoading(true);
    fetchPaymentGateways()
      .then(setGateways)
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  // فقط درگاه‌هایی که هنوز اضافه نشده‌اند قابل انتخاب برای افزودن هستند
  const availableToAdd = ALL_SUPPORTED.filter((s) => !gateways.some((g) => g.key === s.key));

  const handleAdd = async () => {
    if (!addKey) return;
    setAdding(true);
    try {
      await createPaymentGateway(addKey as 'zarinpal' | 'mellat');
      setAddKey('');
      load();
    } catch (err: any) {
      alert(err.response?.data?.message || 'خطا در افزودن درگاه');
    } finally {
      setAdding(false);
    }
  };

  const handleChange = (id: number, field: keyof PaymentGatewaySettingDTO, value: any) => {
    setGateways((prev) => prev.map((g) => (g.id === id ? { ...g, [field]: value } : g)));
  };

  const handleSave = async (gateway: PaymentGatewaySettingDTO & { password?: string }) => {
    setSaving(gateway.id);
    try {
      const updated = await updatePaymentGateway(gateway.id, gateway);
      setGateways((prev) => prev.map((g) => (g.id === gateway.id ? updated : g)));
      alert('تنظیمات ذخیره شد');
    } catch (err: any) {
      alert(err.response?.data?.message || 'خطا در ذخیره‌سازی');
    } finally {
      setSaving(null);
    }
  };

  if (loading) return <p>در حال بارگذاری...</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">تنظیمات درگاه‌های پرداخت</h1>
        <Link href="/admin/transactions" className="text-blue-600 hover:underline text-sm">
          مشاهده‌ی لیست پرداخت‌ها ←
        </Link>
      </div>

      {availableToAdd.length > 0 && (
        <div className="bg-white rounded shadow p-4 mb-4 flex items-center gap-2">
          <select
            value={addKey}
            onChange={(e) => setAddKey(e.target.value)}
            className="border rounded p-2 text-sm"
          >
            <option value="">-- انتخاب درگاه برای افزودن --</option>
            {availableToAdd.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
          <button
            onClick={handleAdd}
            disabled={!addKey || adding}
            className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700 disabled:opacity-50 text-sm"
          >
            {adding ? 'در حال افزودن...' : '+ افزودن درگاه'}
          </button>
        </div>
      )}

      <div className="space-y-4">
        {gateways.map((g) => (
          <div key={g.id} className="bg-white rounded shadow p-4">
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-bold">{g.name}</h2>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={g.is_enabled}
                  onChange={(e) => handleChange(g.id, 'is_enabled', e.target.checked)}
                />
                فعال
              </label>
            </div>

            <label className="flex items-center gap-2 text-sm mb-3">
              <input
                type="checkbox"
                checked={g.sandbox}
                onChange={(e) => handleChange(g.id, 'sandbox', e.target.checked)}
              />
              حالت آزمایشی (sandbox)
            </label>

            {g.key === 'zarinpal' ? (
              <input
                placeholder="Merchant ID زرین‌پال"
                value={g.merchant_id ?? ''}
                onChange={(e) => handleChange(g.id, 'merchant_id', e.target.value)}
                className="w-full border rounded p-2 text-sm mb-2"
              />
            ) : (
              <>
                <input
                  placeholder="شماره ترمینال"
                  value={g.terminal_id ?? ''}
                  onChange={(e) => handleChange(g.id, 'terminal_id', e.target.value)}
                  className="w-full border rounded p-2 text-sm mb-2"
                />
                <input
                  placeholder="نام کاربری"
                  value={g.username ?? ''}
                  onChange={(e) => handleChange(g.id, 'username', e.target.value)}
                  className="w-full border rounded p-2 text-sm mb-2"
                />
                <input
                  type="password"
                  placeholder="رمز عبور (برای تغییر وارد کنید)"
                  onChange={(e) => handleChange(g.id, 'password' as any, e.target.value)}
                  className="w-full border rounded p-2 text-sm mb-2"
                />
              </>
            )}

            <button
              onClick={() => handleSave(g)}
              disabled={saving === g.id}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 text-sm"
            >
              {saving === g.id ? 'در حال ذخیره...' : 'ذخیره'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
