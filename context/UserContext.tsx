// context/UserContext.tsx
'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '@/lib/api';
import type { User } from '@/types/models';

type UserContextType = {
  user: User | null;
  loading: boolean;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  refreshUser: () => void;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api
      .get('/profile')
      .then((res) => setUser(res.data))
      .catch(() => {
        // نکته مهم: این Context به‌صورت سراسری (global) در کل سایت استفاده می‌شود
        // (حتی صفحات عمومی که نیاز به لاگین ندارند). پس نبود توکن یا خطای ۴۰۱
        // یعنی کاربر مهمان است، نه اینکه باید به /login هدایت شود.
        // ریدایرکت واقعی فقط باید توسط بخش‌های محافظت‌شده (پروفایل/ادمین)
        // انجام شود، نه اینجا.
        setUser(null);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <UserContext.Provider value={{ user, loading, setUser, refreshUser: load }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser باید داخل UserProvider استفاده شود');
  return ctx;
}
