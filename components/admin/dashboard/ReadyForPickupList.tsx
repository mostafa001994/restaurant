'use client';

import { useEffect, useState } from 'react';
import { fetchReadyForPickup } from '@/lib/dashboard';

export default function ReadyForPickupList() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReadyForPickup()
      .then(setOrders)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="font-bold mb-3">آماده‌ی تحویل به پیک</h3>

      {loading ? (
        <p className="text-sm text-gray-500">در حال بارگذاری...</p>
      ) : orders.length === 0 ? (
        <p className="text-sm text-gray-500">در حال حاضر سفارشی منتظر پیک نیست</p>
      ) : (
        <div className="space-y-2">
          {orders.map((o) => (
            <div key={o.id} className="border rounded p-3 text-sm flex justify-between items-center">
              <div>
                <p className="font-bold">سفارش #{o.id} — {o.restaurant?.name}</p>
                <p className="text-gray-500">{o.delivery_address}</p>
                <p className="text-gray-500">مشتری: {o.user?.name} — {o.user?.phone}</p>
              </div>
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded">
                منتظر پیک
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
