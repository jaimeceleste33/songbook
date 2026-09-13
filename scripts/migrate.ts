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

config({ path: ['.env.local', '.env'], quiet: true })

const url = process.env.DATABASE_URL
if (!url) {
  console.error('DATABASE_URL is not set. Copy .env.example to .env.local first.')
  process.exit(1)
}

const isLocal = /localhost|127\.0\.0\.1/.test(url)
const pool = new Pool({
  connectionString: url,
  max: 1,
  ssl: isLocal ? false : { rejectUnauthorized: true },
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
