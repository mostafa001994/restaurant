import { HttpError, parseCookies } from './http';
import { ACCESS_COOKIE } from './session';
import { verifyAccessToken } from './tokens';
import { findUserById, type LoadedUser } from './users';

export async function getAuth(req: Request): Promise<LoadedUser | null> {
  const header = req.headers.get('authorization');
  const token = header?.startsWith('Bearer ') ? header.slice(7).trim() : parseCookies(req)[ACCESS_COOKIE];
  if (!token) return null;
  const id = await verifyAccessToken(token);
  return id ? findUserById(id) : null; // نقش از DB خوانده می‌شود تا تغییر نقش فوراً اعمال شود
}

export async function requireAuth(req: Request): Promise<LoadedUser> {
  const a = await getAuth(req);
  if (!a) throw new HttpError(401, 'Unauthenticated.');
  return a;
}

export async function requireRole(req: Request, ...slugs: string[]): Promise<LoadedUser> {
  const a = await requireAuth(req);
  if (!slugs.includes(a.role.slug)) throw new HttpError(403, 'دسترسی مجاز نیست');
  return a;
}
