'use client'

import { useState } from 'react'
import { finishOnboarding, skipOnboarding } from '@/lib/actions/onboarding'

const STEPS = [
  {
    icon: '🎵',
    title: 'Tu cancionero, siempre a mano',
    body: 'Cargás las letras una vez y quedan guardadas. Después armás el repertorio de cada servicio y el día que cantás vas pasando las hojas.',
  },
  {
    icon: '✍️',
    title: 'Cargar una canción',
    body: 'Pegás la letra con el nombre de cada parte en su renglón. El coro lo escribís una sola vez.',
    sample: true,
  },
  {
    icon: '🔁',
    title: 'Armás el orden',
    body: 'Después elegís en qué orden se canta tocando cada parte. Si el coro va tres veces, lo tocás tres veces — no hace falta escribirlo de nuevo.',
    flow: true,
  },
  {
    icon: '👆',
    title: 'El día que cantás',
    body: 'Abrís el repertorio y la letra ocupa toda la pantalla. La pantalla no se apaga sola mientras cantás.',
    gestures: true,
  },
] as const

export function OnboardingTour() {
  const [step, setStep] = useState(0)
  const isLast = step === STEPS.length - 1
  const current = STEPS[step]

  return (
    <div className="mx-auto max-w-lg py-4">
      <div className="mb-6 flex items-center gap-2">
        {STEPS.map((_, i) => (
          <span
            key={i}
            className={`h-1 flex-1 rounded-full transition ${
              i <= step ? 'bg-brand' : 'bg-surface-2'
            }`}
          />
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-surface p-6">
        <p className="text-4xl">{current.icon}</p>
        <h1 className="mt-3 text-xl font-semibold tracking-tight">{current.title}</h1>
        <p className="mt-2 text-muted">{current.body}</p>

        {'sample' in current && current.sample ? (
          <pre className="mt-4 overflow-x-auto rounded-xl bg-surface-2 p-4 text-xs leading-relaxed text-muted">
{`Verso 1
La primera estrofa, un renglón
por cada línea que cantás.

Coro
El coro, una sola vez.

Verso 2
La segunda estrofa.`}
          </pre>
        ) : null}

        {'flow' in current && current.flow ? (
          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl bg-surface-2 p-4 text-xs">
            {[
              ['Verso 1', '#2563eb'],
              ['Coro', '#dc2626'],
              ['Verso 2', '#2563eb'],
              ['Coro', '#dc2626'],
              ['Puente', '#059669'],
              ['Coro', '#dc2626'],
            ].map(([label, colour], i) => (
              <span
                key={i}
                className="flex items-center gap-1.5 rounded-lg bg-surface px-2.5 py-1.5"
              >
                <span className="size-2 rounded-full" style={{ background: colour }} />
                {label}
              </span>
            ))}
          </div>
        ) : null}

        {'gestures' in current && current.gestures ? (
          <div className="mt-4 overflow-hidden rounded-xl border border-border">
            <div className="grid grid-cols-[1fr_1.2fr_1fr] text-center text-xs">
              <div className="border-r border-border bg-surface-2 px-2 py-6">
                <p className="text-lg">←</p>
                <p className="mt-1 text-muted">Tocá acá para volver</p>
              </div>
              <div className="border-r border-border px-2 py-6">
                <p className="text-lg">☰</p>
                <p className="mt-1 text-muted">Tocá el centro para ver la lista</p>
              </div>
              <div className="bg-surface-2 px-2 py-6">
                <p className="text-lg">→</p>
                <p className="mt-1 text-muted">Tocá acá para seguir</p>
              </div>
            </div>
            <p className="border-t border-border px-3 py-2 text-center text-xs text-muted">
              También podés arrastrar el dedo como si dieras vuelta una hoja.
            </p>
          </div>
        ) : null}
      </div>

      <div className="mt-5 flex items-center gap-3">
        {step > 0 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            className="rounded-xl border border-border px-5 py-3 text-sm font-medium"
          >
            Atrás
          </button>
        ) : null}

        {!isLast ? (
          <button
            type="button"
            onClick={() => setStep((s) => s + 1)}
            className="flex-1 rounded-xl bg-brand px-5 py-3 font-semibold text-white"
          >
            Siguiente
          </button>
        ) : (
          <form action={finishOnboarding} className="flex-1">
            <input type="hidden" name="withDemo" value="yes" />
            <button
              type="submit"
              className="w-full rounded-xl bg-brand px-5 py-3 font-semibold text-white"
            >
              Empezar
            </button>
          </form>
        )}
      </div>

      <form action={skipOnboarding} className="mt-3 text-center">
        <button type="submit" className="text-sm text-muted underline hover:text-text">
          Saltar el recorrido
        </button>
      </form>

      {isLast ? (
        <p className="mt-3 text-center text-xs text-muted">
          Te dejamos una canción de ejemplo cargada para que pruebes. Podés borrarla
          cuando quieras.
        </p>
      ) : null}
    </div>
  )
}
