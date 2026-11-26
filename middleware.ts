// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  const protectedPaths = ['/profile', '/admin'];
  const isProtected = protectedPaths.some((path) => pathname.startsWith(path));

  // نکته: این میدلور فقط "وجود توکن" را چک می‌کند، نه نقش کاربر
  // (چون توکن Sanctum یک رشته‌ی opaque است، نه JWT قابل decode).
  // چک نقش ادمین باید سمت کلاینت/سرور با فراخوانی /api/profile انجام شود
  // (این کار در app/admin/layout.tsx انجام می‌شود).
  if (isProtected && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/profile/:path*', '/admin/:path*'],
};
