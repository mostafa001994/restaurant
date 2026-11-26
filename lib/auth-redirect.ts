// مقصد بعد از ورود: ?redirect= (فقط مسیر داخلی) یا بر اساس نقش
export function afterLoginPath(redirect: string | null, isAdmin?: boolean): string {
  if (redirect && redirect.startsWith('/') && !redirect.startsWith('//') && !redirect.includes('\\')) return redirect;
  return isAdmin ? '/admin' : '/profile';
}
