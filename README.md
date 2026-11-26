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

## پرداخت
| مسیر | کار |
|---|---|
| `GET /api/payment/gateways` | درگاه‌های فعال `[{key,name}]` |
| `POST /api/orders/:id/pay` | `{gateway}` → `{redirect_url}` |
| `GET/POST /api/payment/callback/:gateway/:orderId` | بازگشت از بانک → ریدایرکت به `/payment/result?order_id&status&message` (همان که webview اپ فلاتر شناسایی می‌کند) |
| `GET/POST /api/admin/payment-gateways` · `PUT /api/admin/payment-gateways/:id` | تنظیمات درگاه (رمز ترمینال رمزنگاری‌شده ذخیره و هرگز برنگردانده می‌شود) |
| `GET /api/admin/transactions` · `/:id` | تراکنش‌ها، فیلتر `status` و `gateway`، صفحه‌بندی ۲۰تایی |

- `APP_URL` را حتماً روی دامنه‌ی نهایی بگذارید؛ آدرس callback از آن ساخته می‌شود.
- هر پرداخت فقط یک‌بار تایید می‌شود (claim اتمیک روی تراکنش) و سفارش فقط یک‌بار «پرداخت‌شده» می‌شود. مبلغ و authority از رکورد تراکنش خوانده می‌شود، نه از ورودی بانک/کاربر.
- زرین‌پال با `currency: "IRT"` (تومان) ارسال می‌شود؛ ملت با ×۱۰ به ریال.
- برای فعال‌کردن درگاه: `PUT /api/admin/payment-gateways/:id` با `{"is_enabled": true, ...}`؛ ملت بدون ترمینال/نام‌کاربری/رمز و زرین‌پالِ واقعی بدون merchant_id فعال نمی‌شود.

## پنل ادمین (همه‌ی مسیرها فقط نقش `admin`)
شکل پاسخ‌ها مثل لاراول است؛ فرانت فعلی فقط با عوض‌شدن `NEXT_PUBLIC_API_URL` کار می‌کند.

| مسیر | توضیح |
|---|---|
| `/api/admin/dashboard` · `/chart?metric&period` · `/recent-orders` · `/ready-for-pickup` | آمار و نمودار (روز/هفته/ماه/سال به وقت تهران) |
| `/api/admin/restaurants` (+ `/:id`, `/:id/branches`, `/:id/categories`) | صفحه‌بندی ۱۰تایی، لوگو و کاور |
| `/api/admin/branches` · `/categories` · `/products` · `/ingredients` | CRUD کامل؛ غذاها با مواد اولیه |
| `/api/admin/reviews` (`?status=pending|approved`) · `PATCH /:id` · `DELETE` | تایید/حذف نظرات |
| `/api/admin/orders` · `/:id` · `PATCH /:id/status` | سفارش‌ها |
| `/api/admin/users` · `/roles` · `/permissions` | کاربران، نقش‌ها، دسترسی‌ها |
| `/api/admin/payment-gateways` · `/transactions` | پرداخت |

- آپدیت با `POST ?_method=PUT` (multipart) هم پذیرفته می‌شود، دقیقاً مثل فرانت فعلی.
- **تصاویر**: روی S3 (پارس‌پک) آپلود می‌شوند. متغیرهای `S3_*` را پر کنید. در DB فقط کلید نسبی ذخیره می‌شود و `GET /storage/<key>` به آدرس عمومی `S3_PUBLIC_URL` ریدایرکت می‌کند، پس آدرس‌سازی کلاینت‌ها (`BASE/storage/...`) بدون تغییر کار می‌کند. نوع فایل با magic bytes بررسی می‌شود (JPG/PNG/WEBP، حداکثر ۴MB چون بدنه‌ی تابع ورسل ~۴.۵MB است).
- محافظت‌ها: ادمین نمی‌تواند خودش یا آخرین ادمین را حذف/تنزل دهد؛ نقش‌های پایه (customer/vendor/rider/admin) حذف یا slug‌شان عوض نمی‌شود؛ کاربرِ صاحب رستوران حذف نمی‌شود؛ دسته باید متعلق به همان رستوران غذا باشد؛ تغییر رمز کاربر نشست‌های او را باطل می‌کند.
- کاربری که ادمین می‌سازد، موبایل/ایمیلش تایید‌شده ثبت می‌شود.

## هنوز منتقل نشده
پنل وندور (رستوران‌دار: رستوران/شعبه/دسته/غذا/مخلفات/سفارش‌ها/داشبورد خودش)، مدیریت مخلفات غذا، تغییر شماره/ایمیل توسط خود کاربر، و قابلیت‌های جدید فلاتر. جدول `branches` تنها جدول شعبه است (جدول تکراری `restaurant_branches` حذف شد).

## عیب‌یابی
`GET /api/health` وضعیت متغیرهای محیطی (فقط true/false) و اتصال/مایگریشن دیتابیس را نشان می‌دهد. بعد از هر تغییر در Environment Variables ورسل، حتماً redeploy کنید؛ مقدارهای جدید فقط به استقرارهای جدید می‌رسند.
