'use client'

import { useActionState } from 'react'
import { createInvitation, type LinkState } from '@/lib/actions/members'
import { ROLE_DESCRIPTION, ROLE_LABEL } from '@/lib/auth/permissions'
import { ROLES } from '@/lib/auth/roles'
import { ShareLink } from './share-link'

export function InviteForm({ bandName }: { bandName: string }) {
  const [state, action, pending] = useActionState<LinkState, FormData>(createInvitation, {})

  return (
    <form action={action} className="rounded-2xl border border-border bg-surface p-4">
      <p className="mb-3 font-medium">Sumar a alguien</p>
      <fieldset className="space-y-2">
        <legend className="mb-1 text-sm text-muted">¿Qué va a poder hacer?</legend>
        {ROLES.map((role) => (
          <label key={role} className="flex cursor-pointer items-start gap-3 rounded-xl border border-border px-3 py-2.5 has-[:checked]:border-brand">
            <input type="radio" name="role" value={role} defaultChecked={role === 'viewer'} className="mt-1" />
            <span>
              <span className="block text-sm font-medium">{ROLE_LABEL[role]}</span>
              <span className="block text-xs text-muted">{ROLE_DESCRIPTION[role]}</span>
            </span>
          </label>
        ))}
      </fieldset>
      <button
        type="submit"
        disabled={pending}
        className="mt-3 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {pending ? 'Creando…' : 'Crear link de invitación'}
      </button>
      {state.error ? <p role="alert" className="mt-2 text-sm text-red-400">{state.error}</p> : null}
      {state.link ? (
        <ShareLink
          link={state.link}
          message={`Te invito a ${bandName} en Songbook. Entrá acá para crear tu usuario:`}
        />
      ) : null}
    </form>
  )
}
