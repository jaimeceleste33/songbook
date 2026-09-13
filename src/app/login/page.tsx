import { LoginForm } from './login-form'

export const metadata = { title: 'Entrar · Songbook' }

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center p-6 safe-pad">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-brand/15 text-3xl">
            🎵
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Songbook</h1>
          <p className="mt-1 text-sm text-muted">Tus letras y repertorios, listos para cantar.</p>
        </div>
        <LoginForm />
      </div>
    </main>
  )
}
