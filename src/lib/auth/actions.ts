'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { firstBandOf, findUserByEmail } from '@/lib/db/accounts'
import { startSession } from './cookie'
import { verifyPassword } from './password'
import { SESSION_COOKIE } from './session'

export type LoginState = { error?: string; email?: string }

const WRONG = 'Email o contraseña incorrectos.'

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  if (!email || !password) return { error: 'Completá email y contraseña.', email }

  // One message for both cases, so the form does not reveal who has an account.
  const user = await findUserByEmail(email)
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { error: WRONG, email }
  }

  const bandId = await firstBandOf(user.id)
  if (!bandId) {
    return { error: 'Tu usuario ya no está en ninguna banda. Pedile un link a quien la administra.', email }
  }

  await startSession(user.id, bandId)
  redirect('/')
}

export async function logout(): Promise<void> {
  const store = await cookies()
  store.delete(SESSION_COOKIE)
  redirect('/login')
}
