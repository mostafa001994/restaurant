'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { Category, Ingredient, Product, Restaurant } from '@/types/models';
import BaseModal from '@/components/ui/BaseModal';
import ProductForm from './ProductForm';

interface Props {
  product: Product;
  categories: Category[];
  ingredients: Ingredient[];
  restaurants: Restaurant[];
  onClose: () => void;
  onUpdated: () => void;
}

export default function ProductEditModal({
  product,
  categories,
  ingredients,
  restaurants,
  onClose,
  onUpdated,
}: Props) {
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  return (
    <BaseModal onClose={onClose} widthClass="max-w-2xl">
      <h2 className="text-lg font-bold mb-4">ویرایش محصول</h2>
      <ProductForm
        initialValues={product}
        categories={categories}
        ingredients={ingredients}
        restaurants={restaurants}
        onSubmit={async (data) => {
          try {
            setSubmitting(true);
            data.append('_method', 'PUT');
            await api.post(`/admin/products/${product.id}`, data);
            onUpdated();
            onClose();
          } catch (err: any) {
            const backendErrors =
              err.response?.data?.errors &&
              Object.values(err.response.data.errors).flat().map(String);
            const msg = err.response?.data?.message || 'خطا در ویرایش محصول';
            setErrors(backendErrors?.length ? (backendErrors as string[]) : [msg]);
          } finally {
            setSubmitting(false);
          }
        }}
        submitting={submitting}
        errors={errors}
      />
    </BaseModal>
  );
}