'use client'

import { useState } from 'react'
import { accessInputClass } from './access-shell'

/**
 * A password input with an eye toggle: on the iPad keyboard a typo is easy
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
          className={`${accessInputClass} pr-14`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-pressed={visible}
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          title={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          className="absolute inset-y-0 right-1 my-auto flex size-11 items-center justify-center rounded-lg text-muted transition hover:text-text active:scale-90"
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </span>
      {hint ? <span className="mt-1.5 block text-xs text-muted">{hint}</span> : null}
    </label>
  )
}

const iconProps = {
  viewBox: '0 0 24 24',
  className: 'size-5',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const

function EyeIcon() {
  return (
    <svg {...iconProps}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg {...iconProps}>
      <path d="M10.6 5.1A10.4 10.4 0 0 1 12 5c6.5 0 10 7 10 7a17.6 17.6 0 0 1-2.4 3.4M6.6 6.6C3.7 8.4 2 12 2 12s3.5 7 10 7c1.9 0 3.6-.6 5-1.5" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
      <path d="m2 2 20 20" />
    </svg>
  )
}
