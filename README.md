# Restaurant — Next.js Serverless Auth

ورود و ثبت‌نام روی Next.js 15 (Route Handlers) + Neon Postgres + Drizzle، آماده‌ی Vercel.

## راه‌اندازی
1. در [Neon](https://neon.tech) پروژه بسازید (منطقه‌ی AWS eu-central-1) و connection string را بردارید.
2. `cp .env.example .env.local` و مقادیر را پر کنید (`AUTH_SECRET` با `openssl rand -base64 48`).
3. `npm install && npm run db:migrate` (مایگریشن‌ها در `drizzle/` هستند).
4. `npm run db:seed` → ساخت اولین ادمین از `ADMIN_IDENTIFIER` / `ADMIN_PASSWORD`؛ سپس (اختیاری) `npm run db:seed-demo` برای یک رستوران نمونه.
5. `npm run dev` — بدون کلید پیامک، کد تایید در کنسول چاپ می‌شود.
6. دیپلوی: ریپو را به Vercel وصل کنید و همان env ها را در Project Settings بگذارید. (در محیط production بدون کلید پیامک/ایمیل، ارسال کد خطای 503 می‌دهد.)

## API
| مسیر | کار |
|---|---|
| `POST /api/auth/register` | `{identifier, name?, password}` → ارسال کد (حساب تا تایید ساخته نمی‌شود) |
| `POST /api/auth/otp/request` | ارسال کد ورود (برای شناسه‌ی جدید = ثبت‌نام بی‌رمز) |
| `POST /api/auth/otp/verify` | `{identifier, code}` → نشست |
| `POST /api/auth/login` | `{identifier, password}` |
| `POST /api/auth/refresh` | چرخش refresh token |
| `POST /api/auth/logout` | |
| `POST /api/auth/password/forgot` · `/reset` | بازیابی رمز با کد |
| `GET/PUT /api/profile` | پروفایل |
| `/api/send-otp` · `/api/verify-otp` | نام‌های قدیمیِ اپ فلاتر |
| `GET /api/restaurants` · `/api/restaurants/:id` · `/api/restaurants/:id/products` | رستوران‌ها (با شعبه)، غذاها (با مخلفات فعال) — عمومی |
| `GET/POST /api/addresses` · `PUT/DELETE /api/addresses/:id` | آدرس‌های کاربر (مالکیت در خود کوئری بررسی می‌شود) |
| `GET/POST /api/orders` · `GET /api/orders/:id` | سفارش‌ها؛ قیمت‌ها فقط از DB محاسبه می‌شوند، ثبت سفارش اتمیک است |
| `GET/POST /api/products/:id/reviews` · `GET .../reviews/eligibility` | نظرات (فقط خریداران تحویل‌گرفته؛ نیاز به تایید ادمین) |

## امنیت (خلاصه)
- رمز: scrypt؛ کد: ۶ رقم، HMAC در DB، ۱۲۰ ثانیه، حداکثر ۵ تلاش، مصرف اتمیک، کولداون ۶۰ ثانیه
- Rate limit در DB (IP + شناسه)؛ قفل ۱۵ دقیقه‌ای پس از ۵ ورود ناموفق
- access JWT کوتاه‌عمر + refresh چرخشی با تشخیص استفاده‌ی مجدد
- وب: کوکی httpOnly/SameSite=Lax و فقط JSON؛ موبایل: Bearer
- پاسخ‌های یکسان برای جلوگیری از افشای وجود حساب

جزئیات اپ فلاتر: `docs/FLUTTER.md`

## هنوز منتقل نشده
پرداخت (`/payment/gateways`، `/orders/:id/pay`، زرین‌پال/ملت)، پنل ادمین و وندور، داشبورد آمار. جدول `branches` تنها جدول شعبه است (جدول تکراری `restaurant_branches` حذف شد).
