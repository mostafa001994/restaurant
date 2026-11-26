'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { saveSession } from '@/lib/token';
import { afterLoginPath } from '@/lib/auth-redirect';

export default function VerifyPage() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(30); // ← تایمر اولیه از لحظه ورود

  const router = useRouter();
  const searchParams = useSearchParams();
  const identifier = searchParams.get('identifier') || '';

  // شمارش معکوس تایمر
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleVerifyOtp = async () => {
    if (!code.trim()) {
      alert('کد OTP را وارد کنید');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/verify-otp', { identifier, code });

      if (res.status === 200) {
        saveSession(res.data);
        // بارگذاری کامل تا UserContext با توکن جدید دوباره پروفایل را بگیرد
        window.location.assign(afterLoginPath(searchParams.get('redirect'), res.data.user?.is_admin));
      } else {
        alert(res.data?.message || 'کد اشتباه است');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'خطا در تأیید کد');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      setResending(true);
      const res = await api.post('/send-otp', { identifier });

      if (res.status === 200) {
        alert('کد جدید ارسال شد');
        setCooldown(30); // ← بعد از ارسال مجدد، دوباره تایمر شروع بشه
      } else {
        alert(res.data?.message || 'ارسال مجدد ناموفق بود');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'خطا در ارسال مجدد');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto mt-20 bg-white p-6 rounded shadow">
      <h1 className="text-lg font-bold mb-4 text-center">تأیید کد OTP</h1>

      <input
        type="text"
        placeholder="کد OTP"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        className="border p-2 w-full mb-4 rounded text-right"
      />

      <div className="flex gap-4">
        <button
          type="button"
          onClick={handleVerifyOtp}
          disabled={loading}
          className={`flex-1 px-4 py-2 rounded text-white ${
            loading ? 'bg-gray-400' : 'bg-green-500 hover:bg-green-600'
          }`}
        >
          {loading ? 'در حال تأیید...' : 'تأیید کد'}
        </button>

        <button
          type="button"
          onClick={handleResendOtp}
          disabled={cooldown > 0 || resending}
          className={`flex-1 px-4 py-2 rounded text-white ${
            cooldown > 0 || resending
              ? 'bg-gray-400'
              : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          {cooldown > 0
            ? `ارسال مجدد تا ${cooldown} ثانیه`
            : resending
            ? 'در حال ارسال...'
            : 'ارسال مجدد'}
        </button>
      </div>
    </div>
  );
}