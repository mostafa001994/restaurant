'use client';

import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { Role, Permission } from '@/types/models';

interface Props {
  role: Role;
  onClose: () => void;
  onUpdated: () => void;
}

export default function RoleEditModal({ role, onClose, onUpdated }: Props) {
  const [name, setName] = useState(role.name);
  const [slug, setSlug] = useState(role.slug);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>(
    role.permissions?.map(p => p.id) || []
  );
  const [errors, setErrors] = useState<string[]>([]);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get('/admin/permissions').then(res => setPermissions(res.data));
  }, []);

  const togglePermission = (id: number) => {
    setSelectedPermissions(prev =>
      prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    try {
      await api.put(`/admin/roles/${role.id}`, {
        name,
        slug,
        permissions: selectedPermissions,
      });
      onUpdated();
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'خطا در ویرایش نقش';
      setErrors([msg]);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === modalRef.current) onClose();
  };

  return (
    <div
      ref={modalRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    >
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded w-full max-w-lg shadow-lg"
      >
        <h2 className="text-lg font-bold mb-4">ویرایش نقش</h2>

        {errors.length > 0 && (
          <div className="bg-red-100 text-red-700 p-2 rounded mb-3 text-sm space-y-1">
            {errors.map((err, i) => (
              <div key={i}>{err}</div>
            ))}
          </div>
        )}

        <input
          type="text"
          placeholder="نام نقش"
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full mb-2 p-2 border rounded"
        />

        <input
          type="text"
          placeholder="Slug"
          value={slug}
          onChange={e => setSlug(e.target.value)}
          className="w-full mb-2 p-2 border rounded"
        />

        <div className="mb-2">
          <label className="block font-medium mb-1">دسترسی‌ها</label>
          <div className="flex flex-col gap-1 max-h-48 overflow-y-auto border p-2 rounded">
            {permissions.map(p => (
              <label key={p.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedPermissions.includes(p.id)}
                  onChange={() => togglePermission(p.id)}
                />
                {p.name}
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 rounded"
          >
            انصراف
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-green-600 text-white rounded"
          >
            ذخیره تغییرات
          </button>
        </div>
      </form>
    </div>
  );
}