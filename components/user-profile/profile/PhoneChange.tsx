import { useState } from 'react';
import { api } from '@/lib/api';

type Props = {
  user: any;
  form: any;
  setForm: (updater: any) => void;
};

export default function PhoneChange({ user, form, setForm }: Props) {
  const [step, setStep] = useState<1 | 2>(1);
  const [oldCode, setOldCode] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newCode, setNewCode] = useState('');
  const [loading, setLoading] = useState(false);

  const [showOldCodeBox, setShowOldCodeBox] = useState(false);
  const [showNewCodeBox, setShowNewCodeBox] = useState(false);

  // مرحله اول: ارسال کد به شماره فعلی
  const sendCodeToOld = async () => {
    setLoading(true);
    try {
      await api.post('/profile/change-contact/request', {
        field: 'phone',
        value: form.phone,
      });
      alert('کد به شماره فعلی ارسال شد');
      setShowOldCodeBox(true);
    } catch (err: any) {
      alert(err.response?.data?.message || 'خطا در ارسال کد به شماره فعلی');
    } finally {
      setLoading(false);
    }
  };

  // مرحله اول: تأیید کد شماره فعلی
  const confirmOldCode = async () => {
    if (!oldCode.trim()) {
      alert('کد شماره فعلی را وارد کنید');
      return;
    }

    setLoading(true);
    try {
      await api.post('/profile/change-contact/verify', {
        field: 'phone',
        value: form.phone,
        old_code: oldCode,
        new_code: '-', // مقدار ساختگی برای عبور از اعتبارسنجی کد جدید
      });
      alert('شماره فعلی تأیید شد');
      setStep(2);
    } catch (err: any) {
      alert(err.response?.data?.message || 'کد شماره فعلی نادرست است');
    } finally {
      setLoading(false);
    }
  };

  // مرحله دوم: ارسال کد به شماره جدید
  const sendCodeToNew = async () => {
    if (!newPhone.trim()) {
      alert('شماره جدید را وارد کنید');
      return;
    }
    setLoading(true);
    try {
      await api.post('/profile/change-contact/request', {
        field: 'phone',
        value: newPhone,
      });
      alert('کد به شماره جدید ارسال شد');
      setShowNewCodeBox(true);
    } catch (err: any) {
      alert(err.response?.data?.message || 'خطا در ارسال کد به شماره جدید');
    } finally {
      setLoading(false);
    }
  };

  // مرحله دوم: تأیید کد شماره جدید و ذخیره
  const confirmNewCode = async () => {
    if (!newCode.trim()) {
      alert('کد شماره جدید را وارد کنید');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/profile/change-contact/verify', {
        field: 'phone',
        value: newPhone,
        new_code: newCode,
      });
      alert(res.data?.message || 'شماره با موفقیت تغییر کرد');
      setForm((prev: any) => ({ ...prev, phone: newPhone }));

      // ریست فرم
      setStep(1);
      setOldCode('');
      setNewPhone('');
      setNewCode('');
      setShowOldCodeBox(false);
      setShowNewCodeBox(false);
    } catch (err: any) {
      alert(err.response?.data?.message || 'کد شماره جدید نادرست است');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-amber-200 p-4 rounded bg-white">
      <h3 className="font-bold mb-2 text-yellow-800">تغییر شماره موبایل</h3>
      <p className="mb-2 text-green-600">شماره فعلی: {form.phone}</p>

      {/* مرحله اول */}
      {step === 1 && (
        <div className="space-y-3">
          <button
            type="button"
            onClick={sendCodeToOld}
            disabled={loading}
            className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {loading ? 'در حال ارسال...' : 'ارسال کد به شماره فعلی'}
          </button>

          {showOldCodeBox && (
            <>
              <input
                type="text"
                value={oldCode}
                onChange={(e) => setOldCode(e.target.value)}
                placeholder="کد ارسال شده به شماره فعلی"
                className="border p-2 rounded w-full"
              />
              <button
                type="button"
                onClick={confirmOldCode}
                disabled={loading}
                className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
              >
                {loading ? 'در حال بررسی...' : 'تأیید شماره فعلی'}
              </button>
            </>
          )}
        </div>
      )}

      {/* مرحله دوم */}
      {step === 2 && (
        <div className="space-y-3">
          <input
            type="tel"
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
            placeholder="شماره جدید"
            className="border p-2 rounded w-full"
          />

          <button
            type="button"
            onClick={sendCodeToNew}
            disabled={loading}
            className="bg-amber-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {loading ? 'در حال ارسال...' : 'ارسال کد به شماره جدید'}
          </button>

          {showNewCodeBox && (
            <>
              <input
                type="text"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                placeholder="کد ارسال شده به شماره جدید"
                className="border p-2 rounded w-full"
              />
              <button
                type="button"
                onClick={confirmNewCode}
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
              >
                {loading ? 'در حال تأیید...' : 'تأیید و ذخیره شماره جدید'}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}