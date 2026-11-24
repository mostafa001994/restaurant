import { index, integer, pgTable, serial, text, timestamp, varchar } from 'drizzle-orm/pg-core';

const ts = (name: string) => timestamp(name, { withTimezone: true });

export const roles = pgTable('roles', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  label: varchar('label', { length: 100 }),
});

// هر کاربر دقیقاً یک نقش دارد (role_id مستقیم) — همان معماری نهایی نسخه‌ی لاراول
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 191 }),
  email: varchar('email', { length: 191 }).unique(),
  phone: varchar('phone', { length: 20 }).unique(),
  passwordHash: text('password_hash'),
  roleId: integer('role_id')
    .notNull()
    .references(() => roles.id),
  avatar: text('avatar'),
  emailVerifiedAt: ts('email_verified_at'),
  phoneVerifiedAt: ts('phone_verified_at'),
  failedLogins: integer('failed_logins').notNull().default(0),
  lockedUntil: ts('locked_until'),
  lastLoginAt: ts('last_login_at'),
  createdAt: ts('created_at').notNull().defaultNow(),
  updatedAt: ts('updated_at').notNull().defaultNow(),
});

// کد یکبارمصرف: فقط HMAC کد ذخیره می‌شود، نه خود کد
export const otpCodes = pgTable(
  'otp_codes',
  {
    id: serial('id').primaryKey(),
    identifier: varchar('identifier', { length: 191 }).notNull(),
    purpose: varchar('purpose', { length: 20 }).notNull(), // auth | reset
    codeHash: varchar('code_hash', { length: 128 }).notNull(),
    payload: text('payload'), // داده‌ی ثبت‌نامِ در انتظار تایید (نام + هش رمز)؛ فقط پس از تایید کد اعمال می‌شود
    attempts: integer('attempts').notNull().default(0),
    expiresAt: ts('expires_at').notNull(),
    consumedAt: ts('consumed_at'),
    createdAt: ts('created_at').notNull().defaultNow(),
  },
  (t) => [index('otp_identifier_purpose_idx').on(t.identifier, t.purpose)],
);

// refresh token مبهم؛ فقط SHA-256 آن ذخیره می‌شود
export const refreshTokens = pgTable(
  'refresh_tokens',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: varchar('token_hash', { length: 64 }).notNull().unique(),
    userAgent: text('user_agent'),
    expiresAt: ts('expires_at').notNull(),
    revokedAt: ts('revoked_at'),
    createdAt: ts('created_at').notNull().defaultNow(),
  },
  (t) => [index('refresh_user_idx').on(t.userId)],
);

// rate limit پنجره‌ی ثابت، بدون نیاز به Redis
export const rateLimits = pgTable('rate_limits', {
  key: varchar('key', { length: 191 }).primaryKey(),
  count: integer('count').notNull(),
  resetAt: ts('reset_at').notNull(),
});
