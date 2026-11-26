'use client';

import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { User, Role } from '@/types/models';

interface Props {
  user: User;
  onClose: () => void;
  onUpdated: () => void;
}

export default function UserEditModal({ user, onClose, onUpdated }: Props) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone ?? '');
  const [roleId, setRoleId] = useState<number | ''>('');
  const [roles, setRoles] = useState<Role[]>([]);
  const [isVerified, setIsVerified] = useState<number>(user.is_verified ? 1 : 0);
  const [errors, setErrors] = useState<string[]>([]);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadRoles = async () => {
      try {
        const res = await api.get('/admin/roles');
        setRoles(res.data);

        // تنظیم مقدار اولیه نقش انتخاب‌شده
        const currentRoleId = user.role?.id;
        const matched = res.data.find((r: Role) => r.id === currentRoleId);
        if (matched) setRoleId(matched.id);
      } catch (err) {
        console.error('خطا در دریافت نقش‌ها', err);
      }
    };
    loadRoles();
  }, [user.role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    if (!roleId) {
      setErrors(['انتخاب نقش الزامی است']);
      return;
    }

    try {
      await api.put(`/admin/users/${user.id}`, {
        name,
        email,
        phone,
        role_id: roleId,
        is_verified: isVerified,
      });
      onUpdated();
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'خطا در ویرایش کاربر';
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
        className="bg-white p-6 rounded w-full max-w-md shadow-lg"
      >
        <h2 className="text-lg font-bold mb-4">ویرایش کاربر</h2>

        {errors.length > 0 && (
          <div className="bg-red-100 text-red-700 p-2 rounded mb-3 text-sm space-y-1">
            {errors.map((err, i) => (
              <div key={i}>{err}</div>
            ))}
          </div>
        )}

        <input
          type="text"
          placeholder="نام"
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full mb-2 p-2 border rounded"
        />

        <input
          type="email"
          placeholder="ایمیل"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full mb-2 p-2 border rounded"
        />

        <input
          type="text"
          placeholder="شماره موبایل"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          className="w-full mb-2 p-2 border rounded"
        />

        <select
          value={roleId}
          onChange={e => setRoleId(Number(e.target.value))}
          className="w-full mb-2 p-2 border rounded"
        >
          <option value="">انتخاب نقش</option>
          {roles.map(role => (
            <option key={role.id} value={role.id}>
              {role.name}
            </option>
          ))}
        </select>

        <select
          value={isVerified}
          onChange={e => setIsVerified(Number(e.target.value))}
          className="w-full mb-2 p-2 border rounded"
        >
          <option value={1}>تأیید شده</option>
          <option value={0}>در انتظار تأیید</option>
        </select>

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