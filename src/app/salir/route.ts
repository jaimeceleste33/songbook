import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { SESSION_COOKIE } from '@/lib/auth/session'

/**
 * Clears a session that is still signed but no longer good — its owner was
 * taken out of the band. Pages cannot delete cookies while rendering, so
 * `requireMember()` redirects here instead.
 */
export async function GET() {
  const store = await cookies()
  store.delete(SESSION_COOKIE)
  redirect('/login')
}
