import { eq } from 'drizzle-orm';
import { getDb, users } from '@/db';
import { requireAuth } from '@/lib/auth';
import { methodOverride, parseBody, type Parsed } from '@/lib/body';
import { handler, HttpError } from '@/lib/http';
import { deleteImage, saveImage } from '@/lib/storage';
import { findUserById, serializeUser } from '@/lib/users';
import { profileUpdateSchema } from '@/lib/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const out = (s: ReturnType<typeof serializeUser>) => ({ ...s, user: s }); // هم شکل مستقیم، هم {user}

export const GET = handler(async (req) => Response.json(out(serializeUser(await requireAuth(req)))));

// فقط نام و آواتار؛ ایمیل/موبایل هویت ورود هستند و بدون تایید کد تغییر نمی‌کنند (فیلدهای email/phone فرم نادیده گرفته می‌شوند)
async function update(req: Request, { fields, files }: Parsed) {
  const { user } = await requireAuth(req);
  const { name } = profileUpdateSchema.parse(fields);
  const avatar = files.avatar ? await saveImage(files.avatar, 'avatars') : undefined;
  try {
    await getDb().update(users).set({ name, ...(avatar ? { avatar } : {}), updatedAt: new Date() }).where(eq(users.id, user.id));
  } catch (e) {
    await deleteImage(avatar);
    throw e;
  }
  if (avatar) await deleteImage(user.avatar);
  const s = serializeUser((await findUserById(user.id))!);
  return Response.json({ message: 'پروفایل با موفقیت بروزرسانی شد', ...s, user: s });
}

export const PUT = handler(async (req) => update(req, await parseBody(req)));

// فرانت با POST ‎?_method=PUT و multipart ارسال می‌کند
export const POST = handler(async (req) => {
  const body = await parseBody(req);
  const m = methodOverride(req, body.fields);
  if (m !== 'PUT' && m !== 'PATCH') throw new HttpError(405, 'متد پشتیبانی نمی‌شود');
  return update(req, body);
});
