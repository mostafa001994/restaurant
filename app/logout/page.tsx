'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { clearSession, getRefreshToken } from '@/lib/token';

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    const rt = getRefreshToken();
    // نشست سمت سرور هم باطل شود (بهترین‌تلاش)
    (rt ? api.post('/auth/logout', { refresh_token: rt }).catch(() => {}) : Promise.resolve()).finally(() => {
      clearSession();
      router.replace('/login');
    });
  }, [router]);

  return null;
}
