import { NextResponse } from 'next/server';
import { env } from './env';
import { isWebClient } from './http';
import { createRefreshToken, signAccessToken } from './tokens';
import { serializeUser, type LoadedUser } from './users';

export const ACCESS_COOKIE = 'access_token';
export const REFRESH_COOKIE = 'refresh_token';

const secure = () => env().NODE_ENV === 'production';

export function setAuthCookies(res: NextResponse, access: string, refresh: string) {
  const e = env();
  const base = { httpOnly: true, secure: secure(), sameSite: 'lax' as const };
  res.cookies.set(ACCESS_COOKIE, access, { ...base, path: '/', maxAge: e.ACCESS_TOKEN_TTL_SECONDS });
  res.cookies.set(REFRESH_COOKIE, refresh, { ...base, path: '/api/auth', maxAge: e.REFRESH_TOKEN_TTL_DAYS * 86400 });
}

export function clearAuthCookies(res: NextResponse) {
  const base = { httpOnly: true, secure: secure(), sameSite: 'lax' as const, maxAge: 0 };
  res.cookies.set(ACCESS_COOKIE, '', { ...base, path: '/' });
  res.cookies.set(REFRESH_COOKIE, '', { ...base, path: '/api/auth' });
}

/**
 * وب (هدر X-Client: web): توکن‌ها فقط در کوکی httpOnly — در JSON نیستند (امن در برابر XSS).
 * موبایل/قدیمی: توکن‌ها در JSON (token, refresh_token) مثل قرارداد فعلی اپ فلاتر.
 */
export async function respondWithSession(req: Request, loaded: LoadedUser, refresh?: string): Promise<NextResponse> {
  const access = await signAccessToken(loaded.user.id, loaded.role.slug);
  const refreshToken = refresh ?? (await createRefreshToken(loaded.user.id, req.headers.get('user-agent')));
  const web = isWebClient(req);

  const res = NextResponse.json({
    user: serializeUser(loaded),
    expires_in: env().ACCESS_TOKEN_TTL_SECONDS,
    ...(web ? {} : { token: access, token_type: 'Bearer', refresh_token: refreshToken }),
  });
  if (web) setAuthCookies(res, access, refreshToken);
  return res;
}
