import { AccessShell } from '@/components/access/access-shell'
import { findOpenPasswordReset } from '@/lib/db/accounts'
import { NewPasswordForm } from './new-password-form'

export const metadata = { title: 'Nueva contraseña · Songbook' }
export const dynamic = 'force-dynamic'

export default async function NewPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const reset = await findOpenPasswordReset(token)

  if (!reset) {
    return (
      <AccessShell title="Este link ya no sirve" subtitle="Se usó o venció.">
        <p className="text-center text-sm text-muted">
          Pedile uno nuevo a quien administra la banda.
        </p>
      </AccessShell>
    )
  }

  return (
    <AccessShell title={`Hola, ${reset.name}`} subtitle={`Elegí una contraseña nueva para ${reset.email}.`}>
      <NewPasswordForm token={token} />
    </AccessShell>
  )
}
