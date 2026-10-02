'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { requirePermission } from '@/lib/auth'
import * as accounts from '@/lib/db/accounts'
import { ROLES, type Role } from '@/lib/auth/roles'

function parseRole(value: FormDataEntryValue | null): Role | null {
  return ROLES.find((role) => role === value) ?? null
}

/** The app's own address, as the browser reached it, for links sent by WhatsApp. */
async function origin(): Promise<string> {
  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host')
  const proto = h.get('x-forwarded-proto') ?? (host?.startsWith('localhost') ? 'http' : 'https')
  return `${proto}://${host}`
}

export type LinkState = { link?: string; error?: string }

export async function createInvitation(_prev: LinkState, formData: FormData): Promise<LinkState> {
  const { bandId, userId } = await requirePermission('band:manage')
  const role = parseRole(formData.get('role'))
  if (!role) return { error: 'Elegí qué va a poder hacer.' }
  const token = await accounts.createInvitation(bandId, role, userId)
  revalidatePath('/miembros')
  return { link: `${await origin()}/invitacion/${token}` }
}

export async function revokeInvitation(formData: FormData): Promise<void> {
  const { bandId } = await requirePermission('band:manage')
  const id = String(formData.get('id') ?? '')
  if (id) await accounts.revokeInvitation(bandId, id)
  revalidatePath('/miembros')
}

export async function createPasswordReset(_prev: LinkState, formData: FormData): Promise<LinkState> {
  const { bandId } = await requirePermission('band:manage')
  const token = await accounts.createPasswordReset(bandId, String(formData.get('userId') ?? ''))
  if (!token) return { error: 'Esa persona ya no está en la banda.' }
  return { link: `${await origin()}/nueva-clave/${token}` }
}

/*
 * Neither of these can leave the band without an admin: the page does not
 * offer it, and `accounts` refuses it again here.
 */

export async function changeRole(formData: FormData): Promise<void> {
  const { bandId } = await requirePermission('band:manage')
  const role = parseRole(formData.get('role'))
  const userId = String(formData.get('userId') ?? '')
  if (role && userId) await accounts.setMemberRole(bandId, userId, role)
  revalidatePath('/', 'layout')
}

export async function removeMember(formData: FormData): Promise<void> {
  const { bandId } = await requirePermission('band:manage')
  const userId = String(formData.get('userId') ?? '')
  if (userId) await accounts.removeMember(bandId, userId)
  revalidatePath('/', 'layout')
}

export async function renameBand(formData: FormData): Promise<void> {
  const { bandId } = await requirePermission('band:manage')
  const name = String(formData.get('name') ?? '').trim()
  if (name) await accounts.renameBand(bandId, name.slice(0, 80))
  revalidatePath('/', 'layout')
}
