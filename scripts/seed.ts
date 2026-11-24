import { config } from 'dotenv';
config({ path: '.env.local' });

// ساخت اولین ادمین: ADMIN_IDENTIFIER و ADMIN_PASSWORD را در .env.local بگذارید
async function main() {
  const { eq } = await import('drizzle-orm');
  const { getDb, users } = await import('../src/db');
  const { hashPassword } = await import('../src/lib/crypto');
  const { parseIdentifier } = await import('../src/lib/phone');
  const { getRoleBySlug, findUserByIdentifier } = await import('../src/lib/users');
  const { passwordSchema } = await import('../src/lib/validation');

  const id = parseIdentifier(process.env.ADMIN_IDENTIFIER ?? '');
  if (!id) throw new Error('ADMIN_IDENTIFIER نامعتبر است');
  const pw = passwordSchema.parse(process.env.ADMIN_PASSWORD ?? '');

  const admin = await getRoleBySlug('admin');
  const passwordHash = await hashPassword(pw);
  const now = new Date();
  const verified = id.type === 'phone' ? { phoneVerifiedAt: now } : { emailVerifiedAt: now };
  const db = getDb();

  const existing = await findUserByIdentifier(id);
  if (existing) {
    await db.update(users).set({ roleId: admin.id, passwordHash, failedLogins: 0, lockedUntil: null, ...verified, updatedAt: now }).where(eq(users.id, existing.user.id));
    console.log(`کاربر ${id.value} به ادمین ارتقا یافت.`);
  } else {
    await db.insert(users).values({ ...(id.type === 'phone' ? { phone: id.value } : { email: id.value }), name: 'Admin', passwordHash, roleId: admin.id, ...verified });
    console.log(`ادمین ${id.value} ساخته شد.`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
