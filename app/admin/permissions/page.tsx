'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Permission } from '@/types/models';
import PermissionEditModal from '@/components/admin/permission/PermissionEditModal';
import PermissionCreateModal from '@/components/admin/permission/PermissionCreateModal';

export default function PermissionListPage() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPermission, setSelectedPermission] = useState<Permission | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const loadPermissions = async () => {
    try {
      const res = await api.get('/admin/permissions');
      setPermissions(res.data);
    } catch (error) {
      console.error('خطا در دریافت دسترسی‌ها', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPermissions();
  }, []);

  if (loading) return <div className="p-4">در حال بارگذاری...</div>;

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-lg font-bold">مدیریت دسترسی‌ها</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          + افزودن دسترسی
        </button>
      </div>

      <table className="w-full border text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2">نام دسترسی</th>
            <th className="p-2">شناسه (Slug)</th>
            <th className="p-2">عملیات</th>
          </tr>
        </thead>
        <tbody>
          {permissions.map(permission => (
            <tr key={permission.id} className="border-t">
              <td className="p-2">{permission.name}</td>
              <td className="p-2">{permission.slug}</td>
              <td className="p-2">
                <button
                  onClick={() => setSelectedPermission(permission)}
                  className="text-blue-600 hover:underline"
                >
                  ویرایش
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedPermission && (
        <PermissionEditModal
          permission={selectedPermission}
          onClose={() => setSelectedPermission(null)}
          onUpdated={loadPermissions}
        />
      )}

      {showCreateModal && (
        <PermissionCreateModal
          onClose={() => setShowCreateModal(false)}
          onCreated={loadPermissions}
        />
      )}
    </div>
  );
}