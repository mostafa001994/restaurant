import { handler, HttpError, parseCookies, readJsonOptional, clientIp } from '@/lib/http';
import { rateLimit } from '@/lib/rate-limit';
import { REFRESH_COOKIE, respondWithSession } from '@/lib/session';
import { rotateRefreshToken } from '@/lib/tokens';
import { findUserById } from '@/lib/users';
import { refreshSchema } from '@/lib/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = handler(async (req) => {
  await rateLimit(`ip:refresh:${clientIp(req)}`, 120, 3600);
  const body = refreshSchema.parse(await readJsonOptional(req));
  const token = body.refresh_token ?? parseCookies(req)[REFRESH_COOKIE];
  if (!token) throw new HttpError(401, 'نشست یافت نشد');

  const { userId, refresh } = await rotateRefreshToken(token, req.headers.get('user-agent'));
  const loaded = await findUserById(userId);
  if (!loaded) throw new HttpError(401, 'نشست نامعتبر است');
  return respondWithSession(req, loaded, refresh);
});
