/**
 * Applies the versioned migrations in ./drizzle to DATABASE_URL.
 *
 * Run against local Postgres in development and once against the production
 * database on deploy: `pnpm db:migrate`.
 */
import { config } from 'dotenv'
import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { Pool } from 'pg'
import { requireDatabaseUrl, isPooled } from '../src/lib/db/url.ts'

config({ path: ['.env.local', '.env'], quiet: true })

let url: string
try {
  url = requireDatabaseUrl()
} catch (error) {
  console.error((error as Error).message)
  process.exit(1)
}

const isLocalDb = /localhost|127\.0\.0\.1/.test(url)
if (!isLocalDb && !isPooled(url)) {
  console.warn(
    'Warning: this connection string is not the pooled endpoint (-pooler). ' +
      'Migrations will still run, but the app should point at the pooled one.',
  )
}

const pool = new Pool({
  connectionString: url,
  max: 1,
  ssl: isLocalDb ? false : { rejectUnauthorized: true },
})

try {
  await migrate(drizzle(pool), { migrationsFolder: './drizzle' })
  console.log('Migrations applied.')
} catch (error) {
  console.error('Migration failed:', error)
  process.exitCode = 1
} finally {
  await pool.end()
}
