import Link from 'next/link'
import { AccessShell } from '@/components/access/access-shell'
import { ROLE_DESCRIPTION } from '@/lib/auth/permissions'
import { findOpenInvitation } from '@/lib/db/accounts'
import { InvitationForm } from './invitation-form'

export const metadata = { title: 'Invitación · Songbook' }
export const dynamic = 'force-dynamic'

export default async function InvitationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const invitation = await findOpenInvitation(token)

  if (!invitation) {
    return (
      <AccessShell title="Este link ya no sirve" subtitle="Se usó o venció.">
        <p className="text-center text-sm text-muted">
          Pedile uno nuevo a quien administra la banda. Si ya creaste tu usuario,{' '}
          <Link href="/login" className="text-brand underline">
            entrá acá
          </Link>
          .
        </p>
      </AccessShell>
    )
  }

  return (
    <AccessShell
      title={`Sumate a ${invitation.bandName}`}
      subtitle={ROLE_DESCRIPTION[invitation.role]}
    >
      <InvitationForm token={token} />
    </AccessShell>
  )
}
