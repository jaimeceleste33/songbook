import { SignJWT, jwtVerify } from 'jose'

export const SESSION_COOKIE = 'songbook_session'
const ISSUER = 'songbook'
/** Long-lived on purpose: the singer should not be logged out mid-service. */
const MAX_AGE_SECONDS = 60 * 60 * 24 * 180

/**
 * Who is signed in and which band they are looking at. The role is NOT in the
 * token: it is read from the database on every request, so an admin's change
 * takes effect immediately instead of when a six-month cookie expires.
 */
export type SessionClaims = { userId: string; bandId: string }

function secret(): Uint8Array {
  const value = process.env.SESSION_SECRET
  if (!value || value.length < 16) {
    throw new Error(
      'SESSION_SECRET is missing or too short. Generate one with: openssl rand -base64 32',
    )
  }
  return new TextEncoder().encode(value)
}

export async function createSessionToken({ userId, bandId }: SessionClaims): Promise<string> {
  return new SignJWT({ band: bandId })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuer(ISSUER)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(secret())
}

/**
 * Null for a missing, expired or tampered token — and for tokens from the
 * single-password version, which carry no user. Those simply log in again.
 */
export async function verifySessionToken(
  token: string | undefined,
): Promise<SessionClaims | null> {
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, secret(), { issuer: ISSUER })
    if (typeof payload.sub !== 'string' || typeof payload.band !== 'string') return null
    return { userId: payload.sub, bandId: payload.band }
  } catch {
    return null
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: MAX_AGE_SECONDS,
} as const
