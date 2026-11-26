import { z } from 'zod';

const schema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL تنظیم نشده است'),
  AUTH_SECRET: z.string().min(32, 'AUTH_SECRET باید حداقل ۳۲ کاراکتر باشد'),
  ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(900),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),
  KAVENEGAR_API_KEY: z.string().optional(),
  KAVENEGAR_TEMPLATE: z.string().default('verify'),
  RESEND_API_KEY: z.string().optional(),
  MAIL_FROM: z.string().optional(),
  FRONTEND_URL: z.string().url().optional(), // آدرس فرانت‌اند جداگانه؛ بعد از پرداخت کاربر به اینجا برمی‌گردد
  APP_URL: z.string().url().optional(), // آدرس عمومی سایت برای callback پرداخت، مثل https://example.com
  CORS_ALLOWED_ORIGINS: z.string().optional(), // originهای فرانتِ جدا، با کاما
  S3_ENDPOINT: z.string().url().optional(), // مثل https://s3.pars.pack
  S3_BUCKET: z.string().optional(),
  S3_ACCESS_KEY: z.string().optional(),
  S3_SECRET_KEY: z.string().optional(),
  S3_REGION: z.string().default('us-east-1'),
  S3_PUBLIC_URL: z.string().url().optional(), // آدرس عمومی خواندن فایل‌ها
  S3_ACL: z.string().optional(), // مثلاً public-read (اگر سرویس لازم دارد)
  NODE_ENV: z.string().default('development'),
});

export type Env = z.infer<typeof schema>;

let cached: Env | undefined;

/** Lazy: در زمان build به متغیرها نیازی نیست، فقط هنگام اجرا بررسی می‌شوند. */
export function env(): Env {
  if (cached) return cached;
  // مقدار خالی ("") را مثل تعریف‌نشده در نظر بگیر
  const raw = Object.fromEntries(Object.entries(process.env).filter(([, v]) => v !== undefined && v !== ''));
  const r = schema.safeParse(raw);
  if (!r.success) {
    // خطای پیکربندی، نه ورودی کاربر: نباید به‌صورت 422 «Required» به کلاینت برسد
    const keys = r.error.issues.map((i) => `${i.path.join('.')} (${i.message})`).join(', ');
    console.error(`[env] متغیرهای محیطی ناقص یا نامعتبر: ${keys}`);
    throw new Error(`Invalid environment: ${keys}`);
  }
  cached = r.data;
  return cached;
}
