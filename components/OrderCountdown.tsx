'use client';

import { useEffect, useState } from 'react';

interface Props {
  // ثانیه‌های باقی‌مانده در لحظه‌ی دریافت از سرور (Order.remaining_seconds)
  initialRemainingSeconds: number | null | undefined;
}

function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');

  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

/**
 * شمارش معکوس تا تحویل تخمینی سفارش.
 * چون remaining_seconds فقط در لحظه‌ی فراخوانی API معتبر است، همان لحظه‌ی
 * دریافت را مرجع می‌گیریم و خودمان هر ثانیه client-side کم می‌کنیم؛ به این
 * ترتیب نیازی به poll کردن سرور هر ثانیه نیست.
 */
export default function OrderCountdown({ initialRemainingSeconds }: Props) {
  const [remaining, setRemaining] = useState<number | null>(
    initialRemainingSeconds ?? null
  );

  useEffect(() => {
    setRemaining(initialRemainingSeconds ?? null);
  }, [initialRemainingSeconds]);

  useEffect(() => {
    if (remaining === null || remaining <= 0) return;

    const timer = setInterval(() => {
      setRemaining((prev) => (prev === null ? null : Math.max(0, prev - 1)));
    }, 1000);

    return () => clearInterval(timer);
  }, [remaining === null]);

  if (remaining === null) {
    return <span className="text-gray-400 text-sm">هنوز زمان تحویل تعیین نشده</span>;
  }

  if (remaining <= 0) {
    return <span className="text-green-600 text-sm font-bold">سفارش باید تحویل داده شده باشد</span>;
  }

  return (
    <span className="text-blue-600 font-mono font-bold" dir="ltr">
      ⏱ {formatDuration(remaining)}
    </span>
  );
}
