/**
 * Hands out the links nobody inside the app can: the first admin of a band,
 * a brand-new band, or a new password for an admin locked out of their own.
 *
 *   pnpm admin:link --url https://songbook.example.com
 *       Admin invitation for the only band (the one the migration created).
 *   pnpm admin:link --url … --new-band "Nombre de la banda"
 *       Creates a band and returns its admin invitation.
 *   pnpm admin:link --url … --reset persona@example.com
 *       New-password link for an existing user.
 *
 * Runs against DATABASE_URL like `pnpm db:migrate`. Prints the link and
 * nothing else secret: only the token's hash is stored.
 */
import { parseArgs } from 'node:util'
import { config } from 'dotenv'
import { Pool } from 'pg'
import { requireDatabaseUrl } from '../src/lib/db/url.ts'
import {
  INVITATION_TTL_MS,
  PASSWORD_RESET_TTL_MS,
  hashToken,
  newToken,
} from '../src/lib/auth/tokens.ts'

config({ path: ['.env.local', '.env'], quiet: true })

const { values } = parseArgs({
  options: {
    url: { type: 'string' },
    'new-band': { type: 'string' },
    reset: { type: 'string' },
  },
})

if (!values.url) {
  console.error('Pass the app address: --url https://your-app.vercel.app')
  process.exit(1)
}
const base = values.url.replace(/\/+$/, '')

let url: string
try {
  url = requireDatabaseUrl()
} catch (error) {
  console.error((error as Error).message)
  process.exit(1)
}
const isLocalDb = /localhost|127\.0\.0\.1/.test(url)
const pool = new Pool({
  connectionString: url,
  max: 1,
  ssl: isLocalDb ? false : { rejectUnauthorized: true },
})

async function bandForInvite(): Promise<{ id: string; name: string }> {
  const name = values['new-band']?.trim()
  if (name) {
    const { rows } = await pool.query(
      'insert into bands (name) values ($1) returning id, name',
      [name],
    )
    return rows[0]
  }
  const { rows } = await pool.query('select id, name from bands order by created_at')
  if (rows.length !== 1) {
    throw new Error(
      `Expected exactly one band, found ${rows.length}. Use --new-band to create one.`,
    )
  }
  return rows[0]
}

try {
  const token = newToken()
  if (values.reset) {
    const { rows } = await pool.query('select id, name from users where email = $1', [
      values.reset.trim().toLowerCase(),
    ])
    if (rows.length === 0) throw new Error(`No user with email ${values.reset}`)
    await pool.query(
      'insert into password_resets (user_id, token_hash, expires_at) values ($1, $2, $3)',
      [rows[0].id, hashToken(token), new Date(Date.now() + PASSWORD_RESET_TTL_MS)],
    )
    console.log(`New-password link for ${rows[0].name} (valid 2 days, single use):`)
    console.log(`${base}/nueva-clave/${token}`)
  } else {
    const band = await bandForInvite()
    await pool.query(
      `insert into invitations (band_id, role, token_hash, expires_at) values ($1, 'admin', $2, $3)`,
      [band.id, hashToken(token), new Date(Date.now() + INVITATION_TTL_MS)],
    )
    console.log(`Admin invitation for "${band.name}" (valid 7 days, single use):`)
    console.log(`${base}/invitacion/${token}`)
  }
} catch (error) {
  console.error((error as Error).message)
  process.exitCode = 1
} finally {
  await pool.end()
}
