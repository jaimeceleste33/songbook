import { config } from 'dotenv'
import { defineConfig } from 'drizzle-kit'

// Next reads .env.local automatically; drizzle-kit does not, so load it here.
config({ path: ['.env.local', '.env'], quiet: true })

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set. Copy .env.example to .env.local first.')
}

export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL },
  strict: true,
  verbose: true,
})
