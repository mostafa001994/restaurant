// AddressEditModal.tsx

import AddressForm from './AddressForm';

export default function AddressEditModal({
  initial,
  onClose,
  onSaved,
}: {
  initial: any;
  onClose: () => void;
  onSaved: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-[#000000f5] bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl max-h-[calc(100vh-2rem)] overflow-y-auto my-4 p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-red-500"
        >
          ✕
        </button>
        <AddressForm initial={initial} onSaved={onSaved} />
      </div>
    </div>
  );
}