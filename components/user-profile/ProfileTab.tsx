import ProfileForm from './profile/ProfileForm';
import PhoneVerification from './profile/PhoneVerification';
import PhoneChange from './profile/PhoneChange';
import EmailChange from './profile/EmailChange';
import { ProfileTabProps } from '@/types/types';

export default function ProfileTab({
  user,
  form,
  setForm,
  selectedFile,
  setSelectedFile,
  handleSubmit
}: ProfileTabProps) {
  const phoneVerified = Boolean(user?.phone_verified_at);

  return (
    <div className="space-y-6">
      {/* اگر شماره تایید نشده باشد */}
      {!phoneVerified && (
        <PhoneVerification user={user} form={form} setForm={setForm} />
      )}

      {/* فرم جدید ویرایش نام و آواتار */}
      <ProfileForm
        form={form}
        setForm={setForm}
        selectedFile={selectedFile}
        setSelectedFile={setSelectedFile}
        handleSubmit={handleSubmit}
        disabled={!phoneVerified}
      />

      {/* تغییر شماره فقط وقتی شماره تایید شده باشد */}
      {phoneVerified && (
        <PhoneChange user={user} form={form} setForm={setForm} />
      )}

      {/* تغییر ایمیل */}
      <EmailChange user={user} form={form} setForm={setForm} />
    </div>
  );
}