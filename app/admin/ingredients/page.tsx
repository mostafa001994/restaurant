'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Ingredient } from '@/types/models';
import IngredientModal from '@/components/admin/ingredient/IngredientModal';
import IngredientEditModal from '@/components/admin/ingredient/IngredientEditModal';

export default function IngredientListPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);

  const loadIngredients = () => {
    api.get('/admin/ingredients').then(res => setIngredients(res.data.items ?? res.data));
  };

  useEffect(() => {
    loadIngredients();
  }, []);

  return (
    <div className="p-4">
      <button
        onClick={() => setShowCreateModal(true)}
        className="bg-blue-600 text-white px-4 py-2 rounded mb-4"
      >
        افزودن ماده اولیه
      </button>

      <table className="w-full border text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2">نام</th>
            <th className="p-2">عملیات</th>
          </tr>
        </thead>
        <tbody>
          {ingredients.map(ing => (
            <tr key={ing.id} className="border-t">
              <td className="p-2">{ing.name}</td>
              <td className="p-2 flex gap-2">
                <button
                  onClick={() => {
                    setSelectedIngredient(ing);
                    setShowEditModal(true);
                  }}
                  className="text-blue-600 hover:underline"
                >
                  ویرایش
                </button>
                <button
                  onClick={async () => {
                    if (!confirm('آیا مطمئن هستید؟')) return;
                    await api.delete(`/admin/ingredients/${ing.id}`);
                    loadIngredients();
                  }}
                  className="text-red-600 hover:underline"
                >
                  حذف
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showCreateModal && (
        <IngredientModal
          onClose={() => setShowCreateModal(false)}
          onCreated={loadIngredients}
        />
      )}

      {showEditModal && selectedIngredient && (
        <IngredientEditModal
          ingredient={selectedIngredient}
          onClose={() => {
            setShowEditModal(false);
            setSelectedIngredient(null);
          }}
          onUpdated={loadIngredients}
        />
      )}
    </div>
  );
}