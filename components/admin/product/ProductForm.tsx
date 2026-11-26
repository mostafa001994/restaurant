'use client';

import { useState } from 'react';
import { Category, Ingredient, Restaurant, Product } from '@/types/models';

interface Props {
  initialValues?: Partial<Product>;   // برای ویرایش یا ایجاد
  categories: Category[];
  ingredients: Ingredient[];
  restaurants: Restaurant[];
  onSubmit: (data: FormData) => Promise<void>; // هندلر ارسال
  submitting: boolean;
  errors: string[];
}

export default function ProductForm({
  initialValues = {},
  categories,
  ingredients,
  restaurants,
  onSubmit,
  submitting,
  errors,
}: Props) {
  const [form, setForm] = useState({
    name: initialValues.name || '',
    description: initialValues.description || '',
    price: String(initialValues.price || ''),
    discount_price: String(initialValues.discount_price || ''),
    stock: String(initialValues.stock || ''),
    category_id: String(initialValues.category_id || ''),
    restaurant_id: String(initialValues.restaurant_id || ''),
    ingredients: initialValues.ingredients?.map(i => i.id) || [],
    image: null as File | null,
    status: (initialValues.status as 'active' | 'inactive') || 'active',
  });

  const [preview, setPreview] = useState<string | null>(
    initialValues.image
      ? `${process.env.NEXT_PUBLIC_API_URL}/storage/${initialValues.image}`
      : null
  );

  const handleImageChange = (file: File | null) => {
    setForm(prev => ({ ...prev, image: file }));
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreview(
        initialValues.image
          ? `${process.env.NEXT_PUBLIC_API_URL}/storage/${initialValues.image}`
          : null
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = new FormData();
    data.append('name', form.name);
    data.append('description', form.description);
    data.append('price', form.price);
    data.append('discount_price', form.discount_price);
    data.append('stock', form.stock);
    data.append('category_id', form.category_id);
    data.append('restaurant_id', form.restaurant_id);
    data.append('status', form.status);
    form.ingredients.forEach(id => data.append('ingredients[]', String(id)));
    if (form.image) data.append('image', form.image);

    await onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors.length > 0 && (
        <div className="bg-red-100 text-red-700 p-2 rounded text-sm space-y-1">
          {errors.map((err, i) => (
            <div key={i}>{err}</div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          type="text"
          placeholder="نام محصول"
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
          className="p-2 border rounded"
        />

        <select
          value={form.status}
          onChange={e =>
            setForm({ ...form, status: e.target.value as 'active' | 'inactive' })
          }
          className="p-2 border rounded"
        >
          <option value="active">فعال</option>
          <option value="inactive">غیرفعال</option>
        </select>

        <input
          type="number"
          placeholder="قیمت"
          value={form.price}
          onChange={e => setForm({ ...form, price: e.target.value })}
          className="p-2 border rounded"
          min="0"
          step="0.01"
        />

        <input
          type="number"
          placeholder="درصد تخفیف"
          value={form.discount_price}
          onChange={e => setForm({ ...form, discount_price: e.target.value })}
          className="p-2 border rounded"
          min="0"
          step="0.01"
        />

        <input
          type="number"
          placeholder="موجودی"
          value={form.stock}
          onChange={e => setForm({ ...form, stock: e.target.value })}
          className="p-2 border rounded"
          min="0"
          step="1"
        />

        <select
          value={form.category_id}
          onChange={e => setForm({ ...form, category_id: e.target.value })}
          className="p-2 border rounded"
        >
          <option value="">انتخاب دسته‌بندی</option>
          {categories.map(cat => (
            <option key={cat.id} value={String(cat.id)}>
              {cat.name}
            </option>
          ))}
        </select>

        <select
          value={form.restaurant_id}
          onChange={e => setForm({ ...form, restaurant_id: e.target.value })}
          className="p-2 border rounded"
        >
          <option value="">انتخاب رستوران</option>
          {restaurants.map(r => (
            <option key={r.id} value={String(r.id)}>
              {r.name}
            </option>
          ))}
        </select>
      </div>

      <textarea
        placeholder="توضیحات محصول"
        value={form.description}
        onChange={e => setForm({ ...form, description: e.target.value })}
        className="w-full p-2 border rounded"
        rows={3}
      />

      <div>
        <label className="block mb-1 text-sm">مواد اولیه:</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-32 overflow-y-auto border rounded p-2">
          {ingredients.map(ing => {
            const checked = form.ingredients.includes(ing.id);
            return (
              <label
                key={ing.id}
                className="text-sm cursor-pointer select-none flex items-center"
              >
                <input
                  type="checkbox"
                  value={ing.id}
                  checked={checked}
                  onChange={e => {
                    const isChecked = e.target.checked;
                    setForm(prev => ({
                      ...prev,
                      ingredients: isChecked
                        ? [...prev.ingredients, ing.id]
                        : prev.ingredients.filter(id => id !== ing.id),
                    }));
                  }}
                  className="mr-2"
                />
                {ing.name}
              </label>
            );
          })}
        </div>
      </div>

      <div>
        <label className="block mb-1 text-sm">تصویر محصول:</label>
        <input
          type="file"
          accept="image/*"
          onChange={e => handleImageChange(e.target.files?.[0] || null)}
          className="w-full mb-2"
        />
        {preview && (
          <img
            src={preview}
            alt="پیش‌نمایش"
            className="w-24 h-24 object-cover mb-2 rounded border"
          />
        )}
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="submit"
          className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-60"
          disabled={submitting}
        >
          {submitting ? 'در حال ذخیره...' : 'ذخیره'}
        </button>
      </div>
    </form>
  );
}