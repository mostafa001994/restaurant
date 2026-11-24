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
