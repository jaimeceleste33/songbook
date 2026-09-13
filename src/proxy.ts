import { NextResponse, type NextRequest } from 'next/server'
import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth/session'

/**
 * Next 16 calls this file `proxy.ts` (the former `middleware.ts`).
 * It gates navigation; server actions re-check with `requireAuth()`.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const ok = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value)

  if (pathname === '/login') {
    return ok ? NextResponse.redirect(new URL('/', request.url)) : NextResponse.next()
  }

  if (!ok) {
    const url = new URL('/login', request.url)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  // Everything except static assets, the icons and the offline manifest.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons|manifest.webmanifest|sw.js).*)'],
}
