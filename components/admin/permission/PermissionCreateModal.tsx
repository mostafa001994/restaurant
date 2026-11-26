'use client';

import { useState, useRef } from 'react';
import { api } from '@/lib/api';

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

export default function PermissionCreateModal({ onClose, onCreated }: Props) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const modalRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    try {
      await api.post('/admin/permissions', { name, slug });
      onCreated();
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'خطا در ایجاد دسترسی';
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
        <h2 className="text-lg font-bold mb-4">افزودن دسترسی جدید</h2>

        {errors.length > 0 && (
          <div className="bg-red-100 text-red-700 p-2 rounded mb-3 text-sm space-y-1">
            {errors.map((err, i) => (
              <div key={i}>{err}</div>
            ))}
          </div>
        )}

        <input
          type="text"
          placeholder="نام دسترسی"
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
            ذخیره
          </button>
        </div>
      </form>
    </div>
  );
}