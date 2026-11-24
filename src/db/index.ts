import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { env } from '@/lib/env';
import * as schema from './schema';

// کانکشن lazy: در زمان build نیازی به DATABASE_URL نیست.
// درایور HTTP نئون برای serverless مناسب است (بدون connection pool و بدون سوکت دائمی).
let instance: ReturnType<typeof create> | undefined;

function create() {
  return drizzle(neon(env().DATABASE_URL), { schema });
}

export function getDb() {
  return (instance ??= create());
}

export * from './schema';
