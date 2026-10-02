'use client'

import { useState } from 'react'

/**
 * A password input with a "Ver" toggle: on the iPad keyboard a typo is easy
 * and invisible, and there is no other way to check what was typed.
 */
export function PasswordField({
  label,
  hint,
  ...input
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> & { label: string; hint?: string }) {
  const [visible, setVisible] = useState(false)

  return (
    <label className="mb-4 block">
      <span className="mb-2 block text-sm font-medium">{label}</span>
      <span className="relative block">
        <input
          {...input}
          type={visible ? 'text' : 'password'}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          className="w-full rounded-xl border border-border bg-surface-2 py-3 pl-4 pr-20 text-base outline-none focus:border-brand"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-pressed={visible}
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          className="absolute inset-y-1.5 right-1.5 rounded-lg px-3 text-sm font-medium text-muted transition hover:bg-surface hover:text-text"
        >
          {visible ? 'Ocultar' : 'Ver'}
        </button>
      </span>
      {hint ? <span className="mt-1 block text-xs text-muted">{hint}</span> : null}
    </label>
  )
}
