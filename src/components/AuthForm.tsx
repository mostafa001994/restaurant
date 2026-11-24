'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';

type Mode = 'otp' | 'password' | 'register' | 'forgot';
type Step = 'form' | 'code';

const safeNext = (n?: string) => (n && n.startsWith('/') && !n.startsWith('//') && !n.includes('\\') ? n : '/');

async function call(path: string, body: unknown) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Client': 'web' },
    credentials: 'same-origin',
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message ?? 'خطایی رخ داد');
  return data as { resend_in?: number; message?: string };
}

export default function AuthForm({ initialMode, next }: { initialMode: Mode; next?: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [step, setStep] = useState<Step>('form');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  function switchMode(m: Mode) {
    setMode(m);
    setStep('form');
    setError('');
    setInfo('');
    setCode('');
  }

  const needsPassword = mode === 'password' || mode === 'register';

  async function sendCode() {
    const path = mode === 'register' ? '/api/auth/register' : mode === 'forgot' ? '/api/auth/password/forgot' : '/api/auth/otp/request';
    const body = mode === 'register' ? { identifier, name: name || undefined, password } : { identifier };
    const r = await call(path, body);
    setStep('code');
    setCooldown(r.resend_in ?? 60);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);
    try {
      if (step === 'form') {
        if (mode === 'password') {
          await call('/api/auth/login', { identifier, password });
          router.replace(safeNext(next));
          router.refresh();
        } else {
          await sendCode();
        }
      } else if (mode === 'forgot') {
        await call('/api/auth/password/reset', { identifier, code, password });
        switchMode('password');
        setInfo('رمز عبور تغییر کرد؛ با رمز جدید وارد شوید.');
        setPassword('');
      } else {
        await call('/api/auth/otp/verify', { identifier, code });
        router.replace(safeNext(next));
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطایی رخ داد');
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    setError('');
    setLoading(true);
    try {
      await sendCode();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطایی رخ داد');
    } finally {
      setLoading(false);
    }
  }

  const title = { otp: 'ورود', password: 'ورود', register: 'ثبت‌نام', forgot: 'بازیابی رمز عبور' }[mode];

  return (
    <div className="card">
      <h1>{title}</h1>
      <p className="sub">
        {step === 'code' ? `کد ۶ رقمی ارسال‌شده به ${identifier} را وارد کنید` : 'با شماره موبایل یا ایمیل'}
      </p>

      {(mode === 'otp' || mode === 'password') && step === 'form' && (
        <div className="tabs" role="tablist">
          <button type="button" role="tab" aria-selected={mode === 'otp'} onClick={() => switchMode('otp')}>ورود با کد</button>
          <button type="button" role="tab" aria-selected={mode === 'password'} onClick={() => switchMode('password')}>ورود با رمز</button>
        </div>
      )}

      <form onSubmit={onSubmit} noValidate>
        {step === 'form' ? (
          <>
            {mode === 'register' && (
              <>
                <label htmlFor="name">نام (اختیاری)</label>
                <input id="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
              </>
            )}
            <label htmlFor="identifier">موبایل یا ایمیل</label>
            <input id="identifier" dir="ltr" inputMode="email" autoComplete="username" placeholder="09123456789" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required />
            {needsPassword && (
              <>
                <label htmlFor="password">رمز عبور</label>
                <input id="password" type="password" dir="ltr" autoComplete={mode === 'register' ? 'new-password' : 'current-password'} value={password} onChange={(e) => setPassword(e.target.value)} required />
                {mode === 'register' && <p className="sub" style={{ margin: '4px 0 0' }}>حداقل ۸ کاراکتر، شامل حرف و عدد</p>}
              </>
            )}
          </>
        ) : (
          <>
            <label htmlFor="code">کد تایید</label>
            <input id="code" className="otp" dir="ltr" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} autoFocus required />
            {mode === 'forgot' && (
              <>
                <label htmlFor="newpw">رمز عبور جدید</label>
                <input id="newpw" type="password" dir="ltr" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </>
            )}
          </>
        )}

        {error && <p className="msg err" role="alert">{error}</p>}
        {info && <p className="msg ok" role="status">{info}</p>}

        <button className="primary" disabled={loading}>
          {loading ? 'لطفاً صبر کنید…' : step === 'code' ? (mode === 'forgot' ? 'تغییر رمز' : 'تایید و ورود') : mode === 'password' ? 'ورود' : 'دریافت کد'}
        </button>
      </form>

      {step === 'code' ? (
        <div className="row">
          <button className="link" type="button" onClick={() => switchMode(mode)}>ویرایش شماره</button>
          <button className="link" type="button" disabled={cooldown > 0 || loading} onClick={resend}>
            {cooldown > 0 ? `ارسال مجدد (${cooldown})` : 'ارسال مجدد کد'}
          </button>
        </div>
      ) : (
        <div className="row">
          {mode === 'password' && <button className="link" type="button" onClick={() => switchMode('forgot')}>رمز را فراموش کرده‌ام</button>}
          {mode === 'register' || mode === 'forgot' ? (
            <button className="link" type="button" onClick={() => switchMode('otp')}>بازگشت به ورود</button>
          ) : (
            <Link className="link" href={next ? `/register?next=${encodeURIComponent(next)}` : '/register'}>ثبت‌نام</Link>
          )}
        </div>
      )}
    </div>
  );
}
