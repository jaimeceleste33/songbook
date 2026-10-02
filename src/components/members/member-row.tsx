'use client'

import { useActionState } from 'react'
import { ConfirmAction } from '@/components/confirm-action'
import { changeRole, createPasswordReset, removeMember, type LinkState } from '@/lib/actions/members'
import { ROLE_LABEL } from '@/lib/auth/permissions'
import { ROLES, type Role } from '@/lib/auth/roles'
import { ShareLink } from './share-link'

export function MemberRow({
  member,
  isSelf,
  isLastAdmin,
}: {
  member: { userId: string; name: string; email: string; role: Role }
  isSelf: boolean
  /** The only admin can be neither demoted nor removed. */
  isLastAdmin: boolean
}) {
  const [reset, resetAction, resetPending] = useActionState<LinkState, FormData>(
    createPasswordReset,
    {},
  )

  return (
    <li className="px-4 py-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">
            {member.name}
            {isSelf ? <span className="ml-1 text-xs text-muted">(vos)</span> : null}
          </p>
          <p className="truncate text-xs text-muted">{member.email}</p>
        </div>

        {isLastAdmin ? (
          <span className="rounded-lg bg-surface-2 px-3 py-2 text-sm">{ROLE_LABEL.admin}</span>
        ) : (
          <form action={changeRole}>
            <input type="hidden" name="userId" value={member.userId} />
            <select
              name="role"
              defaultValue={member.role}
              aria-label={`Rol de ${member.name}`}
              onChange={(e) => e.currentTarget.form?.requestSubmit()}
              className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm"
            >
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABEL[role]}
                </option>
              ))}
            </select>
          </form>
        )}

        <form action={resetAction}>
          <input type="hidden" name="userId" value={member.userId} />
          <button
            type="submit"
            disabled={resetPending}
            className="rounded-lg border border-border px-3 py-2 text-sm text-muted hover:text-text disabled:opacity-60"
          >
            Nueva contraseña
          </button>
        </form>

        {!isLastAdmin && !isSelf ? (
          <ConfirmAction
            action={removeMember}
            fields={{ userId: member.userId }}
            label="Quitar"
            title={`¿Quitar a ${member.name} de la banda?`}
            confirmLabel="Quitar"
            triggerClassName="rounded-lg border border-border px-3 py-2 text-sm text-muted transition hover:border-red-500/50 hover:text-red-400"
          >
            <p>Deja de poder entrar. Las canciones y repertorios no se tocan.</p>
            <p>Si fue un error, mandale una invitación nueva.</p>
          </ConfirmAction>
        ) : null}
      </div>
      {reset.error ? <p role="alert" className="mt-2 text-sm text-red-400">{reset.error}</p> : null}
      {reset.link ? (
        <ShareLink
          link={reset.link}
          message="Con este link elegís una contraseña nueva para Songbook:"
        />
      ) : null}
    </li>
  )
}
