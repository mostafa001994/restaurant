// lib/token.ts
// منبع واحد برای ذخیره/خواندن توکن‌ها.
// access token (کوتاه‌عمر) و refresh token (چرخشی، بلندمدت) هر دو در کوکی؛ middleware.ts فقط وجود `token` را برای مسیرهای محافظت‌شده می‌بیند.
import Cookies from 'js-cookie';

const TOKEN_KEY = 'token';
const REFRESH_KEY = 'refresh_token';
const secure = process.env.NODE_ENV === 'production';

export function getToken(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  return Cookies.get(TOKEN_KEY);
}

export function setToken(token: string): void {
  // خودِ JWT زود منقضی می‌شود؛ کوکی طولانی می‌ماند تا middleware مسیر را ببندد و interceptor بتواند با refresh تمدید کند
  Cookies.set(TOKEN_KEY, token, { expires: 30, sameSite: 'lax', secure });
}

export function removeToken(): void {
  Cookies.remove(TOKEN_KEY);
}

export function getRefreshToken(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  return Cookies.get(REFRESH_KEY);
}

export function setRefreshToken(token: string): void {
  Cookies.set(REFRESH_KEY, token, { expires: 30, sameSite: 'lax', secure });
}

export function removeRefreshToken(): void {
  Cookies.remove(REFRESH_KEY);
}

/** پاسخ login / verify-otp / refresh را ذخیره می‌کند */
export function saveSession(data: { token?: string; refresh_token?: string }): void {
  if (data.token) setToken(data.token);
  if (data.refresh_token) setRefreshToken(data.refresh_token);
}

export function clearSession(): void {
  removeToken();
  removeRefreshToken();
}
