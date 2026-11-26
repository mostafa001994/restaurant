import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { api } from '@/lib/api';

const MapPicker = dynamic(() => import('./MapPicker'), { ssr: false });

type AddressFormData = {
  title: string;
  full_name: string;
  phone: string;
  province: string;
  city: string;
  postal_code: string;
  address_line: string;
  plaque: string;
  lat: number | null;
  lng: number | null;
  is_default: boolean;
};

type AddressFormProps = {
  onSaved: () => void;
  initial?: Partial<AddressFormData> & { id?: number };
};

export default function AddressForm({ onSaved, initial }: AddressFormProps) {
  const [form, setForm] = useState<AddressFormData>({
    title: '',
    full_name: '',
    phone: '',
    province: '',
    city: '',
    postal_code: '',
    address_line: '',
    plaque: '',
    lat: null,
    lng: null,
    is_default: false,
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initial?.id) {
      setForm({
        title: initial.title || '',
        full_name: initial.full_name || '',
        phone: initial.phone || '',
        province: initial.province || '',
        city: initial.city || '',
        postal_code: initial.postal_code || '',
        address_line: initial.address_line || '',
        plaque: initial.plaque || '',
        lat: initial.lat ?? null,
        lng: initial.lng ?? null,
        is_default: initial.is_default ?? false,
      });
    } else {
      api.get('/profile')
        .then((res) => {
          setForm((prev) => ({
            ...prev,
            full_name: res.data.name || '',
            phone: res.data.phone || '',
          }));
        })
        .catch(() => { });
    }
  }, [initial]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (initial?.id) {
        await api.put(`/api/addresses/${initial.id}`, form);
      } else {
        await api.post('/addresses', form);
      }
      onSaved();
      if (!initial?.id) {
        setForm({
          title: '',
          full_name: '',
          phone: '',
          province: '',
          city: '',
          postal_code: '',
          address_line: '',
          plaque: '',
          lat: null,
          lng: null,
          is_default: false,
        });
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'خطا در ذخیره آدرس');
    } finally {
      setLoading(false);
    }
  };

  const renderField = (
    id: keyof AddressFormData,
    label: string,
    type = 'text',
    fullWidth = false,
    tall = false
  ) => (
    <div className={`${fullWidth ? 'col-span-2' : 'col-span-1'} relative`}>
      <input
        type={type}
        id={id}
        value={form[id] as string}
        onChange={(e) => setForm({ ...form, [id]: e.target.value })}
        className={`peer block w-full border border-gray-300 rounded px-2 pt-3 pb-1 
                    focus:border-blue-500 focus:ring-1 focus:ring-blue-500
                    ${tall ? 'h-12' : 'h-10'}`}
        placeholder=" "
      />
      <label
        htmlFor={id}
        className="absolute right-2 -top-2 bg-white px-1 text-gray-500 text-sm transition-all
                   peer-placeholder-shown:top-2 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-base
                   peer-focus:-top-2 peer-focus:text-sm peer-focus:text-blue-500"
      >
        {label}
      </label>
    </div>
  );

  return (
    <div className="space-y-4 border p-4 rounded bg-white shadow">
      <h3 className="font-bold text-lg text-gray-700">
        {initial?.id ? 'ویرایش آدرس' : 'افزودن آدرس جدید'}
      </h3>

      {/* فیلدهای دو ستونه */}
      <div className="grid grid-cols-2 gap-2">
        {renderField('title', 'عنوان (مثلاً خانه)')}
        {renderField('full_name', 'نام گیرنده')}
        {renderField('phone', 'شماره تماس')}
        {renderField('province', 'استان')}
        {renderField('city', 'شهر')}
        {renderField('postal_code', 'کد پستی')}
        {renderField('plaque', 'پلاک')}
        {renderField('address_line', 'آدرس کامل', 'text', true, true)}
      </div>



      <div className="mt-4">
        <h4 className="font-semibold text-gray-600 mb-2">انتخاب موقعیت روی نقشه</h4>
        <MapPicker
          initialPosition={
            form.lat !== null && form.lng !== null ? [form.lat, form.lng] : undefined
          }
          onSelect={(lat, lng, addressData) =>
            setForm({
              ...form,
              lat,
              lng,
              province: addressData?.province || form.province,
              city: addressData?.city || form.city,
              address_line: addressData?.address || form.address_line,
            })
          }
        />
        {form.lat !== null && form.lng !== null && (
          <div className="text-sm text-gray-500 mt-2">
            مختصات انتخاب‌شده: {form.lat}, {form.lng}
          </div>
        )}
      </div>

      <div className='flex justify-between'>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading
            ? 'در حال ذخیره...'
            : initial?.id
              ? 'ویرایش آدرس'
              : 'ذخیره آدرس'}
        </button>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.is_default}
            onChange={(e) => setForm({ ...form, is_default: e.target.checked })}
          />
          <span>آدرس پیش‌فرض</span>
        </label>
      </div>

    </div>

  );
}