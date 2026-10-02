import { Credit } from '@/components/credit'

/**
 * The page the login, invitation and new-password screens share: a soft
 * brand glow behind a logo that pops in, then the card and its fields
 * rising one after another (see `.welcome-*` in globals.css).
 */
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
    <main className="relative flex min-h-dvh flex-col overflow-hidden safe-pad">
      <div aria-hidden className="welcome-glow pointer-events-none absolute inset-x-0 top-0 h-[28rem]" />

      <div className="relative flex flex-1 items-center justify-center px-6 py-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <div className="welcome-note mx-auto mb-5 flex size-16 items-center justify-center rounded-[1.25rem] bg-gradient-to-br from-brand to-indigo-500 text-white shadow-lg shadow-brand/30">
              <NoteIcon />
            </div>
            <h1 className="welcome-step text-[1.7rem] font-semibold tracking-tight" style={{ '--step': 1 } as React.CSSProperties}>
              {title}
            </h1>
            <p className="welcome-step mt-1.5 text-sm text-muted" style={{ '--step': 2 } as React.CSSProperties}>
              {subtitle}
            </p>
          </div>
          <div className="welcome-step" style={{ '--step': 3 } as React.CSSProperties}>
            {children}
          </div>
        </div>
      </div>

      <Credit className="welcome-step relative pb-6" />
    </main>
  )
}

function NoteIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" fill="currentColor" />
      <circle cx="18" cy="16" r="3" fill="currentColor" />
    </svg>
  )
}

/** Shared by every input on these pages so they look and focus alike. */
export const accessInputClass =
  'w-full rounded-xl border border-border bg-surface-2/80 px-4 py-3 text-base outline-none transition placeholder:text-muted/50 focus:border-brand focus:ring-4 focus:ring-brand/20'

export const accessCardClass =
  'rounded-3xl border border-border/80 bg-surface/80 p-6 shadow-2xl shadow-black/40 backdrop-blur'

export function AccessField({
  label,
  hint,
  ...input
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  return (
    <label className="mb-4 block">
      <span className="mb-2 block text-sm font-medium">{label}</span>
      <input {...input} className={accessInputClass} />
      {hint ? <span className="mt-1.5 block text-xs text-muted">{hint}</span> : null}
    </label>
  )
}

export function AccessError({ message }: { message?: string }) {
  return message ? (
    <p role="alert" className="mb-4 rounded-xl bg-red-500/10 px-3 py-2.5 text-sm text-red-300">
      {message}
    </p>
  ) : null
}

export function AccessSubmit({ pending, children }: { pending: boolean; children: string }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand to-indigo-500 px-4 py-3.5 text-base font-semibold text-white shadow-lg shadow-brand/25 transition hover:brightness-110 active:scale-[0.98] disabled:opacity-70"
    >
      {pending ? (
        <>
          <span aria-hidden className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          Un momento…
        </>
      ) : (
        children
      )}
    </button>
  )
}
