import { useState } from 'react';
import { api } from '@/lib/api';

type Props = {
  user: any;
  form: any;
  setForm: (updater: any) => void;
};

export default function EmailChange({ user, form, setForm }: Props) {
  const [step, setStep] = useState<1 | 2>(1);
  const [oldCode, setOldCode] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newCode, setNewCode] = useState('');
  const [loading, setLoading] = useState(false);

  const [showOldCodeBox, setShowOldCodeBox] = useState(false);
  const [showNewCodeBox, setShowNewCodeBox] = useState(false);

  // مرحله اول: ارسال کد به ایمیل فعلی
  const sendCodeToOld = async () => {
    setLoading(true);
    try {
      await api.post('/profile/change-contact/request', {
        field: 'email',
        value: form.email,
      });
      alert('کد به ایمیل فعلی ارسال شد');
      setShowOldCodeBox(true);
    } catch (err: any) {
      alert(err.response?.data?.message || 'خطا در ارسال کد به ایمیل فعلی');
    } finally {
      setLoading(false);
    }
  };

  // مرحله اول: تأیید کد ایمیل فعلی
  const confirmOldCode = async () => {
    if (!oldCode.trim()) {
      alert('کد ایمیل فعلی را وارد کنید');
      return;
    }

    setLoading(true);
    try {
      await api.post('/profile/change-contact/verify', {
        field: 'email',
        value: form.email,
        old_code: oldCode,
        new_code: '-', // مقدار ساختگی برای عبور از اعتبارسنجی کد جدید
      });
      alert('ایمیل فعلی تأیید شد');
      setStep(2);
    } catch (err: any) {
      alert(err.response?.data?.message || 'کد ایمیل فعلی نادرست است');
    } finally {
      setLoading(false);
    }
  };

  // مرحله دوم: ارسال کد به ایمیل جدید
  const sendCodeToNew = async () => {
    if (!newEmail.trim()) {
      alert('ایمیل جدید را وارد کنید');
      return;
    }
    setLoading(true);
    try {
      await api.post('/profile/change-contact/request', {
        field: 'email',
        value: newEmail,
      });
      alert('کد به ایمیل جدید ارسال شد');
      setShowNewCodeBox(true);
    } catch (err: any) {
      alert(err.response?.data?.message || 'خطا در ارسال کد به ایمیل جدید');
    } finally {
      setLoading(false);
    }
  };

  // مرحله دوم: تأیید کد ایمیل جدید و ذخیره
  const confirmNewCode = async () => {
    if (!newCode.trim()) {
      alert('کد ایمیل جدید را وارد کنید');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/profile/change-contact/verify', {
        field: 'email',
        value: newEmail,
        new_code: newCode,
      });
      alert(res.data?.message || 'ایمیل با موفقیت تغییر کرد');
      setForm((prev: any) => ({ ...prev, email: newEmail }));

      // ریست فرم
      setStep(1);
      setOldCode('');
      setNewEmail('');
      setNewCode('');
      setShowOldCodeBox(false);
      setShowNewCodeBox(false);
    } catch (err: any) {
      alert(err.response?.data?.message || 'کد ایمیل جدید نادرست است');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-amber-200 p-4 rounded bg-white">
      <h3 className="font-bold mb-2 text-yellow-800">تغییر ایمیل</h3>
      <p className="mb-2 text-green-600">ایمیل فعلی: {form.email}</p>

      {/* مرحله اول */}
      {step === 1 && (
        <div className="space-y-3">
          <button
            type="button"
            onClick={sendCodeToOld}
            disabled={loading}
            className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {loading ? 'در حال ارسال...' : 'ارسال کد به ایمیل فعلی'}
          </button>

          {showOldCodeBox && (
            <>
              <input
                type="text"
                value={oldCode}
                onChange={(e) => setOldCode(e.target.value)}
                placeholder="کد ارسال شده به ایمیل فعلی"
                className="border p-2 rounded w-full"
              />
              <button
                type="button"
                onClick={confirmOldCode}
                disabled={loading}
                className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
              >
                {loading ? 'در حال بررسی...' : 'تأیید ایمیل فعلی'}
              </button>
            </>
          )}
        </div>
      )}

      {/* مرحله دوم */}
      {step === 2 && (
        <div className="space-y-3">
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="ایمیل جدید"
            className="border p-2 rounded w-full"
          />

          <button
            type="button"
            onClick={sendCodeToNew}
            disabled={loading}
            className="bg-amber-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {loading ? 'در حال ارسال...' : 'ارسال کد به ایمیل جدید'}
          </button>

          {showNewCodeBox && (
            <>
              <input
                type="text"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                placeholder="کد ارسال شده به ایمیل جدید"
                className="border p-2 rounded w-full"
              />
              <button
                type="button"
                onClick={confirmNewCode}
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
              >
                {loading ? 'در حال تأیید...' : 'تأیید و ذخیره ایمیل جدید'}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}