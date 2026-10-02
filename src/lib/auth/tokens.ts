import { createHash, randomBytes } from 'node:crypto'

/**
 * Tokens for invitation and password links. The raw token only ever lives in
 * the link; the database keeps its SHA-256, so reading the database does not
 * hand anyone a working link.
 *
 * No path aliases or `server-only` here: `scripts/admin-link.ts` imports this
 * file directly under Node's type stripping.
 */
export function newToken(): string {
  return randomBytes(32).toString('base64url')
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000
export const PASSWORD_RESET_TTL_MS = 2 * 24 * 60 * 60 * 1000
