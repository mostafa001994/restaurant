import { boolean, index, integer, jsonb, numeric, pgTable, primaryKey, serial, text, time, timestamp, uniqueIndex, varchar } from 'drizzle-orm/pg-core';

const ts = (name: string) => timestamp(name, { withTimezone: true });

export const roles = pgTable('roles', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
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

// ───────────────────────── هسته‌ی مشتری ─────────────────────────
const money = (name: string) => numeric(name, { precision: 12, scale: 2 });
const coord = (name: string) => numeric(name, { precision: 10, scale: 7 });

export const restaurants = pgTable('restaurants', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 191 }).notNull(),
  description: text('description'),
  address: varchar('address', { length: 255 }).notNull(),
  latitude: coord('latitude'),
  longitude: coord('longitude'),
  logo: text('logo'),
  coverImage: text('cover_image'),
  openTime: time('open_time'),
  closeTime: time('close_time'),
  isOpen: boolean('is_open').notNull().default(true),
  status: varchar('status', { length: 20 }).notNull().default('active'), // active | inactive
  createdAt: ts('created_at').notNull().defaultNow(),
  updatedAt: ts('updated_at').notNull().defaultNow(),
});

// فقط یک جدول شعبه (جدول تکراری restaurant_branches در نسخه‌ی لاراول حذف شد)
export const branches = pgTable('branches', {
  id: serial('id').primaryKey(),
  restaurantId: integer('restaurant_id').notNull().references(() => restaurants.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 191 }).notNull(),
  address: varchar('address', { length: 255 }),
  phone: varchar('phone', { length: 30 }),
  latitude: coord('latitude'),
  longitude: coord('longitude'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: ts('created_at').notNull().defaultNow(),
  updatedAt: ts('updated_at').notNull().defaultNow(),
}, (t) => [index('branches_restaurant_idx').on(t.restaurantId)]);

export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  restaurantId: integer('restaurant_id').notNull().references(() => restaurants.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 191 }).notNull(),
  image: text('image'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: ts('created_at').notNull().defaultNow(),
  updatedAt: ts('updated_at').notNull().defaultNow(),
});

export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  categoryId: integer('category_id').notNull().references(() => categories.id, { onDelete: 'cascade' }),
  restaurantId: integer('restaurant_id').notNull().references(() => restaurants.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 191 }).notNull(),
  description: text('description'),
  price: money('price').notNull(),
  discountPrice: money('discount_price'), // درصد تخفیف (۰ تا ۱۰۰) مثل نسخه‌ی لاراول
  image: text('image'),
  isAvailable: boolean('is_available').notNull().default(true),
  stock: integer('stock'),
  preparationMinutes: integer('preparation_minutes').notNull().default(30),
  tags: jsonb('tags').$type<string[]>(),
  createdAt: ts('created_at').notNull().defaultNow(),
  updatedAt: ts('updated_at').notNull().defaultNow(),
}, (t) => [index('products_restaurant_idx').on(t.restaurantId)]);

export const productExtras = pgTable('product_extras', {
  id: serial('id').primaryKey(),
  productId: integer('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 191 }).notNull(),
  price: money('price').notNull().default('0'), // صفر = رایگان
  isActive: boolean('is_active').notNull().default(true),
  createdAt: ts('created_at').notNull().defaultNow(),
  updatedAt: ts('updated_at').notNull().defaultNow(),
}, (t) => [index('extras_product_idx').on(t.productId)]);

export const addresses = pgTable('addresses', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 50 }),
  fullName: varchar('full_name', { length: 100 }).notNull(),
  phone: varchar('phone', { length: 20 }).notNull(),
  province: varchar('province', { length: 100 }).notNull(),
  city: varchar('city', { length: 100 }).notNull(),
  postalCode: varchar('postal_code', { length: 20 }),
  addressLine: text('address_line').notNull(),
  plaque: varchar('plaque', { length: 20 }),
  lat: coord('lat'),
  lng: coord('lng'),
  isDefault: boolean('is_default').notNull().default(false),
  createdAt: ts('created_at').notNull().defaultNow(),
  updatedAt: ts('updated_at').notNull().defaultNow(),
}, (t) => [index('addresses_user_idx').on(t.userId)]);

export const ORDER_STATUSES = ['pending', 'accepted', 'preparing', 'ready_for_pickup', 'on_the_way', 'delivered', 'cancelled'] as const;

