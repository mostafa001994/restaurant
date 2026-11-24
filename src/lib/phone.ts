export type Identifier = { type: 'phone' | 'email'; value: string };

const FA = '۰۱۲۳۴۵۶۷۸۹';
const AR = '٠١٢٣٤٥٦٧٨٩';

export function toLatinDigits(input: string): string {
  return input.replace(/[۰-۹٠-٩]/g, (c) => {
    const i = FA.indexOf(c);
    return String(i >= 0 ? i : AR.indexOf(c));
  });
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** شماره‌ی موبایل ایران را به 09xxxxxxxxx تبدیل می‌کند؛ ایمیل را lowercase می‌کند. */
export function parseIdentifier(raw: string): Identifier | null {
  const s = toLatinDigits(raw).trim();
  if (!s) return null;

  if (s.includes('@')) {
    const email = s.toLowerCase();
    return email.length <= 191 && EMAIL_RE.test(email) ? { type: 'email', value: email } : null;
  }

  let d = s.replace(/[\s\-()]/g, '');
  if (d.startsWith('+')) d = d.slice(1);
  if (!/^\d+$/.test(d)) return null;
  if (d.startsWith('0098')) d = d.slice(4);
  else if (d.startsWith('98')) d = d.slice(2);
  if (d.startsWith('9') && d.length === 10) d = `0${d}`;
  return /^09\d{9}$/.test(d) ? { type: 'phone', value: d } : null;
}
