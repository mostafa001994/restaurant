import type { categories, ingredients, products, restaurants, users } from '@/db';
import { serializeBranch, serializeExtra, serializeProduct, serializeRestaurant } from '../serialize';

type R<T extends { $inferSelect: unknown }> = T['$inferSelect'];
type BranchRow = Parameters<typeof serializeBranch>[0];
type ExtraRow = Parameters<typeof serializeExtra>[0];

export const userBrief = (u: Pick<R<typeof users>, 'id' | 'name' | 'email' | 'phone'> | null) =>
  u ? { id: u.id, name: u.name, email: u.email, phone: u.phone } : null;

export const restaurantBrief = (r: { id: number; name: string } | null) => (r ? { id: r.id, name: r.name } : null);

export function serializeCategory(c: R<typeof categories>, extra: { restaurant?: unknown; products?: unknown[] } = {}) {
  return {
    id: c.id,
    restaurant_id: c.restaurantId,
    name: c.name,
    image: c.image,
    sort_order: c.sortOrder,
    ...extra,
  };
}

export function serializeProductAdmin(
  p: R<typeof products>,
  rel: { category?: R<typeof categories> | null; restaurant?: R<typeof restaurants> | null; ingredients?: R<typeof ingredients>[]; extras?: ExtraRow[] } = {},
) {
  return {
    ...serializeProduct(p, rel.extras ?? []),
    status: p.isAvailable ? 'active' : 'inactive', // سازگار با فرم ادمین (قبلاً فقط ورودی بود)
    ...(rel.category !== undefined ? { category: rel.category ? serializeCategory(rel.category) : null } : {}),
    ...(rel.restaurant !== undefined ? { restaurant: rel.restaurant ? serializeRestaurant(rel.restaurant) : null } : {}),
    ...(rel.ingredients ? { ingredients: rel.ingredients.map((i) => ({ id: i.id, name: i.name })) } : {}),
  };
}

export function serializeRestaurantAdmin(r: R<typeof restaurants>, rel: { user?: ReturnType<typeof userBrief>; branches?: BranchRow[] } = {}) {
  return { ...serializeRestaurant(r, rel.branches ?? []), user_id: r.userId, ...(rel.user !== undefined ? { user: rel.user } : {}) };
}
