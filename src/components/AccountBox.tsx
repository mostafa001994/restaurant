'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type Me = { name: string | null; phone: string | null; email: string | null; role: { name: string; slug: string } };
const H = { 'X-Client': 'web' };

async function fetchMe(): Promise<Me | null> {
  let r = await fetch('/api/profile', { credentials: 'same-origin' });
  if (r.status === 401) {
    const rr = await fetch('/api/auth/refresh', { method: 'POST', headers: H, credentials: 'same-origin' });
    if (!rr.ok) return null;
    r = await fetch('/api/profile', { credentials: 'same-origin' });
  }
  return r.ok ? ((await r.json()) as Me) : null;
}

export default function AccountBox() {
  const [me, setMe] = useState<Me | null | undefined>(undefined);
  useEffect(() => { fetchMe().then(setMe).catch(() => setMe(null)); }, []);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST', headers: H, credentials: 'same-origin' });
    setMe(null);
  }

  if (me === undefined) return <div className="card">در حال بارگذاری…</div>;
  if (!me) {
    return (
      <div className="card">
        <h1>خوش آمدید</h1>
        <p className="sub">برای ادامه وارد شوید.</p>
        <Link className="primary" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }} href="/login">ورود / ثبت‌نام</Link>
      </div>
    );
  }
  return (
    <div className="card">
      <h1>سلام {me.name ?? ''}</h1>
      <p className="sub">{me.phone ?? me.email} — نقش: {me.role.name}</p>
      <button className="primary" onClick={logout}>خروج</button>
    </div>
  );
}
