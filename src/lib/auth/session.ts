import { SignJWT, jwtVerify } from 'jose'

export const SESSION_COOKIE = 'songbook_session'
const ISSUER = 'songbook'
/** Long-lived on purpose: the singer should not be logged out mid-service. */
const MAX_AGE_SECONDS = 60 * 60 * 24 * 180

function secret(): Uint8Array {
  const value = process.env.SESSION_SECRET
  if (!value || value.length < 16) {
    throw new Error(
      'SESSION_SECRET is missing or too short. Generate one with: openssl rand -base64 32',
    )
  }
  return new TextEncoder().encode(value)
}

export async function createSessionToken(): Promise<string> {
  return new SignJWT({ role: 'singer' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(ISSUER)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(secret())
}

export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  if (!token) return false
  try {
    await jwtVerify(token, secret(), { issuer: ISSUER })
    return true
  } catch {
    return false
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: MAX_AGE_SECONDS,
} as const
