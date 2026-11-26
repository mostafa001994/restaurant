'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Branch } from '@/types/models';

export default function BranchList({ onEdit }: { onEdit: (branch: Branch) => void }) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  const loadBranches = async () => {
    const res = await api.get(`/admin/branches?page=${page}`);
    setBranches(res.data.data);
    setLastPage(res.data.last_page);
  };

  useEffect(() => {
    loadBranches();
  }, [page]);

  const handleDelete = async (id: number) => {
    if (!confirm('آیا از حذف این شعبه مطمئن هستید؟')) return;
    await api.delete(`/admin/branches/${id}`);
    loadBranches();
  };

  return (
    <div className="bg-white p-4 rounded shadow">
      <h2 className="text-lg font-bold mb-4">لیست شعب</h2>
      <table className="w-full border text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">نام</th>
            <th className="p-2 border">رستوران</th>
            <th className="p-2 border">آدرس</th>
            <th className="p-2 border">تلفن</th>
            <th className="p-2 border">عملیات</th>
          </tr>
        </thead>
        <tbody>
          {branches.map(b => (
            <tr key={b.id}>
              <td className="p-2 border">{b.name}</td>
              <td className="p-2 border">{b.restaurant?.name}</td>
              <td className="p-2 border">{b.address}</td>
              <td className="p-2 border">{b.phone}</td>
              <td className="p-2 border flex gap-2">
                <button onClick={() => onEdit(b)} className="px-2 py-1 bg-blue-500 text-white rounded">ویرایش</button>
                <button onClick={() => handleDelete(b.id)} className="px-2 py-1 bg-red-500 text-white rounded">حذف</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex gap-2 mt-4 justify-center">
        {Array.from({ length: lastPage }, (_, i) => i + 1).map(p => (
          <button
            key={p}
            onClick={() => setPage(p)}
            className={`px-3 py-1 rounded ${p === page ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}