export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  guestToken: varchar('guest_token', { length: 100 }),
  restaurantId: integer('restaurant_id').notNull().references(() => restaurants.id, { onDelete: 'cascade' }),
  totalPrice: money('total_price').notNull(),
  deliveryFee: money('delivery_fee').notNull().default('0'),
  discount: money('discount').notNull().default('0'),
  finalPrice: money('final_price').notNull(),
  status: varchar('status', { length: 30 }).notNull().default('pending'),
  paymentStatus: varchar('payment_status', { length: 20 }).notNull().default('unpaid'), // unpaid | paid | refunded
  paymentMethod: varchar('payment_method', { length: 20 }).notNull().default('online'),
  paymentGateway: varchar('payment_gateway', { length: 50 }),
  deliveryAddress: varchar('delivery_address', { length: 500 }).notNull(),
  deliveryLat: coord('delivery_lat'),
  deliveryLng: coord('delivery_lng'),
  scheduledTime: ts('scheduled_time'),
  preparationMinutes: integer('preparation_minutes'),
  estimatedDeliveryAt: ts('estimated_delivery_at'),
  paidAt: ts('paid_at'),
  createdAt: ts('created_at').notNull().defaultNow(),
  updatedAt: ts('updated_at').notNull().defaultNow(),
}, (t) => [index('orders_user_idx').on(t.userId), index('orders_restaurant_idx').on(t.restaurantId)]);

export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  productId: integer('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  quantity: integer('quantity').notNull(),
  unitPrice: money('unit_price').notNull(),
  totalPrice: money('total_price').notNull(),
  selectedOptions: jsonb('selected_options').$type<{ extra_id: number; name: string; price: number; quantity: number }[]>(),
  createdAt: ts('created_at').notNull().defaultNow(),
  updatedAt: ts('updated_at').notNull().defaultNow(),
}, (t) => [index('order_items_order_idx').on(t.orderId)]);

export const reviews = pgTable('reviews', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  restaurantId: integer('restaurant_id').notNull().references(() => restaurants.id, { onDelete: 'cascade' }),
  productId: integer('product_id').references(() => products.id, { onDelete: 'cascade' }),
  orderId: integer('order_id').references(() => orders.id, { onDelete: 'set null' }),
  rating: integer('rating').notNull(),
  comment: text('comment'),
  images: jsonb('images').$type<string[]>(),
  isApproved: boolean('is_approved').notNull().default(false), // تایید ادمین
  createdAt: ts('created_at').notNull().defaultNow(),
  updatedAt: ts('updated_at').notNull().defaultNow(),
}, (t) => [uniqueIndex('reviews_user_product_uq').on(t.userId, t.productId)]);

// ───────────────────────── پرداخت ─────────────────────────
export const paymentGatewaySettings = pgTable('payment_gateway_settings', {
  id: serial('id').primaryKey(),
  key: varchar('key', { length: 30 }).notNull().unique(), // zarinpal | mellat
  name: varchar('name', { length: 100 }).notNull(),
  isEnabled: boolean('is_enabled').notNull().default(false),
  sandbox: boolean('sandbox').notNull().default(true),
  merchantId: varchar('merchant_id', { length: 255 }), // زرین‌پال
  terminalId: varchar('terminal_id', { length: 255 }), // ملت
  username: varchar('username', { length: 255 }), // ملت
  passwordEnc: text('password_enc'), // ملت؛ رمزنگاری‌شده (AES-256-GCM)
  extra: jsonb('extra'),
  createdAt: ts('created_at').notNull().defaultNow(),
  updatedAt: ts('updated_at').notNull().defaultNow(),
});

export const transactions = pgTable(
  'transactions',
  {
    id: serial('id').primaryKey(),
    orderId: integer('order_id').references(() => orders.id, { onDelete: 'set null' }),
    userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
    restaurantId: integer('restaurant_id').references(() => restaurants.id, { onDelete: 'set null' }),
    amount: money('amount').notNull(), // تومان
    currency: varchar('currency', { length: 3 }).notNull().default('IRT'),
    type: varchar('type', { length: 10 }).notNull().default('debit'), // debit | credit
    gateway: varchar('gateway', { length: 30 }),
    transactionId: varchar('transaction_id', { length: 191 }), // authority / RefId
    status: varchar('status', { length: 20 }).notNull().default('pending'), // pending | processing | success | failed | refunded
    meta: jsonb('meta'),
    createdAt: ts('created_at').notNull().defaultNow(),
    updatedAt: ts('updated_at').notNull().defaultNow(),
  },
  (t) => [index('transactions_order_idx').on(t.orderId), uniqueIndex('transactions_gateway_tx_uq').on(t.gateway, t.transactionId)],
);

// ───────────────────────── ادمین: مواد اولیه، نقش/دسترسی ─────────────────────────
export const ingredients = pgTable('ingredients', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 191 }).notNull(),
  createdAt: ts('created_at').notNull().defaultNow(),
  updatedAt: ts('updated_at').notNull().defaultNow(),
});

export const productIngredients = pgTable(
  'product_ingredients',
  {
    productId: integer('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
    ingredientId: integer('ingredient_id').notNull().references(() => ingredients.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.productId, t.ingredientId] })],
);

export const permissions = pgTable('permissions', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 191 }).notNull().unique(),
  slug: varchar('slug', { length: 191 }).notNull().unique(),
  label: varchar('label', { length: 191 }),
  createdAt: ts('created_at').notNull().defaultNow(),
  updatedAt: ts('updated_at').notNull().defaultNow(),
});

export const rolePermission = pgTable(
  'role_permission',
  {
    roleId: integer('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
    permissionId: integer('permission_id').notNull().references(() => permissions.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.roleId, t.permissionId] })],
);
