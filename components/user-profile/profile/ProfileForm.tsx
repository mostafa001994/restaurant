import React from 'react';
import { FormType } from '@/types/types';

type Props = {
  form: FormType;
  setForm: React.Dispatch<React.SetStateAction<FormType>>;
  selectedFile: File | null;
  setSelectedFile: (file: File | null) => void;
  handleSubmit: (e: React.FormEvent) => void;
  disabled?: boolean;
};



export default function ProfileForm({
  form,
  setForm,
  selectedFile,
  setSelectedFile,
  handleSubmit,
  disabled = false
}: Props) {
  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 p-4 rounded bg-white border border-amber-200"
    >
      {/* نام */}
      <div>
        <label className="block mb-1 font-medium text-amber-600">نام</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="border border-gray-400 p-2 rounded w-full text-amber-400" 
          disabled={disabled}
          required
        />
      </div>

      {/* آواتار */}
      <div className='flex justify-between relative'>
        <span className="block mb-1 font-medium absolute top-1 right-1">


      <svg className="w-20 h-20 fill-red text-amber-200">
        <use href="#icon-fileupload" />
      </svg>

          
          </span>
        <input
          type="file" className='opacity-0 w-28'
          accept="image/png,image/jpeg"
          onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
          disabled={disabled}
        />
        {form.avatar_url && !selectedFile && (
          <div className="mt-2">
            <img
              src={form.avatar_url}
              alt="آواتار"
              className="w-20 h-20 rounded-full object-cover border"
            />
          </div>
        )}
        {selectedFile && (
          <div className="mt-2">
            <img
              src={URL.createObjectURL(selectedFile)}
              alt="پیش‌نمایش آواتار"
              className="w-20 h-20 rounded-full object-cover border"
            />
          </div>
        )}
      </div>

      {/* دکمه ذخیره */}
      <button
        type="submit"
        disabled={disabled}
        className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        ذخیره تغییرات پروفایل
      </button>
    </form>
  );
}