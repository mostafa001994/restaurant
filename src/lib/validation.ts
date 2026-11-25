import { z } from 'zod';
import { parseIdentifier, toLatinDigits } from './phone';

const idShape = {
  identifier: z.string().max(191).optional(),
  phone: z.string().max(191).optional(),
  email: z.string().max(191).optional(),
};

/** شناسه را از identifier / phone / email (سازگار با اپ فعلی) می‌خواند و در فیلد `ident` می‌گذارد. */
const withId = <T extends z.ZodRawShape>(shape: T) =>
  z.object({ ...idShape, ...shape }).transform((d, ctx) => {
    const ident = parseIdentifier(d.identifier ?? d.phone ?? d.email ?? '');
    if (!ident) {
      ctx.addIssue({ code: 'custom', path: ['identifier'], message: 'شماره موبایل یا ایمیل معتبر نیست' });
      return z.NEVER;
    }
    return { ...d, ident };
  });

const code = z
  .string()
  .transform((v) => toLatinDigits(v).trim())
  .pipe(z.string().regex(/^\d{6}$/, 'کد تایید باید ۶ رقم باشد'));

export const passwordSchema = z
  .string()
  .min(8, 'رمز عبور باید حداقل ۸ کاراکتر باشد')
  .max(128, 'رمز عبور بیش از حد طولانی است')
  .refine((v) => /\p{L}/u.test(v) && /\d/.test(v), 'رمز عبور باید شامل حرف و عدد باشد');

const name = z.string().trim().min(2, 'نام حداقل ۲ کاراکتر باشد').max(100);

export const requestOtpSchema = withId({});
export const verifyOtpSchema = withId({ code });
export const registerSchema = withId({ name: name.optional(), password: passwordSchema });
export const loginSchema = withId({ password: z.string().min(1, 'رمز عبور را وارد کنید').max(128) });
export const forgotSchema = withId({});
export const resetSchema = withId({ code, password: passwordSchema });
export const profileUpdateSchema = z.object({ name });
export const refreshSchema = z.object({ refresh_token: z.string().min(20).max(300).optional() });

// ───── هسته‌ی مشتری ─────
const optStr = (max: number) => z.string().trim().max(max).nullish().transform((v) => v || null);
const optCoord = z.coerce.number().min(-180).max(180).nullish();

export const addressSchema = z.object({
  title: optStr(50),
  full_name: z.string().trim().min(1, 'نام گیرنده الزامی است').max(100),
  phone: z.string().trim().min(1, 'شماره تماس الزامی است').max(20),
  province: z.string().trim().min(1, 'استان الزامی است').max(100),
  city: z.string().trim().min(1, 'شهر الزامی است').max(100),
  postal_code: optStr(20),
  address_line: z.string().trim().min(1, 'آدرس الزامی است').max(500),
  plaque: optStr(20),
  lat: optCoord,
  lng: optCoord,
  is_default: z.boolean().optional().default(false),
});

export const orderSchema = z.object({
  restaurant_id: z.coerce.number().int().positive(),
  delivery_address: z.string().trim().min(1, 'آدرس تحویل الزامی است').max(500),
  delivery_lat: optCoord,
  delivery_lng: optCoord,
  items: z
    .array(
      z.object({
        product_id: z.coerce.number().int().positive(),
        quantity: z.coerce.number().int().min(1).max(99),
        extras: z
          .array(z.object({ extra_id: z.coerce.number().int().positive(), quantity: z.coerce.number().int().min(1).max(99) }))
          .max(30)
          .optional()
          .default([]),
      }),
    )
    .min(1, 'سبد خرید خالی است')
    .max(50),
});

export const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1, 'امتیاز بین ۱ تا ۵ است').max(5),
  comment: optStr(1000),
});
