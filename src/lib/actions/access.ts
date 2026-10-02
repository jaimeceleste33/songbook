'use server'

import { redirect } from 'next/navigation'
import { startSession } from '@/lib/auth/cookie'
import { MIN_PASSWORD_LENGTH, hashPassword, verifyPassword } from '@/lib/auth/password'
import * as accounts from '@/lib/db/accounts'

/*
 * The two actions reachable without a session. Each is only as good as the
 * token in the link, which is checked and used up inside one transaction.
 */

export type AccessState = { error?: string; name?: string; email?: string }

const EXPIRED = 'Este link ya se usó o venció. Pedile uno nuevo a quien administra la banda.'

export async function acceptInvitation(
  _prev: AccessState,
  formData: FormData,
): Promise<AccessState> {
  const token = String(formData.get('token') ?? '')
  const name = String(formData.get('name') ?? '').trim()
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const echo = { name, email }

  if (!(await accounts.findOpenInvitation(token))) return { error: EXPIRED, ...echo }
  if (!email.includes('@')) return { error: 'Revisá el email.', ...echo }

  const existing = await accounts.findUserByEmail(email)
  let result: { userId: string; bandId: string } | null

  if (existing) {
    // Already has an account (another band, or a second link): prove it is theirs.
    if (!(await verifyPassword(password, existing.passwordHash))) {
      return {
        error: 'Ese email ya tiene cuenta. Poné la contraseña que usás para entrar.',
        ...echo,
      }
    }
    result = await accounts.acceptInvitation(token, { kind: 'existing', userId: existing.id })
  } else {
    if (!name) return { error: 'Poné tu nombre.', ...echo }
    if (password.length < MIN_PASSWORD_LENGTH) {
      return { error: `La contraseña tiene que tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`, ...echo }
    }
    result = await accounts.acceptInvitation(token, {
      kind: 'new',
      name: name.slice(0, 80),
      email,
      passwordHash: await hashPassword(password),
    })
  }

  if (!result) return { error: EXPIRED, ...echo }
  await startSession(result.userId, result.bandId)
  redirect('/')
}

export async function setNewPassword(
  _prev: AccessState,
  formData: FormData,
): Promise<AccessState> {
  const token = String(formData.get('token') ?? '')
  const password = String(formData.get('password') ?? '')
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { error: `La contraseña tiene que tener al menos ${MIN_PASSWORD_LENGTH} caracteres.` }
  }

  const userId = await accounts.usePasswordReset(token, await hashPassword(password))
  if (!userId) return { error: EXPIRED }

  const bandId = await accounts.firstBandOf(userId)
  if (!bandId) redirect('/login')
  await startSession(userId, bandId)
  redirect('/')
}
