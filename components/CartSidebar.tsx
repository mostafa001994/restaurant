// components/CartSidebar.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { createOrder, payOrder, fetchGateways } from '@/lib/orders';
import { fetchAddresses, formatAddress, Address } from '@/lib/addresses';
import type { PaymentGateway } from '@/types/models';

interface Props {
  onClose?: () => void;
}

type Step = 'cart' | 'address' | 'gateway';

export default function CartSidebar({ onClose }: Props) {
  const { items, removeFromCart, clearCart } = useCart();

  const [step, setStep] = useState<Step>('cart');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [addresses, setAddresses] = useState<Address[] | null>(null);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);

  const [gateways, setGateways] = useState<PaymentGateway[] | null>(null);
  const [selectedGateway, setSelectedGateway] = useState<'zarinpal' | 'mellat' | ''>('');

  const itemTotal = (i: (typeof items)[number]) =>
    i.product.price * i.quantity + i.extras.reduce((s, e) => s + e.extra.price * e.quantity, 0);

  const total = items.reduce((sum, i) => sum + itemTotal(i), 0);

  const restaurantId = items[0]?.product.restaurant_id ?? null;
  const hasMixedRestaurants = items.some((i) => i.product.restaurant_id !== restaurantId);

  // مرحله‌ی انتخاب آدرس: آدرس‌های ذخیره‌شده‌ی کاربر را می‌آوریم
  const goToAddressStep = async () => {
    setError('');
    if (hasMixedRestaurants) {
      setError('سبد خرید شما شامل غذاهایی از چند رستوران مختلف است؛ لطفاً فقط از یک رستوران سفارش دهید.');
      return;
    }

    try {
      const list = await fetchAddresses();
      setAddresses(list);
      const defaultAddr = list.find((a) => a.is_default) ?? list[0];
      setSelectedAddressId(defaultAddr?.id ?? null);
      setStep('address');
    } catch {
      setError('خطا در دریافت آدرس‌ها');
    }
  };

  const goToGatewayStep = async () => {
    setError('');
    if (!selectedAddressId) {
      setError('لطفاً یک آدرس انتخاب کنید');
      return;
    }

    try {
      const list = await fetchGateways();
      if (list.length === 0) {
        setError('در حال حاضر هیچ درگاه پرداختی فعال نیست.');
        return;
      }
      setGateways(list);
      setSelectedGateway(list[0].key);
      setStep('gateway');
    } catch {
      setError('خطا در دریافت درگاه‌های پرداخت');
    }
  };

  const handlePay = async () => {
    if (!restaurantId || !selectedGateway || !addresses) return;

    const address = addresses.find((a) => a.id === selectedAddressId);
    if (!address) return;

    setSubmitting(true);
    setError('');

    try {
      const order = await createOrder({
        restaurant_id: restaurantId,
        delivery_address: formatAddress(address),
        delivery_lat: address.lat ?? null,
        delivery_lng: address.lng ?? null,
        items: items.map((i) => ({
          product_id: i.product.id,
          quantity: i.quantity,
          extras: i.extras.map((e) => ({ extra_id: e.extra.id, quantity: e.quantity })),
        })),
      });

      const redirectUrl = await payOrder(order.id, selectedGateway);
      clearCart();
      window.location.href = redirectUrl; // ریدایرکت واقعی به درگاه بانک
    } catch (err: any) {
      setError(err.response?.data?.message || 'خطا در ثبت سفارش یا اتصال به درگاه پرداخت');
      setSubmitting(false);
    }
  };

  return (
    <div className="w-80 h-full bg-white border-l p-4 shadow-lg overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">سبد خرید</h2>
        {onClose && (
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-xl leading-none">
            ×
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-gray-500">سبد خرید خالی است</p>
      ) : step === 'cart' ? (
        <div className="space-y-3">
          {items.map((i) => (
            <div key={i.key} className="border-b pb-2">
              <div className="flex justify-between">
                <span>{i.product.name}</span>
                <span>{i.quantity} عدد</span>
              </div>
              {i.extras.length > 0 && (
                <ul className="text-xs text-gray-500 mr-2 mt-1">
                  {i.extras.map((e) => (
                    <li key={e.extra.id}>
                      + {e.extra.name} × {e.quantity}
                      {e.extra.price > 0 ? ` (${(e.extra.price * e.quantity).toLocaleString()} تومان)` : ' (رایگان)'}
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex justify-between text-sm text-gray-600 mt-1">
                <span>{itemTotal(i).toLocaleString()} تومان</span>
                <button onClick={() => removeFromCart(i.key)} className="text-red-500 hover:underline">
                  حذف
                </button>
              </div>
            </div>
          ))}

          <div className="mt-4 font-bold">جمع کل: {total.toLocaleString()} تومان</div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button onClick={goToAddressStep} className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
            ثبت سفارش و پرداخت
          </button>

          <button onClick={clearCart} className="mt-2 w-full bg-gray-300 px-3 py-1 rounded text-sm">
            پاک‌سازی سبد
          </button>
        </div>
      ) : step === 'address' ? (
        <div className="space-y-3">
          <button onClick={() => setStep('cart')} className="text-sm text-gray-500 hover:underline">
            ← بازگشت به سبد
          </button>
          <h3 className="font-bold text-sm">آدرس تحویل سفارش را انتخاب کنید</h3>

          {!addresses || addresses.length === 0 ? (
            <div className="text-sm text-gray-600 space-y-2">
              <p>هنوز آدرسی ثبت نکرده‌اید.</p>
              <Link href="/profile/addresses" className="text-blue-600 hover:underline">
                افزودن آدرس جدید ←
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {addresses.map((a) => (
                <label
                  key={a.id}
                  className={`block border rounded p-2 text-sm cursor-pointer ${
                    selectedAddressId === a.id ? 'border-blue-600 bg-blue-50' : ''
                  }`}
                >
                  <input
                    type="radio"
                    name="address"
                    className="ml-2"
                    checked={selectedAddressId === a.id}
                    onChange={() => setSelectedAddressId(a.id)}
                  />
                  <span className="font-bold">{a.title || a.full_name}</span>
                  {a.is_default && <span className="text-xs text-green-600"> (پیش‌فرض)</span>}
                  <div className="text-gray-500">{formatAddress(a)}</div>
                </label>
              ))}
              <Link href="/profile/addresses" className="text-blue-600 hover:underline text-sm">
                + افزودن آدرس جدید
              </Link>
            </div>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            onClick={goToGatewayStep}
            disabled={!addresses || addresses.length === 0}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            ادامه
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <button onClick={() => setStep('address')} className="text-sm text-gray-500 hover:underline">
            ← بازگشت به انتخاب آدرس
          </button>

          <label className="block text-sm text-gray-700">انتخاب درگاه پرداخت</label>
          <select
            value={selectedGateway}
            onChange={(e) => setSelectedGateway(e.target.value as 'zarinpal' | 'mellat')}
            className="w-full border rounded p-2 text-sm"
          >
            {gateways?.map((g) => (
              <option key={g.key} value={g.key}>
                {g.name}
              </option>
            ))}
          </select>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            onClick={handlePay}
            disabled={submitting}
            className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-50"
          >
            {submitting ? 'در حال انتقال به درگاه...' : `پرداخت ${total.toLocaleString()} تومان`}
          </button>
        </div>
      )}
    </div>
  );
}
