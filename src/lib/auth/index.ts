import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { SESSION_COOKIE, verifySessionToken } from './session'

/** True when the request carries a valid session cookie. */
export async function isAuthenticated(): Promise<boolean> {
  const store = await cookies()
  return verifySessionToken(store.get(SESSION_COOKIE)?.value)
}

/**
 * Guard for pages and server actions. The proxy already blocks unauthenticated
 * navigation, but server actions bypass it, so every mutation calls this too.
 */
export async function requireAuth(): Promise<void> {
  if (!(await isAuthenticated())) redirect('/login')
}
