'use client'

import { useActionState } from 'react'
import { AccessError, AccessField, AccessSubmit } from '@/components/access/access-shell'
import { login, type LoginState } from '@/lib/auth/actions'

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {})

  return (
    <form action={action} className="rounded-2xl border border-border bg-surface p-6">
      <AccessField
        label="Email"
        name="email"
        type="email"
        autoComplete="username"
        autoCapitalize="none"
        autoFocus
        required
        defaultValue={state.email}
      />
      <AccessField
        label="Contraseña"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        placeholder="••••••••"
      />
      <AccessError message={state.error} />
      <AccessSubmit pending={pending}>Entrar</AccessSubmit>
    </form>
  )
}
