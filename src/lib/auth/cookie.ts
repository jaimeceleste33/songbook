import 'server-only'
import { cookies } from 'next/headers'
import { SESSION_COOKIE, createSessionToken, sessionCookieOptions } from './session'

/**
 * Deliberately NOT in a 'use server' file: everything exported from one
 * becomes an endpoint the browser can call, and this one would let anyone
 * sign in as any user id.
 */
export async function startSession(userId: string, bandId: string): Promise<void> {
  const store = await cookies()
  store.set(SESSION_COOKIE, await createSessionToken({ userId, bandId }), sessionCookieOptions)
}
