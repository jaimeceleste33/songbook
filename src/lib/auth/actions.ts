'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { SESSION_COOKIE, createSessionToken, sessionCookieOptions } from './session'

/** Constant-time compare so a wrong password can't be found byte by byte. */
function safeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder()
  const left = enc.encode(a)
  const right = enc.encode(b)
  // Comparing lengths directly would leak length; fold it into the result.
  let diff = left.length ^ right.length
  const max = Math.max(left.length, right.length)
  for (let i = 0; i < max; i++) {
    diff |= (left[i] ?? 0) ^ (right[i] ?? 0)
  }
  return diff === 0
}

export type LoginState = { error?: string }

export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const expected = process.env.SONGBOOK_PASSWORD
  if (!expected) {
    return { error: 'La app no tiene contraseña configurada. Revisá SONGBOOK_PASSWORD.' }
  }

  const submitted = String(formData.get('password') ?? '')
  if (!safeEqual(submitted, expected)) {
    return { error: 'Contraseña incorrecta.' }
  }

  const store = await cookies()
  store.set(SESSION_COOKIE, await createSessionToken(), sessionCookieOptions)
  redirect('/')
}

export async function logout(): Promise<void> {
  const store = await cookies()
  store.delete(SESSION_COOKIE)
  redirect('/login')
}
