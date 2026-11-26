// app/profile/layout.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Sidebar from '@/components/user-profile/Sidebar';
import { useUser } from '@/context/UserContext';

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login?redirect=/profile');
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return <p className="text-center mt-20 text-amber-500">در حال بارگذاری...</p>;
  }

  return (
    <div className="flex gap-4 flex-col md:flex-row mx-auto mt-10 overflow-hidden">
      <Sidebar user={user} />
      <main className="lg:w-4/5 md:w-3/4 p-6 text-right">{children}</main>
    </div>
  );
}
