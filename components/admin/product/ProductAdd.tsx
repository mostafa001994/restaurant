'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { Category, Ingredient, Restaurant } from '@/types/models';
import BaseModal from '@/components/ui/BaseModal';
import ProductForm from './ProductForm';

interface ProductModalProps {
  categories: Category[];
  ingredients: Ingredient[];
  restaurants: Restaurant[];
  onClose: () => void;
  onCreated: () => void;
}

export default function ProductModal({
  categories,
  ingredients,
  restaurants,
  onClose,
  onCreated,
}: ProductModalProps) {
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  return (
    <BaseModal onClose={onClose} widthClass="max-w-2xl">
      <h2 className="text-lg font-bold mb-4">افزودن محصول</h2>
      <ProductForm
        categories={categories}
        ingredients={ingredients}
        restaurants={restaurants}
        onSubmit={async (data) => {
          try {
            setSubmitting(true);
            await api.post('/admin/products', data);
            onCreated();
            onClose();
          } catch (err: any) {
            const backendErrors =
              err.response?.data?.errors &&
              Object.values(err.response.data.errors).flat().map(String);
            const msg = err.response?.data?.message || 'خطا در ایجاد محصول';
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