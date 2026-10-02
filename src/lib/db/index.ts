import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'
import { requireDatabaseUrl } from './url'

/**
 * node-postgres rather than a Neon-only driver: the same code path runs
 * against a local Postgres in development and against Neon in production
 * (Neon speaks the standard wire protocol on its `-pooler` endpoint).
 *
 * In production the connection string must be the POOLED one. Serverless
 * invocations are many and short-lived, and an unpooled endpoint runs out of
 * connections quickly. See ./url.ts for how the variable is resolved.
 *
 * The pool is built lazily on first query. Connecting at import time would
 * fail the Vercel build, which imports every page module before the database
 * integration may have been added — a missing variable should surface as a
 * clear runtime error, not an unexplained build crash.
 */
const globalForDb = globalThis as unknown as {
  songbookPool?: Pool
  songbookDb?: NodePgDatabase<typeof schema>
}

function connect(): NodePgDatabase<typeof schema> {
  const url = requireDatabaseUrl()

  const pool =
    globalForDb.songbookPool ??
    new Pool({
      connectionString: url,
      // Each instance keeps a couple of sockets; the pooler fans out.
      max: 3,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
      ssl: /localhost|127\.0\.0\.1/.test(url) ? false : { rejectUnauthorized: true },
    })

  // Kept on globalThis in every environment. In dev this survives hot reload;
  // in production it is what makes the pool a pool at all — without it every
  // property access below built a new one, and connections piled up until
  // Postgres refused new clients.
  globalForDb.songbookPool = pool

  // The server may close an idle connection (Neon does when it scales to
  // zero). node-postgres reports that as an 'error' event on the pool, and
  // with no listener it becomes an uncaught exception. The pool replaces the
  // client on the next query, so logging is all there is to do.
  if (pool.listenerCount('error') === 0) {
    pool.on('error', (error) => console.warn('Idle database connection closed:', error.message))
  }

  return drizzle(pool, { schema })
}

/** Proxy so `db.select()` connects on first use instead of at import. */
export const db = new Proxy({} as NodePgDatabase<typeof schema>, {
  get(_target, property, receiver) {
    const instance = (globalForDb.songbookDb ??= connect())
    return Reflect.get(instance, property, receiver)
  },
})

export { schema }
