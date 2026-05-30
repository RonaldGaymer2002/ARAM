import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

export * from './schema';

function getDatabaseUrl() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is not set');
  }
  return url;
}

export function createDb() {
  return drizzle(neon(getDatabaseUrl()), { schema });
}

let cachedDb: ReturnType<typeof createDb> | null = null;

export function db() {
  if (!cachedDb) {
    cachedDb = createDb();
  }
  return cachedDb;
}
