/**
 * Resolves the Postgres connection string.
 *
 * Marketplace integrations own the variable they create and rotate its
 * credentials on their own schedule, so the app reads that variable directly.
 * Hand-copying the value into a second variable looks tidier and then breaks
 * silently the first time the provider rotates it.
 *
 * Order: an explicit DATABASE_URL wins (local development, or an operator
 * deliberately overriding), then the integration-managed names.
 */
const CANDIDATES = ['DATABASE_URL', 'STORAGE_URL', 'POSTGRES_URL'] as const

export function resolveDatabaseUrl(): string | undefined {
  for (const name of CANDIDATES) {
    const value = process.env[name]
    if (value && value.trim()) return value.trim()
  }
  return undefined
}

export function requireDatabaseUrl(): string {
  const url = resolveDatabaseUrl()
  if (!url) {
    throw new Error(
      `No database connection string found. Looked for: ${CANDIDATES.join(', ')}. ` +
        'In development copy .env.example to .env.local; in production add the ' +
        'database integration and redeploy.',
    )
  }
  return url
}

/** Neon hands out a pooled and a direct host; serverless must use the pooled one. */
export function isPooled(url: string): boolean {
  return /-pooler\./.test(url)
}
