import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

type Props = {
  user: any;
  form: any;
  setForm: (updater: any) => void;
};

export default function PhoneVerification({ user, form, setForm }: Props) {
  const [phone, setPhone] = useState(form.phone || '');
  const [code, setCode] = useState('');
  const [showCodeBox, setShowCodeBox] = useState(false); // strictly controls visibility
  const [loading, setLoading] = useState(false);

  // mode: verify (first-time) vs change (after verified)
  const [mode, setMode] = useState<'verify' | 'change'>(
    user?.phone_verified ? 'change' : 'verify'
  );

  // If user edits phone while the code box is shown, hide the code box (force re-send)
  useEffect(() => {
    setShowCodeBox(false);
    setCode('');
  }, [phone]);

  const handleSendCode = async () => {
    if (!phone.trim()) {
      alert('لطفاً شماره موبایل را وارد کنید');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'verify') {
        await api.post('/profile/phone/verify/request', { phone });
      } else {
        await api.post('/profile/change-contact/request', {
          field: 'phone',
          value: phone,
        });
      }
      alert('کد تأیید ارسال شد');
      setShowCodeBox(true); // show only after success
    } catch (err: any) {
      alert(err.response?.data?.message || 'خطا در ارسال کد');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!code.trim()) {
      alert('لطفاً کد تأیید را وارد کنید');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'verify') {
        const res = await api.post('/profile/phone/verify/confirm', {
          phone,
          code,
        });
        alert(res.data?.message || 'شماره موبایل با موفقیت تأیید شد');

        setForm((prev: any) => ({ ...prev, phone }));
        setMode('change'); // from now on, this is a change flow
      } else {
        const res = await api.post('/profile/change-contact/verify', {
          field: 'phone',
          value: phone,
          new_code: code,
        });
        alert(res.data?.message || 'شماره موبایل با موفقیت تغییر کرد');

        setForm((prev: any) => ({ ...prev, phone }));
      }

      // Reset UI back to pristine state
      setCode('');
      setShowCodeBox(false);
    } catch (err: any) {
      alert(err.response?.data?.message || 'کد تأیید نادرست است');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-amber-200 p-4 rounded bg-yellow-50">
      <h3 className="font-bold mb-2 text-yellow-800">
        {mode === 'verify' ? 'تأیید شماره موبایل' : 'تغییر شماره موبایل'}
      </h3>

      <input
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder={mode === 'verify' ? 'شماره موبایل' : 'شماره جدید'}
        className="border p-2 rounded w-full mb-3"
      />

      <button
        type="button"
        onClick={handleSendCode}
        disabled={loading || !phone.trim()}
        className="bg-amber-600 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loading
          ? 'در حال ارسال...'
          : mode === 'verify'
          ? 'ارسال کد تأیید'
          : 'ارسال کد تغییر شماره'}
      </button>

      {showCodeBox && (
        <div className="mt-4">
          <div className="text-sm text-gray-600 mb-2">
            کد تأیید به شماره {phone} ارسال شده است
          </div>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="کد تأیید"
            className="border p-2 rounded w-full mb-3"
          />
          <button
            type="button"
            onClick={handleVerify}
            disabled={loading || !code.trim()}
            className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {loading ? 'در حال تأیید...' : 'تأیید'}
          </button>
        </div>
      )}
    </div>
  );
}