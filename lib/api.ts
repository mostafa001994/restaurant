// lib/api.ts
// یک کلاینت axios واحد برای کل پروژه.
import axios, { type AxiosRequestConfig } from 'axios';
import { clearSession, getRefreshToken, getToken, saveSession } from './token';

const baseURL = `${process.env.NEXT_PUBLIC_API_URL}/api`;

export const api = axios.create({ baseURL, withCredentials: false });

// مسیرهایی که Authorization نمی‌گیرند (کاربر هنوز لاگین نکرده)
const PUBLIC_ROUTES = ['/send-otp', '/verify-otp', '/auth/login', '/auth/register', '/auth/refresh', '/auth/password'];
const isPublic = (url?: string) => PUBLIC_ROUTES.some((r) => url?.includes(r));

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token && !isPublic(config.url)) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// تمدید توکن: refresh token چرخشی است، پس هم‌زمان فقط «یک» درخواست refresh باید برود
// (دو درخواست موازی با یک توکن = تشخیص سرقت و باطل‌شدن همه‌ی نشست‌ها)
let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const rt = getRefreshToken();
  if (!rt) return null;
  try {
    const res = await axios.post(`${baseURL}/auth/refresh`, { refresh_token: rt });
    saveSession(res.data);
    return res.data.token ?? null;
  } catch {
    return null;
  }
}

type RetryConfig = AxiosRequestConfig & { _retry?: boolean };

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as RetryConfig | undefined;

    if (error.response?.status === 401 && original && !original._retry && !isPublic(original.url) && getRefreshToken()) {
      original._retry = true;
      refreshing ??= refreshAccessToken().finally(() => {
        refreshing = null;
      });
      const token = await refreshing;
      if (token) {
        original.headers = { ...(original.headers as object), Authorization: `Bearer ${token}` } as never;
        return api(original);
      }
    }

    if (error.response?.status === 401 && typeof window !== 'undefined') {
      const hadSession = !!getToken();
      clearSession();
      // مهمان (بدون توکن) در صفحات عمومی نباید به /login پرتاب شود؛ فقط وقتی نشست واقعاً منقضی شده
      const path = window.location.pathname;
      const protectedArea = path.startsWith('/profile') || path.startsWith('/admin');
      if (hadSession && protectedArea && !path.startsWith('/login')) {
        window.location.href = `/login?redirect=${encodeURIComponent(path)}`;
      }
    }
    return Promise.reject(error);
  },
);
