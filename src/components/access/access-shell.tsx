/** The centred card the login, invitation and new-password pages share. */
export function AccessShell({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <main className="flex min-h-dvh items-center justify-center p-6 safe-pad">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="welcome-note mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-brand/15 text-3xl">
            🎵
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-muted">{subtitle}</p>
        </div>
        <div className="welcome-rise">{children}</div>
      </div>
    </main>
  )
}

export function AccessField({
  label,
  hint,
  ...input
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  return (
    <label className="mb-4 block">
      <span className="mb-2 block text-sm font-medium">{label}</span>
      <input
        {...input}
        className="w-full rounded-xl border border-border bg-surface-2 px-4 py-3 text-base outline-none focus:border-brand"
      />
      {hint ? <span className="mt-1 block text-xs text-muted">{hint}</span> : null}
    </label>
  )
}

export function AccessError({ message }: { message?: string }) {
  return message ? (
    <p role="alert" className="mb-3 text-sm text-red-400">
      {message}
    </p>
  ) : null
}

export function AccessSubmit({ pending, children }: { pending: boolean; children: string }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl bg-brand px-4 py-3 text-base font-semibold text-white transition active:scale-[0.99] disabled:opacity-60"
    >
      {pending ? 'Un momento…' : children}
    </button>
  )
}
