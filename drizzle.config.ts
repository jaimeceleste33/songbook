import { config } from 'dotenv'
import { defineConfig } from 'drizzle-kit'
import { requireDatabaseUrl } from './src/lib/db/url'

// Next reads .env.local automatically; drizzle-kit does not, so load it here.
config({ path: ['.env.local', '.env'], quiet: true })

export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url: requireDatabaseUrl() },
  strict: true,
  verbose: true,
})
