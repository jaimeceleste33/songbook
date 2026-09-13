'use client'

import { useActionState } from 'react'
import { login, type LoginState } from '@/lib/auth/actions'

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {})

  return (
    <form action={action} className="rounded-2xl border border-border bg-surface p-6">
      <label htmlFor="password" className="mb-2 block text-sm font-medium">
        Contraseña
      </label>
      <input
        id="password"
        name="password"
        type="password"
        autoComplete="current-password"
        autoFocus
        required
        className="w-full rounded-xl border border-border bg-surface-2 px-4 py-3 text-base outline-none focus:border-brand"
        placeholder="••••••••"
      />

      {state.error ? (
        <p role="alert" className="mt-3 text-sm text-red-400">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-4 w-full rounded-xl bg-brand px-4 py-3 text-base font-semibold text-white transition active:scale-[0.99] disabled:opacity-60"
      >
        {pending ? 'Entrando…' : 'Entrar'}
      </button>
    </form>
  )
}
