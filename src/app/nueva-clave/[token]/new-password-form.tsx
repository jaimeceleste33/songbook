'use client'

import { useActionState } from 'react'
import { AccessError, AccessField, AccessSubmit } from '@/components/access/access-shell'
import { setNewPassword, type AccessState } from '@/lib/actions/access'
import { MIN_PASSWORD_LENGTH } from '@/lib/auth/password-rules'

export function NewPasswordForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState<AccessState, FormData>(setNewPassword, {})

  return (
    <form action={action} className="rounded-2xl border border-border bg-surface p-6">
      <input type="hidden" name="token" value={token} />
      <AccessField
        label="Contraseña nueva"
        name="password"
        type="password"
        autoComplete="new-password"
        autoFocus
        required
        minLength={MIN_PASSWORD_LENGTH}
        hint={`Al menos ${MIN_PASSWORD_LENGTH} caracteres.`}
      />
      <AccessError message={state.error} />
      <AccessSubmit pending={pending}>Guardar y entrar</AccessSubmit>
    </form>
  )
}
