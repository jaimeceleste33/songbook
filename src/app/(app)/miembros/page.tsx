import { ConfirmAction } from '@/components/confirm-action'
import { InviteForm } from '@/components/members/invite-form'
import { MemberRow } from '@/components/members/member-row'
import { renameBand, revokeInvitation } from '@/lib/actions/members'
import { requirePagePermission } from '@/lib/auth'
import { ROLE_LABEL } from '@/lib/auth/permissions'
import { listMembers, listPendingInvitations } from '@/lib/db/accounts'

export const metadata = { title: 'Miembros · Songbook' }
export const dynamic = 'force-dynamic'

const dateFormat = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'long' })

export default async function MembersPage() {
  const me = await requirePagePermission('band:manage')
  const [members, invitations] = await Promise.all([
    listMembers(me.bandId),
    listPendingInvitations(me.bandId),
  ])
  const admins = members.filter((m) => m.role === 'admin').length

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Miembros</h1>
        <p className="text-sm text-muted">Quién entra a la app y qué puede hacer cada persona.</p>
      </div>

      <form action={renameBand} className="flex flex-wrap items-end gap-2">
        <label className="block flex-1">
          <span className="mb-1.5 block text-sm font-medium">Nombre de la banda</span>
          <input
            name="name"
            defaultValue={me.bandName}
            required
            maxLength={80}
            className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-base outline-none focus:border-brand"
          />
        </label>
        <button type="submit" className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium">
          Guardar
        </button>
      </form>

      <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
        {members.map((member) => (
          <MemberRow
            key={member.userId}
            member={member}
            isSelf={member.userId === me.userId}
            isLastAdmin={member.role === 'admin' && admins <= 1}
          />
        ))}
      </ul>

      <InviteForm bandName={me.bandName} />

      {invitations.length > 0 ? (
        <section>
          <h2 className="mb-2 font-medium">Invitaciones sin usar</h2>
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
            {invitations.map((invitation) => (
              <li key={invitation.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                <span className="flex-1">
                  {ROLE_LABEL[invitation.role]} · vence el {dateFormat.format(invitation.expiresAt)}
                </span>
                <ConfirmAction
                  action={revokeInvitation}
                  fields={{ id: invitation.id }}
                  label="Anular"
                  title="¿Anular esta invitación?"
                  confirmLabel="Anular"
                  triggerClassName="rounded-lg border border-border px-3 py-1.5 text-sm text-muted hover:text-red-400"
                >
                  <p>El link deja de funcionar. Nadie más puede entrar con él.</p>
                </ConfirmAction>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}
