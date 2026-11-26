import { config } from 'dotenv';
config({ path: '.env.local' });

// داده‌ی نمونه برای تست اپ: یک رستوران با شعبه، دسته، چند غذا و مخلفات (به ادمین/اولین کاربر وصل می‌شود)
async function main() {
  const { getDb, users, restaurants, branches, categories, products, productExtras } = await import('../src/db');
  const db = getDb();
  const [owner] = await db.select({ id: users.id }).from(users).limit(1);
  if (!owner) throw new Error('اول `npm run db:seed` را اجرا کنید تا حداقل یک کاربر وجود داشته باشد');

  const [r] = await db.insert(restaurants).values({ userId: owner.id, name: 'رستوران نمونه', description: 'غذاهای ایرانی', address: 'قم، بلوار امین', latitude: '34.6399000', longitude: '50.8759000', openTime: '10:00', closeTime: '23:30' }).returning();
  await db.insert(branches).values({ restaurantId: r!.id, name: 'شعبه مرکزی', address: 'قم، بلوار امین', latitude: '34.6399000', longitude: '50.8759000' });
  const [c] = await db.insert(categories).values({ restaurantId: r!.id, name: 'کباب‌ها' }).returning();
  const ps = await db.insert(products).values([
    { categoryId: c!.id, restaurantId: r!.id, name: 'چلوکباب کوبیده', description: 'دو سیخ کوبیده با برنج', price: '185000', discountPrice: '10', preparationMinutes: 25 },
    { categoryId: c!.id, restaurantId: r!.id, name: 'جوجه کباب', description: 'سینه‌ی مرغ زعفرانی', price: '210000', preparationMinutes: 30 },
  ]).returning();
  await db.insert(productExtras).values([
    { productId: ps[0]!.id, name: 'ماست و خیار', price: '0' },
    { productId: ps[0]!.id, name: 'نوشابه', price: '15000' },
    { productId: ps[1]!.id, name: 'سالاد فصل', price: '0' },
  ]);
  const { ensureGateways } = await import('../src/lib/payment/service');
  const { paymentGatewaySettings } = await import('../src/db');
  const { eq } = await import('drizzle-orm');
  await ensureGateways();
  await db.update(paymentGatewaySettings).set({ isEnabled: true, sandbox: true }).where(eq(paymentGatewaySettings.key, 'zarinpal')); // زرین‌پال sandbox برای تست
  console.log('رستوران نمونه ساخته شد: id =', r!.id);
}
main().catch((e) => { console.error(e); process.exit(1); });
