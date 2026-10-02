import { AccessShell } from '@/components/access/access-shell'
import { LoginForm } from './login-form'

export const metadata = { title: 'Entrar · Songbook' }

export default function LoginPage() {
  return (
    <AccessShell title="Songbook" subtitle="Tus letras y repertorios, listos para cantar.">
      <LoginForm />
      <p className="mt-4 text-center text-xs text-muted">
        ¿No tenés usuario u olvidaste la contraseña? Pedile un link a quien administra tu banda.
      </p>
    </AccessShell>
  )
}
