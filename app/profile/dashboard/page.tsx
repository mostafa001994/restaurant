'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import DashboardTab from '@/components/user-profile/DashboardTab';
import { useUser } from '@/context/UserContext';

export default function DashboardPage() {
  const { user, setUser } = useUser();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/profile')
      .then(res => setUser(res.data))
      .finally(() => setLoading(false));
  }, [setUser]);

  if (loading) return <p className="text-center mt-20 text-amber-500">در حال بارگذاری...</p>;
  if (!user) return <p className="text-center mt-20 text-red-500">کاربر یافت نشد</p>;

  return <DashboardTab user={user} />;
}