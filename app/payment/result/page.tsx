'use client';

import { Suspense } from 'react';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchOrder } from '@/lib/orders';
import type { Order } from '@/types/models';
import OrderCountdown from '@/components/OrderCountdown';

function PaymentResultPageInner() {
  const params = useSearchParams();
  const router = useRouter();

  const status = params.get('status'); // success | failed
  const orderId = params.get('order_id');
  const message = params.get('message');

  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (status === 'success' && orderId) {
      fetchOrder(Number(orderId))
        .then(setOrder)
        .catch(() => {});
    }
  }, [status, orderId]);

  const isSuccess = status === 'success';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-6 rounded shadow-md w-full max-w-md text-center space-y-4">
        {isSuccess ? (
          <>
            <div className="text-5xl">✅</div>
            <h2 className="text-lg font-bold text-green-600">پرداخت با موفقیت انجام شد</h2>
            {order && (
              <p className="text-sm text-gray-600">
                زمان تخمینی تحویل: <OrderCountdown initialRemainingSeconds={order.remaining_seconds} />
              </p>
            )}
          </>
        ) : (
          <>
            <div className="text-5xl">❌</div>
            <h2 className="text-lg font-bold text-red-600">پرداخت ناموفق بود</h2>
            {message && <p className="text-sm text-gray-500">{decodeURIComponent(message)}</p>}
          </>
        )}

        <div className="flex gap-2 justify-center pt-2">
          <button
            onClick={() => router.push('/profile/orders')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            مشاهده‌ی سفارشات
          </button>
          <Link href="/" className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300">
            بازگشت به صفحه اصلی
          </Link>
        </div>
      </div>
    </div>
  );
}


export default function PaymentResultPage() {
  return (
    <Suspense fallback={null}>
      <PaymentResultPageInner />
    </Suspense>
  );
}
