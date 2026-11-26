'use client';

import { useEffect, useState } from 'react';
import { vendorApi } from '@/lib/vendor';
import VendorStatCard from '@/components/vendor/dashboard/VendorStatCard';

export default function VendorDashboardPage() {
  const [overview, setOverview] = useState<{ orders_count: number; revenue: number } | null>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [readyOrders, setReadyOrders] = useState<any[]>([]);

  useEffect(() => {
    vendorApi.dashboardOverview().then(setOverview);
    vendorApi.recentOrders().then(setRecentOrders);
    vendorApi.readyForPickup().then(setReadyOrders);
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">داشبورد رستوران</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <VendorStatCard metric="orders" title="تعداد سفارشات" value={overview ? overview.orders_count.toLocaleString() : '...'} icon="🧾" />
        <VendorStatCard metric="revenue" title="درآمد (تومان)" value={overview ? overview.revenue.toLocaleString() : '...'} icon="💰" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-bold mb-3">آخرین سفارش‌ها</h3>
          {recentOrders.length === 0 ? (
            <p className="text-sm text-gray-500">سفارشی ثبت نشده است</p>
          ) : (
            <div className="space-y-2 text-sm">
              {recentOrders.map((o) => (
                <div key={o.id} className="flex justify-between border-b pb-1">
                  <span>#{o.id} — {o.user?.name}</span>
                  <span>{Number(o.final_price).toLocaleString()} تومان</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-bold mb-3">آماده‌ی تحویل به پیک</h3>
          {readyOrders.length === 0 ? (
            <p className="text-sm text-gray-500">سفارشی منتظر پیک نیست</p>
          ) : (
            <div className="space-y-2 text-sm">
              {readyOrders.map((o) => (
                <div key={o.id} className="border-b pb-1">
                  #{o.id} — {o.user?.name} — {o.user?.phone}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
