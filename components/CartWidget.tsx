// components/CartWidget.tsx
'use client';

import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import CartSidebar from './CartSidebar';

/**
 * دکمه‌ی سبد خرید در هدر + کشوی کشویی (drawer).
 * قبلاً CartSidebar ساخته شده بود ولی هیچ‌جای layout رندر نمی‌شد،
 * برای همین کلیک روی «افزودن به سبد» ظاهراً هیچ اتفاقی نداشت.
 */
export default function CartWidget() {
  const { items } = useCart();
  const [open, setOpen] = useState(false);

  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative hover:text-blue-600"
        aria-label="سبد خرید"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
        {count > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {count}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative h-full">
            <CartSidebar onClose={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
