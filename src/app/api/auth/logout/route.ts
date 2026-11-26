import { NextResponse } from 'next/server';
import { handler, parseCookies, readJsonOptional } from '@/lib/http';
import { clearAuthCookies, REFRESH_COOKIE } from '@/lib/session';
import { revokeRefreshToken } from '@/lib/tokens';
import { refreshSchema } from '@/lib/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = handler(async (req) => {
  const body = refreshSchema.safeParse(await readJsonOptional(req));
  const token = (body.success ? body.data.refresh_token : undefined) ?? parseCookies(req)[REFRESH_COOKIE];
  if (token) await revokeRefreshToken(token);
  const res = NextResponse.json({ message: 'خروج انجام شد' });
  clearAuthCookies(res);
  return res;
});
