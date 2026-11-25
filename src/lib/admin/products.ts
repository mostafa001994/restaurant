import { and, eq, inArray } from 'drizzle-orm';
import { categories, getDb, ingredients, productIngredients, products, restaurants } from '@/db';
import { HttpError } from '../http';
import { serializeProductAdmin } from './serialize';

type ProductRow = typeof products.$inferSelect;

export async function ingredientsOf(productIds: number[]) {
  if (!productIds.length) return new Map<number, (typeof ingredients.$inferSelect)[]>();
  const rows = await getDb()
    .select({ productId: productIngredients.productId, i: ingredients })
    .from(productIngredients)
    .innerJoin(ingredients, eq(productIngredients.ingredientId, ingredients.id))
    .where(inArray(productIngredients.productId, productIds));
  const m = new Map<number, (typeof ingredients.$inferSelect)[]>();
  for (const r of rows) (m.get(r.productId) ?? m.set(r.productId, []).get(r.productId)!).push(r.i);
  return m;
}

export async function withRelations(rows: ProductRow[]) {
  if (!rows.length) return [];
  const db = getDb();
  const [cats, rests, ing] = await Promise.all([
    db.select().from(categories).where(inArray(categories.id, [...new Set(rows.map((p) => p.categoryId))])),
    db.select().from(restaurants).where(inArray(restaurants.id, [...new Set(rows.map((p) => p.restaurantId))])),
    ingredientsOf(rows.map((p) => p.id)),
  ]);
  return rows.map((p) =>
    serializeProductAdmin(p, {
      category: cats.find((c) => c.id === p.categoryId) ?? null,
      restaurant: rests.find((r) => r.id === p.restaurantId) ?? null,
      ingredients: ing.get(p.id) ?? [],
    }),
  );
}

/** دسته باید متعلق به همان رستوران باشد */
export async function assertCategoryBelongs(categoryId: number, restaurantId: number) {
  const [c] = await getDb().select({ id: categories.id }).from(categories).where(and(eq(categories.id, categoryId), eq(categories.restaurantId, restaurantId))).limit(1);
  if (!c) throw new HttpError(422, 'دسته‌بندی متعلق به این رستوران نیست');
}

/** جایگزینی کامل مواد اولیه‌ی یک غذا؛ حذف و درج در یک تراکنش (batch) */
export async function syncIngredients(productId: number, ids: number[]) {
  const db = getDb();
  const unique = [...new Set(ids)];
  const del = db.delete(productIngredients).where(eq(productIngredients.productId, productId));
  if (!unique.length) return void (await del);
  await db.batch([del, db.insert(productIngredients).values(unique.map((ingredientId) => ({ productId, ingredientId })))]);
}
