import { NextResponse, type NextRequest } from 'next/server'
import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth/session'

/** Reachable without a session: an invited person has no account yet. */
const PUBLIC_PREFIXES = ['/invitacion/', '/nueva-clave/']

/**
 * Next 16 calls this file `proxy.ts` (the former `middleware.ts`).
 * It gates navigation by the cookie's signature only; whether the person is
 * still in the band, and what their role allows, is checked by `requireMember()`
 * and `requirePermission()` against the database.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const ok = (await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value)) !== null

  if (pathname === '/login') {
    return ok ? NextResponse.redirect(new URL('/', request.url)) : NextResponse.next()
  }

  if (PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next()
  }

  if (!ok) {
    const url = new URL('/login', request.url)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  // Everything except static assets, the icon, the manifest and the worker.
  // These must stay reachable while logged out: the installed iPad app fetches
  // the icon and manifest before anyone has a session.
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|icon\\.svg|manifest\\.webmanifest|sw\\.js).*)',
  ],
}
