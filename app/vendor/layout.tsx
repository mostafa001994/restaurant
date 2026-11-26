'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';

function VendorGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    const isVendor = user?.role?.slug === 'vendor';
    if (!loading && !isVendor) {
      router.replace('/login?redirect=/vendor');
    }
  }, [loading, user, router]);

  const isVendor = user?.role?.slug === 'vendor';

  if (loading || !isVendor) {
    return <p className="text-center mt-20 text-amber-500">در حال بررسی دسترسی...</p>;
  }

  return <>{children}</>;
}

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  return (
    <VendorGuard>
      <div className="flex min-h-screen">
        <aside className="w-64 bg-gray-900 text-white p-4">
          <h2 className="text-xl font-bold mb-6">پنل رستوران‌دار</h2>
          <nav className="space-y-4 text-sm">
            <Link href="/vendor" className="block hover:text-yellow-400">داشبورد</Link>
            <Link href="/vendor/restaurant" className="block hover:text-yellow-400">اطلاعات رستوران</Link>
            <Link href="/vendor/branches" className="block hover:text-yellow-400">شعبه‌ها</Link>
            <Link href="/vendor/categories" className="block hover:text-yellow-400">دسته‌بندی‌ها</Link>
            <Link href="/vendor/products" className="block hover:text-yellow-400">غذاها</Link>
            <Link href="/vendor/orders" className="block hover:text-yellow-400">سفارش‌ها</Link>
          </nav>
        </aside>

        <main className="flex-1 p-6 bg-gray-50">{children}</main>
      </div>
    </VendorGuard>
  );
}
