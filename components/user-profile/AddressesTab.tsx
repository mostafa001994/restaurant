// AddressList.tsx
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import AddressModal from './address/AddressModal';
import AddressEditModal from './address/AddressEditModal';

export default function AddressList() {
  const [addresses, setAddresses] = useState([]);
  const [editing, setEditing] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchAddresses = async () => {
    try {
      const res = await api.get('/addresses');
      setAddresses(res.data);
    } catch (err) {
      console.error('خطا در دریافت آدرس‌ها', err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('آیا مطمئن هستید؟')) return;
    await api.delete(`/addresses/${id}`);
    fetchAddresses();
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-lg text-amber-700">آدرس‌های من</h3>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          افزودن آدرس جدید
        </button>
      </div>

      <ul className="space-y-4">
        {addresses.map((addr: any) => (
          <li key={addr.id} className="border p-4 rounded bg-white">
            <div className="font-bold">{addr.full_name}</div>
            <div>{addr.phone}</div>
            <div>{addr.province}، {addr.city}</div>
            <div>{addr.address_line}</div>
            {addr.is_default && <div className="text-green-600 text-sm">آدرس پیش‌فرض</div>}

            <div className="mt-2 space-x-2">
              <button
                onClick={() => setEditing(addr)}
                className="bg-blue-600 text-white px-3 py-1 rounded"
              >
                ویرایش
              </button>
              <button
                onClick={() => handleDelete(addr.id)}
                className="bg-red-600 text-white px-3 py-1 rounded"
              >
                حذف
              </button>
            </div>
          </li>
        ))}
      </ul>

      {showAddModal && (
        <AddressModal
          onClose={() => setShowAddModal(false)}
          onSaved={() => {
            setShowAddModal(false);
            fetchAddresses();
          }}
        />
      )}

      {editing && (
        <AddressEditModal
          initial={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            fetchAddresses();
          }}
        />
      )}
    </div>
  );
}