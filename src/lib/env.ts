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
  APP_URL: z.string().url().optional(), // آدرس عمومی سایت برای callback پرداخت، مثل https://example.com
  NODE_ENV: z.string().default('development'),
});

export type Env = z.infer<typeof schema>;

let cached: Env | undefined;

/** Lazy: در زمان build به متغیرها نیازی نیست، فقط هنگام اجرا بررسی می‌شوند. */
export function env(): Env {
  if (cached) return cached;
  // مقدار خالی ("") را مثل تعریف‌نشده در نظر بگیر
  const raw = Object.fromEntries(Object.entries(process.env).filter(([, v]) => v !== undefined && v !== ''));
  cached = schema.parse(raw);
  return cached;
}
