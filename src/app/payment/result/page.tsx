import Link from 'next/link';

export const metadata = { title: 'نتیجه‌ی پرداخت' };

export default async function PaymentResult({ searchParams }: { searchParams: Promise<{ order_id?: string; status?: string; message?: string }> }) {
  const { order_id, status, message } = await searchParams;
  const ok = status === 'success';
  return (
    <main>
      <div className="card" style={{ textAlign: 'center' }}>
        <h1>{ok ? 'پرداخت با موفقیت انجام شد' : 'پرداخت ناموفق بود'}</h1>
        <p className="sub">
          {order_id ? `سفارش #${order_id}` : ''} {!ok && message ? `— ${message.slice(0, 200)}` : ''}
        </p>
        <Link className="primary" style={{ display: 'block', textDecoration: 'none' }} href="/">بازگشت</Link>
      </div>
    </main>
  );
}
