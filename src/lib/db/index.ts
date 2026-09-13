import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

const url = process.env.DATABASE_URL

if (!url) {
  throw new Error(
    'DATABASE_URL is not set. Copy .env.example to .env.local and fill it in, ' +
      'or run `vercel env pull .env.local` once the database is connected.',
  )
}

/**
 * node-postgres rather than a Neon-only driver: the same code path runs
 * against a local Postgres in development and against Neon in production
 * (Neon speaks the standard wire protocol on its `-pooler` endpoint).
 *
 * In production always point DATABASE_URL at the POOLED connection string.
 * Serverless invocations are many and short-lived, and an unpooled endpoint
 * runs out of connections quickly.
 */
const globalForDb = globalThis as unknown as { songbookPool?: Pool }

const pool =
  globalForDb.songbookPool ??
  new Pool({
    connectionString: url,
    // Each serverless instance keeps a couple of sockets; the pooler fans out.
    max: 3,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    ssl: /localhost|127\.0\.0\.1/.test(url) ? false : { rejectUnauthorized: true },
  })

// Survive hot reload in dev, which would otherwise leak a pool per edit.
if (process.env.NODE_ENV !== 'production') globalForDb.songbookPool = pool

export const db = drizzle(pool, { schema })
export { schema }
