'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Role } from '@/types/models';
import RoleEditModal from '@/components/admin/role/RoleEditModal';
import RoleCreateModal from '@/components/admin/role/RoleCreateModal';

export default function RoleListPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const loadRoles = async () => {
    try {
      const res = await api.get('/admin/roles');
      setRoles(res.data);
    } catch (error) {
      console.error('خطا در دریافت نقش‌ها', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  if (loading) {
    return <div className="p-4">در حال بارگذاری...</div>;
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-lg font-bold">مدیریت نقش‌ها</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          + افزودن نقش
        </button>
      </div>

      <table className="w-full border text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2">نام نقش</th>
            <th className="p-2">شناسه (Slug)</th>
            <th className="p-2">تعداد دسترسی‌ها</th>
            <th className="p-2">عملیات</th>
          </tr>
        </thead>
        <tbody>
          {roles.map(role => (
            <tr key={role.id} className="border-t">
              <td className="p-2">{role.name}</td>
              <td className="p-2">{role.slug}</td>
              <td className="p-2">{role.permissions?.length ?? 0}</td>
              <td className="p-2">
                <button
                  onClick={() => setSelectedRole(role)}
                  className="text-blue-600 hover:underline"
                >
                  ویرایش
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedRole && (
        <RoleEditModal
          role={selectedRole}
          onClose={() => setSelectedRole(null)}
          onUpdated={loadRoles}
        />
      )}

      {showCreateModal && (
        <RoleCreateModal
          onClose={() => setShowCreateModal(false)}
          onCreated={loadRoles}
        />
      )}
    </div>
  );
}