'use client'

import { useActionState, useState } from 'react'
import { createSetlist, type SetlistFormState } from '@/lib/actions/setlists'

export function NewSetlistForm() {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState<SetlistFormState, FormData>(
    createSetlist,
    {},
  )

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition active:scale-[0.99] sm:w-auto sm:px-6"
      >
        + Nuevo repertorio
      </button>
    )
  }

  return (
    <form action={action} className="rounded-2xl border border-border bg-surface p-4">
      <div className="grid gap-3 sm:grid-cols-[2fr_1fr_auto] sm:items-end">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Nombre</span>
          <input
            name="name"
            autoFocus
            required
            placeholder="Ej: Domingo por la mañana"
            className="w-full rounded-xl border border-border bg-surface-2 px-4 py-2.5 text-base outline-none focus:border-brand"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Fecha</span>
          <input
            name="serviceDate"
            type="date"
            className="w-full rounded-xl border border-border bg-surface-2 px-4 py-2.5 text-base outline-none focus:border-brand"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {pending ? 'Creando…' : 'Crear'}
        </button>
      </div>
      {state.error ? (
        <p role="alert" className="mt-2 text-sm text-red-400">
          {state.error}
        </p>
      ) : null}
    </form>
  )
}
