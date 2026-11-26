// app/profile/profile/page.tsx
'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import ProfileTab from '@/components/user-profile/ProfileTab';
import { FormType } from '@/types/types';
import { useUser } from '@/context/UserContext';

export default function ProfilePage() {
  const { user, setUser } = useUser();
  const [form, setForm] = useState<FormType>({
    name: user?.name ?? '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
    avatar_url: user?.avatar_url ?? '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', form.name);
    formData.append('email', form.email);
    formData.append('phone', form.phone);
    if (selectedFile) formData.append('avatar', selectedFile);

    try {
      const res = await api.post('/profile?_method=PUT', formData);
      const updatedUser = res.data.user ?? res.data;
      updatedUser.avatar_url = `${updatedUser.avatar_url}?t=${Date.now()}`;
      setUser(updatedUser); // 👈 لحظه‌ای Sidebar و همه جا آپدیت میشه
      alert('✅ اطلاعات با موفقیت ذخیره شد');
    } catch (err: any) {
      alert(err.response?.data?.message || '❌ خطا در ذخیره اطلاعات');
    }
  };

  if (!user) return <p>در حال بارگذاری...</p>;

  return (
    <ProfileTab
      user={user}
      setUser={setUser}
      form={form}
      setForm={setForm}
      selectedFile={selectedFile}
      setSelectedFile={setSelectedFile}
      handleSubmit={handleSubmit}
    />
  );
}