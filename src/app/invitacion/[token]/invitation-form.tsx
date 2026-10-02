'use client'

import { useActionState } from 'react'
import { AccessError, accessCardClass, AccessField, AccessSubmit } from '@/components/access/access-shell'
import { PasswordField } from '@/components/access/password-field'
import { acceptInvitation, type AccessState } from '@/lib/actions/access'
import { MIN_PASSWORD_LENGTH } from '@/lib/auth/password-rules'

export function InvitationForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState<AccessState, FormData>(acceptInvitation, {})

  return (
    <form action={action} className={accessCardClass}>
      <input type="hidden" name="token" value={token} />
      <AccessField
        label="Tu nombre"
        name="name"
        autoComplete="name"
        autoFocus
        placeholder="Como te conoce la banda"
        defaultValue={state.name}
      />
      <AccessField
        label="Email"
        name="email"
        type="email"
        autoComplete="username"
        autoCapitalize="none"
        required
        placeholder="tu@email.com"
        defaultValue={state.email}
        hint="Es con lo que vas a entrar."
      />
      <PasswordField
        label="Contraseña"
        name="password"
        autoComplete="new-password"
        placeholder="Elegí una contraseña"
        required
        minLength={MIN_PASSWORD_LENGTH}
        hint={`Al menos ${MIN_PASSWORD_LENGTH} caracteres. Si ya tenés usuario, poné la de siempre.`}
      />
      <AccessError message={state.error} />
      <AccessSubmit pending={pending}>Crear mi usuario</AccessSubmit>
    </form>
  )
}
