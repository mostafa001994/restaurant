'use client';

import { useState, useEffect } from 'react';
import { Category, Ingredient, Product, Restaurant } from '@/types/models';
import { api } from '@/lib/api';

interface Props {
  products: Product[];
  categories: Category[];
  ingredients: Ingredient[];
  restaurants: Restaurant[];
  onReload: () => void;
  onEdit: (product: Product) => void;
}

export default function ProductList({
  products,
  categories,
  ingredients,
  restaurants,
  onReload,
  onEdit
}: Props) {
  const [query, setQuery] = useState('');
  const [filtered, setFiltered] = useState<Product[]>(products);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const q = query.toLowerCase();
    const result = products.filter(p => p.name.toLowerCase().includes(q));
    setFiltered(result);
    setCurrentPage(1);
  }, [query, products]);

  const handleDelete = async (id: number) => {
    if (!confirm('آیا مطمئن هستید؟')) return;
    try {
      await api.delete(`/admin/products/${id}`);
      onReload();
    } catch (err) {
      console.error('خطا در حذف محصول:', err);
    }
  };

  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  return (
    <div>
      <input
        type="text"
        placeholder="جستجوی محصول..."
        value={query}
        onChange={e => setQuery(e.target.value)}
        className="mb-4 p-2 border rounded w-full max-w-sm"
      />

      <table className="w-full border text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2">تصویر</th>
            <th className="p-2">نام</th>
            <th className="p-2">قیمت</th>
            <th className="p-2">موجودی</th>
            <th className="p-2">عملیات</th>
          </tr>
        </thead>
        <tbody>
          {paginated.map(p => (
            <tr key={p.id} className="border-t">
              <td className="p-2">
                {p.image ? (
                  <img
                    src={`${process.env.NEXT_PUBLIC_API_URL}/storage/${p.image}`}
                    alt={p.name}
                    className="w-12 h-12 object-cover rounded"
                  />
                ) : '—'}
              </td>
              <td className="p-2">{p.name}</td>
              <td className="p-2">{p.price}</td>
              <td className="p-2">{p.stock}</td>
              <td className="p-2 flex gap-2">
                <button
                  onClick={() => onEdit(p)}
                  className="text-blue-600 hover:underline"
                >
                  ویرایش
                </button>
                <button
                  onClick={() => handleDelete(p.id)}
                  className="text-red-600 hover:underline"
                >
                  حذف
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div className="flex justify-center mt-4 gap-2">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`px-3 py-1 rounded ${currentPage === i + 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}