import 'server-only'
import { cache } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getMembership } from '@/lib/db/accounts'
import type { Role } from '@/lib/db/schema'
import { can, type Permission } from './permissions'
import { SESSION_COOKIE, verifySessionToken } from './session'

export type Member = {
  userId: string
  name: string
  email: string
  /** Their own choice, whatever band they are singing with. */
  showChords: boolean
  bandId: string
  bandName: string
  role: Role
}

/**
 * Who is asking, read fresh from the database once per request. Null when
 * there is no valid session or the person is no longer in that band.
 */
export const getMember = cache(async (): Promise<Member | null> => {
  const store = await cookies()
  const claims = await verifySessionToken(store.get(SESSION_COOKIE)?.value)
  if (!claims) return null
  return getMembership(claims.userId, claims.bandId)
})

/**
 * Guard for pages and server actions. The proxy already blocks unauthenticated
 * navigation, but server actions bypass it, so every mutation calls this too.
 *
 * A valid cookie for someone taken out of the band goes through `/salir`,
 * which clears it: sending them to `/login` with the cookie still set would
 * bounce straight back here, since the proxy only checks the signature.
 */
export async function requireMember(): Promise<Member> {
  const member = await getMember()
  if (!member) redirect('/salir')
  return member
}

/**
 * For server actions. The matching button is already hidden from roles that
 * lack the permission, so reaching the throw means a hand-made request.
 */
export async function requirePermission(permission: Permission): Promise<Member> {
  const member = await requireMember()
  if (!can(member.role, permission)) {
    throw new Error(`Forbidden: ${member.role} lacks ${permission}`)
  }
  return member
}

/** For pages: a role without the permission is sent home instead. */
export async function requirePagePermission(permission: Permission): Promise<Member> {
  const member = await requireMember()
  if (!can(member.role, permission)) redirect('/')
  return member
}
