import { eq } from 'drizzle-orm';
import { getDb, users } from '@/db';
import { requireAuth } from '@/lib/auth';
import { handler, readJson } from '@/lib/http';
import { findUserById, serializeUser } from '@/lib/users';
import { profileUpdateSchema } from '@/lib/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = handler(async (req) => {
  const s = serializeUser(await requireAuth(req));
  return Response.json({ ...s, user: s }); // هم شکل مستقیم، هم {user} برای سازگاری
});

export const PUT = handler(async (req) => {
  const { user } = await requireAuth(req);
  const { name } = profileUpdateSchema.parse(await readJson(req));
  await getDb().update(users).set({ name, updatedAt: new Date() }).where(eq(users.id, user.id));
  const s = serializeUser((await findUserById(user.id))!);
  return Response.json({ ...s, user: s });
});
