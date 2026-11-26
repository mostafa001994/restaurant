'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { User } from '@/types/models';
import UserEditModal from '@/components/admin/user/UserEditModal';

export default function UserListPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const loadUsers = () => {
    api.get('/admin/users').then(res => setUsers(res.data.items ?? res.data));
  };

  useEffect(() => {
    loadUsers();
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-lg font-bold mb-4">مدیریت کاربران</h1>

      <table className="w-full border text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2">نام</th>
            <th className="p-2">ایمیل</th>
            <th className="p-2">شماره موبایل</th>
            <th className="p-2">نقش</th>
            <th className="p-2">وضعیت</th>
            <th className="p-2">تاریخ ثبت‌نام</th>
            <th className="p-2">عملیات</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id} className="border-t">
              <td className="p-2">{user.name}</td>
              <td className="p-2">{user.email}</td>
              <td className="p-2">{user.phone}</td>
              <td className="p-2">{user.role?.name ?? 'بدون نقش'}</td>
              <td className="p-2">  {user.is_verified ? 'فعال' : 'غیرفعال'}</td>
              <td className="p-2">{new Date(user.created_at).toLocaleDateString('fa-IR')}</td>
              <td className="p-2 flex gap-2">
                <button
                  onClick={() => {
                    setSelectedUser(user);
                    setShowEditModal(true);
                  }}
                  className="text-blue-600 hover:underline"
                >
                  ویرایش
                </button>
                <button
                  onClick={async () => {
                    if (!confirm('آیا مطمئن هستید؟')) return;
                    await api.delete(`/admin/users/${user.id}`);
                    loadUsers();
                  }}
                  className="text-red-600 hover:underline"
                >
                  حذف
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showEditModal && selectedUser && (
        <UserEditModal
          user={selectedUser}
          onClose={() => {
            setShowEditModal(false);
            setSelectedUser(null);
          }}
          onUpdated={loadUsers}
        />
      )}
    </div>
  );
}