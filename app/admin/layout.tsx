'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useUser } from '@/context/UserContext';

function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useUser();

  if (loading) {
    return <p className="text-center mt-20">در حال بررسی دسترسی...</p>;
  }

  // نکته امنیتی: قبلاً این گارد اصلاً وجود نداشت و هر کاربری
  // (حتی مهمان) صفحات پنل ادمین را می‌دید. حالا هم نیاز به لاگین
  // و هم is_admin چک می‌شود (هماهنگ با میدلور is_admin سمت بک‌اند
  // که هم enum role و هم نقش RBAC را در نظر می‌گیرد).
  if (!user || !user.is_admin) {
    return (
      <p className="text-center mt-20 text-red-500">
        شما اجازه دسترسی به این بخش را ندارید.
      </p>
    );
  }

  return <>{children}</>;
}

function AdminShell({ children }: { children: React.ReactNode }) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [restaurantMenuOpen, setrestaurantMenuOpen] = useState(false);
  const [productMenuOpen, setproductMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* سایدبار */}
      <aside className="w-64 bg-gray-900 text-white p-4">
        <h2 className="text-xl font-bold mb-6">پنل مدیریت</h2>
        <nav className="space-y-6">
          <Link href="/admin" className="items-center hover:text-yellow-400 flex gap-2">
            <svg className="w-8 h-8">
              <use href="#icon-dashboards" />
            </svg>
            داشبورد
          </Link>

          <Link href="/admin/orders" className="items-center hover:text-yellow-400 flex gap-2">
            <svg className="w-8 h-8">
              <use href="#icon-orders" />
            </svg>
            سفارش‌ها
          </Link>

          <Link href="/admin/vendor-panel" className="items-center hover:text-yellow-400 flex gap-2">
            <svg className="w-8 h-8">
              <use href="#icon-store" />
            </svg>
            امکانات وندور
          </Link>

          <Link href="/admin/reviews" className="items-center hover:text-yellow-400 flex gap-2">
            <svg className="w-8 h-8">
              <use href="#icon-orders" />
            </svg>
            نظرات
          </Link>

          <Link href="/admin/payment-gateways" className="items-center hover:text-yellow-400 flex gap-2">
            <svg className="w-8 h-8">
              <use href="#icon-payment" />
            </svg>
            تنظیمات درگاه‌ها
          </Link>

          <Link href="/admin/transactions" className="items-center hover:text-yellow-400 flex gap-2">
            <svg className="w-8 h-8">
              <use href="#icon-payment" />
            </svg>
            لیست پرداخت‌ها
          </Link>

          {/* منوی کاربران با زیرمنو */}
          <div>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="w-full text-right hover:text-yellow-400 flex gap-2"
            >
              <svg className="w-8 h-8">
                <use href="#icon-fingerprint" />
              </svg>
              کاربران
            </button>
            {userMenuOpen && (
              <div className="mr-4 my-3 space-y-2 text-sm">
                <Link href="/admin/users" className="block hover:text-yellow-400">
                  مدیریت کاربران
                </Link>
                <Link href="/admin/roles" className="block hover:text-yellow-400">
                  مدیریت نقش‌ها
                </Link>
                <Link href="/admin/permissions" className="block hover:text-yellow-400">
                  مدیریت دسترسی‌ها
                </Link>
              </div>
            )}
          </div>

          <div>
            <button
              onClick={() => setproductMenuOpen(!productMenuOpen)}
              className="w-full text-right hover:text-yellow-400 flex gap-2"
            >
              <svg className="w-8 h-8 ">
                <use href="#icon-food" />
              </svg>
              محصولات
            </button>
            {productMenuOpen && (
              <div className="mr-4 my-3 space-y-2 text-sm">
                <Link href="/admin/products" className="block hover:text-yellow-400">
                  مدیریت غذاها
                </Link>
                <Link href="/admin/categories" className="block hover:text-yellow-400">
                  مدیریت دسته بندی ها
                </Link>
                <Link href="/admin/ingredients" className="block hover:text-yellow-400">
                  مدیریت مواد اولیه
                </Link>
              </div>
            )}
          </div>

          <div>
            <button
              onClick={() => setrestaurantMenuOpen(!restaurantMenuOpen)}
              className="w-full text-right hover:text-yellow-400 flex gap-2"
            >
              <svg className="w-8 h-8 ">
                <use href="#icon-store" />
              </svg>
              رستوران‌ها
            </button>
            {restaurantMenuOpen && (
              <div className="mr-4 my-3 space-y-2 text-sm">
                <Link href="/admin/restaurants" className="block hover:text-yellow-400">
                  مدیریت رستوران‌ها
                </Link>
                <Link href="/admin/branches" className="block hover:text-yellow-400">
                  مدیریت شعب
                </Link>
              </div>
            )}
          </div>
        </nav>
      </aside>

      {/* محتوای اصلی */}
      <main className="flex-1 p-6 bg-gray-50">{children}</main>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <AdminShell>{children}</AdminShell>
    </AdminGuard>
  );
}
