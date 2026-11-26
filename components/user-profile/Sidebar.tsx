// components/user-profile/Sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clearSession } from '@/lib/token';
import type { User } from '@/types/models';

const links = [
  { href: '/profile/dashboard', label: 'داشبورد', icon: 'dashboard' },
  { href: '/profile/profile', label: 'پروفایل', icon: 'user' },
  { href: '/profile/orders', label: 'سفارشات', icon: 'orders' },
  { href: '/profile/addresses', label: 'آدرس‌ها', icon: 'location' },
];

export default function Sidebar({ user }: { user: User }) {
  const pathname = usePathname();

  return (
    <aside className="lg:w-1/5 md:w-1/4 bg-white shadow border-amber-200 border-l rounded-l-4xl relative">
      <div className="p-2 gap-4 flex items-center">
        <img
          src={
            user?.avatar_url?.trim()
              ? user.avatar_url
              : 'https://cdn-icons-png.flaticon.com/512/190/190671.png'
          }
          alt="تصویر پروفایل"
          className="w-16 h-16 rounded-full border-2 border-amber-600 object-cover"
        />
        <div className="text-amber-600">
          <p>نام: {user?.name}</p>
          <p>شماره: {user?.phone}</p>
        </div>
      </div>

      <div className="flex flex-col bg-amber-100 text-amber-600 border-amber-200 border w-auto p-4 gap-4 rounded-2xl my-4 relative">
        <div className="flex justify-between">
          اعتبار کیف پول :
          <span>0 تومان</span>
        </div>
        <svg className="w-14 h-14 text-amber-200 opacity-45 z-0 absolute left-2 bottom-2">
          <use href="#icon-wallet" />
        </svg>
        {/* لینک کلاینتی به صفحه افزایش اعتبار */}
        <Link
          href="/wallet/topup"
          className="bg-emerald-700 border-green-200 text-sm border text-white w-fit rounded-xl p-2"
        >
          + افزایش اعتبار
        </Link>
      </div>

      <nav className="space-y-2 text-amber-600">
        {links.map(({ href, label, icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex gap-4 items-center w-full text-right px-4 py-2 ${
                isActive ? 'border-l-amber-600 border-l-2' : 'hover:text-amber-500'
              }`}
            >
              <svg className="w-6 h-6 fill-current">
                <use href={`#icon-${icon}`} />
              </svg>
              {label}
            </Link>
          );
        })}

        <button
          onClick={() => {
            clearSession();
            window.location.href = '/login';
          }}
          className="flex gap-4 items-center w-full text-right px-4 py-2 hover:text-red-500"
        >
          <svg className="w-6 h-6 fill-current">
            <use href="#icon-logout" />
          </svg>
          خروج
        </button>
      </nav>
    </aside>
  );
}