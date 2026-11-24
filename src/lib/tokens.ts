import { and, eq, gt, isNull } from 'drizzle-orm';
import { jwtVerify, SignJWT } from 'jose';
import { getDb, refreshTokens } from '@/db';
import { randomToken, sha256 } from './crypto';
import { env } from './env';
import { HttpError } from './http';

const ISS = 'restaurant-api';
const key = () => new TextEncoder().encode(env().AUTH_SECRET);

export function signAccessToken(userId: number, role: string): Promise<string> {
  return new SignJWT({ role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(String(userId))
    .setIssuer(ISS)
    .setIssuedAt()
    .setExpirationTime(`${env().ACCESS_TOKEN_TTL_SECONDS}s`)
    .sign(key());
}

export async function verifyAccessToken(token: string): Promise<number | null> {
  try {
    const { payload } = await jwtVerify(token, key(), { issuer: ISS, algorithms: ['HS256'] });
    const id = Number(payload.sub);
    return Number.isInteger(id) ? id : null;
  } catch {
    return null;
  }
}

export async function createRefreshToken(userId: number, userAgent: string | null): Promise<string> {
  const token = randomToken();
  await getDb().insert(refreshTokens).values({
    userId,
    tokenHash: sha256(token),
    userAgent: userAgent?.slice(0, 255) ?? null,
    expiresAt: new Date(Date.now() + env().REFRESH_TOKEN_TTL_DAYS * 86_400_000),
  });
  return token;
}

/** چرخش refresh token: قدیمی اتمیک باطل می‌شود؛ استفاده‌ی مجدد از توکن باطل‌شده = سرقت → همه‌ی نشست‌ها باطل. */
export async function rotateRefreshToken(token: string, userAgent: string | null): Promise<{ userId: number; refresh: string }> {
  const db = getDb();
  const hash = sha256(token);
  const now = new Date();

  const [revoked] = await db
    .update(refreshTokens)
    .set({ revokedAt: now })
    .where(and(eq(refreshTokens.tokenHash, hash), isNull(refreshTokens.revokedAt), gt(refreshTokens.expiresAt, now)))
    .returning({ userId: refreshTokens.userId });

  if (!revoked) {
    const [old] = await db.select({ userId: refreshTokens.userId, revokedAt: refreshTokens.revokedAt }).from(refreshTokens).where(eq(refreshTokens.tokenHash, hash)).limit(1);
    if (old?.revokedAt) await revokeAllForUser(old.userId); // reuse detection
    throw new HttpError(401, 'نشست منقضی شده است؛ دوباره وارد شوید');
  }
  return { userId: revoked.userId, refresh: await createRefreshToken(revoked.userId, userAgent) };
}

export async function revokeRefreshToken(token: string): Promise<void> {
  await getDb().update(refreshTokens).set({ revokedAt: new Date() }).where(and(eq(refreshTokens.tokenHash, sha256(token)), isNull(refreshTokens.revokedAt)));
}

export async function revokeAllForUser(userId: number): Promise<void> {
  await getDb().update(refreshTokens).set({ revokedAt: new Date() }).where(and(eq(refreshTokens.userId, userId), isNull(refreshTokens.revokedAt)));
}
