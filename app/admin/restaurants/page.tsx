'use client';

import { useState } from 'react';
import RestaurantList from '@/components/admin/restaurant/RestaurantList';
import RestaurantFormModal from '@/components/admin/restaurant/RestaurantFormModal';
import { Restaurant } from '@/types/models';

export default function AdminRestaurantsPage() {
  const [showModal, setShowModal] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | undefined>(undefined);
  const [reloadFlag, setReloadFlag] = useState(false);

  const handleCreate = () => {
    setEditingRestaurant(undefined);
    setShowModal(true);
  };

  const handleEdit = (restaurant: Restaurant) => {
    setEditingRestaurant(restaurant);
    setShowModal(true);
  };

  const handleSaved = () => {
    setReloadFlag(!reloadFlag); // باعث رفرش لیست میشه
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">مدیریت رستوران‌ها</h1>
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-green-600 text-white rounded"
        >
          ایجاد رستوران جدید
        </button>
      </div>

      <RestaurantList key={reloadFlag ? 'reload1' : 'reload2'} onEdit={handleEdit} />

      {showModal && (
        <RestaurantFormModal
          restaurant={editingRestaurant}
          onClose={() => setShowModal(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}