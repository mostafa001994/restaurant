// app/admin/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { fetchOverview, DashboardOverview } from '@/lib/dashboard';
import StatCard from '@/components/admin/dashboard/StatCard';
import RecentOrdersList from '@/components/admin/dashboard/RecentOrdersList';
import ReadyForPickupList from '@/components/admin/dashboard/ReadyForPickupList';

export default function AdminDashboard() {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);

  useEffect(() => {
    fetchOverview().then(setOverview);
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">داشبورد مدیریت</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          metric="orders"
          title="تعداد سفارشات"
          value={overview ? overview.orders_count.toLocaleString() : '...'}
          icon="🧾"
        />
        <StatCard
          metric="revenue"
          title="درآمد (تومان)"
          value={overview ? overview.revenue.toLocaleString() : '...'}
          icon="💰"
        />
        <StatCard
          metric="users"
          title="تعداد کاربران"
          value={overview ? overview.users_count.toLocaleString() : '...'}
          icon="👤"
        />
        <StatCard
          metric="restaurants"
          title="تعداد رستوران‌ها"
          value={overview ? overview.restaurants_count.toLocaleString() : '...'}
          icon="🏬"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RecentOrdersList />
        <ReadyForPickupList />
      </div>
    </div>
  );
}
