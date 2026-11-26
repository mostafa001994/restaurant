import { api } from './api';
import { Category, Ingredient, Product, Restaurant } from '@/types/models';

function normalizeApiArray<T>(res: any): T[] {
  if (Array.isArray(res.data?.data)) return res.data.data;
  if (Array.isArray(res.data?.items)) return res.data.items;
  if (Array.isArray(res.data)) return res.data;
  return [];
}

export async function loadRestaurants(): Promise<Restaurant[]> {
  try {
    // این تابع از صفحه‌ی اصلی (عمومی، بدون نیاز به لاگین) هم استفاده می‌شود؛
    // به همین دلیل باید به روت عمومی وصل شود، نه /admin/restaurants
    // (که حالا نیاز به لاگین ادمین دارد).
    const res = await api.get('/restaurants');
    return normalizeApiArray<Restaurant>(res);
  } catch {
    return [];
  }
}

export async function loadCategories(): Promise<Category[]> {
  try {
    const res = await api.get('/admin/categories');
    return normalizeApiArray<Category>(res);
  } catch {
    return [];
  }
}

export async function loadIngredients(): Promise<Ingredient[]> {
  try {
    const res = await api.get('/admin/ingredients');
    return normalizeApiArray<Ingredient>(res);
  } catch {
    return [];
  }
}

export async function loadProducts(): Promise<Product[]> {
  try {
    const res = await api.get('/admin/products');
    return normalizeApiArray<Product>(res);
  } catch {
    return [];
  }
}