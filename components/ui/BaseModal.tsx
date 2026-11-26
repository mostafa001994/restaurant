// components/ui/BaseModal.tsx
import React from 'react';

interface Props {
  children: React.ReactNode;
  onClose: () => void;
  widthClass?: string; // مثل 'max-w-md' یا 'max-w-4xl'
  heightClass?: string; // مثل 'max-h-[80vh]' برای کنترل ارتفاع
}

export default function BaseModal({
  children,
  onClose,
  widthClass = 'max-w-2xl',
  heightClass = 'max-h-[80vh]',
}: Props) {
  return (
    <div className="fixed inset-0 z-50 bg-[#05050591] bg-blend-color-dodge flex items-center justify-center px-4">
      <div
        className={`bg-white rounded-xl shadow-lg w-full ${widthClass} ${heightClass} overflow-y-auto relative`}
      >
        {/* دکمه بستن */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-600 hover:text-black text-2xl z-10"
        >
          &times;
        </button>

        {/* محتوای مودال */}
        <div className="pt-12 pb-6 px-6">{children}</div>
      </div>
    </div>
  );
}