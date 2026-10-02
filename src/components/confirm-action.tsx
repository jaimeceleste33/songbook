'use client'

import { useRef } from 'react'
import { useFormStatus } from 'react-dom'

/**
 * A button that asks before it acts. The form only exists inside the dialog,
 * so a stray tap on the trigger can never submit anything by itself, and
 * "Cancelar" takes the focus so an accidental Enter backs out.
 */
export function ConfirmAction({
  action,
  fields,
  label,
  title,
  children,
  confirmLabel,
  triggerClassName,
}: {
  action: (formData: FormData) => void | Promise<void>
  fields: Record<string, string>
  label: React.ReactNode
  title: string
  children: React.ReactNode
  confirmLabel: string
  triggerClassName?: string
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className={
          triggerClassName ??
          'rounded-xl border border-border px-3 py-2.5 text-sm text-muted transition hover:border-red-500/50 hover:text-red-400'
        }
      >
        {label}
      </button>
      <dialog
        ref={dialogRef}
        className="m-auto w-[min(92vw,26rem)] rounded-2xl border border-border bg-surface p-5 text-text shadow-xl backdrop:bg-black/60"
      >
        <h2 className="text-lg font-semibold">{title}</h2>
        <div className="mt-2 space-y-2 text-sm leading-relaxed text-muted">{children}</div>
        <form action={action} className="mt-5 flex justify-end gap-2">
          {Object.entries(fields).map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} />
          ))}
          <button
            type="button"
            autoFocus
            onClick={() => dialogRef.current?.close()}
            className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium"
          >
            Cancelar
          </button>
          <ConfirmButton>{confirmLabel}</ConfirmButton>
        </form>
      </dialog>
    </>
  )
}

function ConfirmButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl bg-red-500/90 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
    >
      {pending ? 'Un momento…' : children}
    </button>
  )
}
