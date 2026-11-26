import { z } from 'zod';
import { boolish, hhmm, intNull, numNull, textNull } from '../body';

const id = z.coerce.number().int().positive();

export const restaurantCreate = z.object({
  user_id: id,
  name: z.string().trim().min(1, 'نام الزامی است').max(255),
  description: textNull(5000).optional(),
  address: textNull(500).optional(),
  latitude: numNull.optional(),
  longitude: numNull.optional(),
  open_time: hhmm.optional(),
  close_time: hhmm.optional(),
  is_open: boolish.optional(),
  status: z.enum(['active', 'inactive', 'pending']).default('active'),
});
export const restaurantUpdate = restaurantCreate.partial();

export const branchCreate = z.object({
  restaurant_id: id,
  name: z.string().trim().min(1, 'نام الزامی است').max(255),
  address: textNull(500).optional(),
  phone: textNull(20).optional(),
  latitude: numNull.optional(),
  longitude: numNull.optional(),
  is_active: boolish.optional(),
});
export const branchUpdate = branchCreate.partial();

export const categoryCreate = z.object({
  restaurant_id: id,
  name: z.string().trim().min(1, 'نام الزامی است').max(255),
  sort_order: intNull.optional(),
});
export const categoryUpdate = categoryCreate.partial();

export const productCreate = z.object({
  name: z.string().trim().min(1, 'نام الزامی است').max(255),
  description: textNull(5000).optional(),
  price: z.coerce.number().min(0, 'قیمت نامعتبر است'),
  discount_price: numNull.optional(), // درصد تخفیف
  stock: z.coerce.number().int(),
  preparation_minutes: intNull.optional(),
  category_id: id,
  restaurant_id: id,
  status: z.enum(['active', 'inactive']).default('active'),
  ingredients: z.array(z.coerce.number().int().positive()).max(100).optional(),
});
export const productUpdate = productCreate.partial();

export const nameOnly = z.object({ name: z.string().trim().min(1, 'نام الزامی است').max(255) });

export const reviewUpdate = z.object({ is_approved: boolish });

export const orderStatus = z.object({
  status: z.enum(['pending', 'accepted', 'preparing', 'ready_for_pickup', 'on_the_way', 'delivered', 'cancelled'], { message: 'وضعیت نامعتبر است' }),
});

const slug = z.string().trim().min(1).max(191);
export const roleSchema = z.object({
  name: z.string().trim().min(1).max(191),
  slug,
  permissions: z.array(id).max(500).optional(),
});
export const permissionSchema = z.object({ name: z.string().trim().min(1).max(191), slug });

export const userCreate = z.object({
  name: z.string().trim().min(1).max(255),
  email: z.string().trim().email().max(191).nullish(),
  phone: z.string().trim().max(20).nullish(),
  role_id: id,
  password: z.string().min(6, 'رمز عبور حداقل ۶ کاراکتر').max(128),
});
export const userUpdate = z.object({
  name: z.string().trim().min(1).max(255),
  email: z.string().trim().email().max(191).nullish(),
  phone: z.string().trim().max(20).nullish(),
  role_id: id,
  is_verified: boolish,
  password: z.string().max(128).nullish(),
});
