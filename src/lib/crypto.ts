import {
  createHash,
  createHmac,
  randomBytes,
  randomInt,
  scrypt as scryptCb,
  timingSafeEqual,
} from 'node:crypto';
import { env } from './env';

type ScryptOpts = { N: number; r: number; p: number; maxmem: number };
const SCRYPT: ScryptOpts = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
const KEYLEN = 64;

function scrypt(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    (scryptCb as unknown as (
      p: string,
      s: Buffer,
      k: number,
      o: ScryptOpts,
      cb: (e: Error | null, d: Buffer) => void,
    ) => void)(password, salt, KEYLEN, SCRYPT, (err, key) => (err ? reject(err) : resolve(key)));
  });
}

/** قالب: s1$salt$hash (base64url) */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scrypt(password.normalize('NFKC'), salt);
  return `s1$${salt.toString('base64url')}$${key.toString('base64url')}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [v, saltB64, hashB64] = stored.split('$');
  if (v !== 's1' || !saltB64 || !hashB64) return false;
  const expected = Buffer.from(hashB64, 'base64url');
  const actual = await scrypt(password.normalize('NFKC'), Buffer.from(saltB64, 'base64url'));
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

let dummy: Promise<string> | undefined;
/** برای یکسان‌سازی زمان پاسخ وقتی کاربر وجود ندارد (جلوگیری از user enumeration با timing) */
export function dummyVerify(password: string): Promise<boolean> {
  dummy ??= hashPassword('dummy-password-not-a-real-user');
  return dummy.then((h) => verifyPassword(password, h));
}

export function hmac(value: string): string {
  return createHmac('sha256', env().AUTH_SECRET).update(`otp:${value}`).digest('hex');
}

export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export function randomToken(bytes = 48): string {
  return randomBytes(bytes).toString('base64url');
}

export function generateOtp(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, '0');
}

export function safeEqualHex(a: string, b: string): boolean {
  const x = Buffer.from(a, 'hex');
  const y = Buffer.from(b, 'hex');
  return x.length === y.length && timingSafeEqual(x, y);
}
