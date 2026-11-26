'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';

function RegisterForm() {
  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const redirect = useSearchParams().get('redirect');

  const submit = async () => {
    if (!identifier.trim() || !password) return alert('موبایل/ایمیل و رمز عبور را وارد کنید');
    try {
      setLoading(true);
      await api.post('/auth/register', { identifier, name: name || undefined, password });
      const q = new URLSearchParams({ identifier });
      if (redirect) q.set('redirect', redirect);
      router.push(`/verify?${q.toString()}`); // حساب بعد از تایید کد ساخته می‌شود
    } catch (err: any) {
      alert(err.response?.data?.message || 'خطا در ثبت‌نام');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto mt-20 bg-white p-6 rounded shadow">
      <h1 className="text-lg font-bold mb-4">ثبت‌نام</h1>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="نام (اختیاری)" autoComplete="name" className="border p-2 w-full mb-3 rounded" />
      <input dir="ltr" value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="ایمیل یا شماره موبایل" autoComplete="username" className="border p-2 w-full mb-3 rounded" />
      <input type="password" dir="ltr" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="رمز عبور (حداقل ۸ کاراکتر، حرف و عدد)" autoComplete="new-password" className="border p-2 w-full mb-3 rounded" />
      <button type="button" onClick={submit} disabled={loading} className={`w-full px-4 py-2 rounded text-white ${loading ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'}`}>
        {loading ? 'لطفاً صبر کنید...' : 'دریافت کد تایید'}
      </button>
      <p className="text-sm text-center mt-4">
        حساب دارید؟ <Link href="/login" className="text-blue-600 hover:underline">ورود</Link>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  );
}
