'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { saveSession } from '@/lib/token';
import { afterLoginPath } from '@/lib/auth-redirect';

function LoginForm() {
  const [mode, setMode] = useState<'otp' | 'password'>('otp');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const redirect = useSearchParams().get('redirect');

  const handleSendOtp = async () => {
    try {
      setLoading(true);
      await api.post('/send-otp', { identifier });
      const q = new URLSearchParams({ identifier });
      if (redirect) q.set('redirect', redirect);
      router.push(`/verify?${q.toString()}`);
    } catch (err: any) {
      alert(err.response?.data?.message || 'خطا در ارسال کد');
    } finally {
      setLoading(false);
    }
  };

  const handlePassword = async () => {
    try {
      setLoading(true);
      const res = await api.post('/auth/login', { identifier, password });
      saveSession(res.data);
      // بارگذاری کامل تا UserContext با توکن جدید دوباره پروفایل را بگیرد
      window.location.assign(afterLoginPath(redirect, res.data.user?.is_admin));
    } catch (err: any) {
      alert(err.response?.data?.message || 'خطا در ورود');
      setLoading(false);
    }
  };

  const submit = () => {
    if (!identifier.trim()) return alert('لطفاً ایمیل یا شماره موبایل را وارد کنید');
    if (mode === 'password' && !password) return alert('رمز عبور را وارد کنید');
    return mode === 'otp' ? handleSendOtp() : handlePassword();
  };

  return (
    <div className="max-w-sm mx-auto mt-20 bg-white p-6 rounded shadow">
      <h1 className="text-lg font-bold mb-4">ورود</h1>

      <div className="flex gap-2 mb-4 text-sm">
        <button type="button" onClick={() => setMode('otp')} className={`flex-1 py-2 rounded ${mode === 'otp' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}>
          ورود با کد
        </button>
        <button type="button" onClick={() => setMode('password')} className={`flex-1 py-2 rounded ${mode === 'password' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}>
          ورود با رمز
        </button>
      </div>

      <input
        type="text"
        dir="ltr"
        value={identifier}
        onChange={(e) => setIdentifier(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        placeholder="ایمیل یا شماره موبایل"
        autoComplete="username"
        className="border p-2 w-full mb-3 rounded"
      />
      {mode === 'password' && (
        <input
          type="password"
          dir="ltr"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="رمز عبور"
          autoComplete="current-password"
          className="border p-2 w-full mb-3 rounded"
        />
      )}

      <button
        type="button"
        onClick={submit}
        disabled={loading}
        className={`w-full px-4 py-2 rounded text-white ${loading ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'}`}
      >
        {loading ? 'لطفاً صبر کنید...' : mode === 'otp' ? 'ارسال کد' : 'ورود'}
      </button>

      <p className="text-sm text-center mt-4">
        حساب ندارید؟{' '}
        <Link href={redirect ? `/register?redirect=${encodeURIComponent(redirect)}` : '/register'} className="text-blue-600 hover:underline">
          ثبت‌نام
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
