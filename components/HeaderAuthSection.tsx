// components/HeaderAuthSection.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useUser } from '@/context/UserContext';

export default function HeaderAuthSection() {
  const { user, loading } = useUser();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (loading) {
    return <span className="text-sm text-gray-400">...</span>;
  }

  if (!user) {
    return (
      <Link href="/login" className="hover:text-blue-600">
        ورود
      </Link>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-1 hover:text-blue-600">
        {user.name || 'پروفایل'}
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 mt-2 w-48 bg-white border rounded shadow-lg text-sm z-50">
          <Link href="/profile" onClick={() => setOpen(false)} className="block px-4 py-2 hover:bg-gray-100">
            پروفایل من
          </Link>
          <Link href="/profile/orders" onClick={() => setOpen(false)} className="block px-4 py-2 hover:bg-gray-100">
            سفارش‌های من
          </Link>

          {/* فقط برای کاربرانی که نقش ادمین دارند نشون داده می‌شه (چک شده از is_admin که بک‌اند محاسبه می‌کند) */}
          {user.is_admin && (
            <Link href="/admin" onClick={() => setOpen(false)} className="block px-4 py-2 hover:bg-gray-100">
              پنل ادمین
            </Link>
          )}

          {user.role?.slug === 'vendor' && (
            <Link href="/vendor" onClick={() => setOpen(false)} className="block px-4 py-2 hover:bg-gray-100">
              پنل رستوران‌دار
            </Link>
          )}

          <Link href="/logout" onClick={() => setOpen(false)} className="block px-4 py-2 text-red-500 hover:bg-gray-100">
            خروج
          </Link>
        </div>
      )}
    </div>
  );
}
