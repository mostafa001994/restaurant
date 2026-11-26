// ریشه‌ی بک‌اند: فقط API است. رابط کاربری در پروژه‌ی فرانت‌اند جداگانه است.
const front = process.env.FRONTEND_URL;

export default function Home() {
  return (
    <main style={{ fontFamily: 'sans-serif', direction: 'rtl', maxWidth: 480, margin: '80px auto', padding: 16, lineHeight: 2 }}>
      <h1>API رستوران</h1>
      <p>این پروژه فقط سرویس بک‌اند است.</p>
      <p><a href="/api/health">وضعیت سرویس (/api/health)</a></p>
      {front && <p><a href={front}>رفتن به سایت</a></p>}
    </main>
  );
}
