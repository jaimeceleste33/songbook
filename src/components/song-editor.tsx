'use client'

import { useActionState, useEffect, useMemo, useRef, useState } from 'react'
import { saveSong, type SongFormState } from '@/lib/actions/songs'
import { parseLyrics } from '@/lib/lyrics/parse'
import { reconcileFlow, unusedBlocks } from '@/lib/lyrics/reconcile'
import { serialiseSong } from '@/lib/lyrics/parse'
import { BLOCK_THEME } from '@/lib/lyrics/theme'
import type { SongContent } from '@/lib/lyrics/types'
import { ArrangementBuilder } from './arrangement-builder'

const PLACEHOLDER = `[Verso 1]
Escribí acá la primera estrofa,
un renglón por línea.

[Coro]
Y acá el coro, una sola vez.
Después lo repetís en el orden.

[Verso 2]
La segunda estrofa.`

export function SongEditor({
  song,
}: {
  song?: {
    id: string
    title: string
    artist: string | null
    songKey: string | null
    content: SongContent
  }
}) {
  const [state, action, pending] = useActionState<SongFormState, FormData>(saveSong, {})

  const [raw, setRaw] = useState(() =>
    song ? serialiseSong(song.content.blocks, song.content.flow) : '',
  )
  const [content, setContent] = useState<SongContent>(
    () => song?.content ?? { blocks: [], flow: [] },
  )

  // The textarea owns the text. Re-parse on a pause, keeping the built order.
  const contentRef = useRef(content)
  contentRef.current = content

  useEffect(() => {
    const timer = setTimeout(() => {
      const parsed = parseLyrics(raw)
      const flow = reconcileFlow(contentRef.current, parsed)
      setContent({ blocks: parsed.blocks, flow })
    }, 300)
    return () => clearTimeout(timer)
  }, [raw])

  const warnings = useMemo(() => parseLyrics(raw).warnings, [raw])
  const orphans = useMemo(
    () => unusedBlocks(content.blocks, content.flow),
    [content],
  )

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="id" value={song?.id ?? ''} />
      <input type="hidden" name="content" value={JSON.stringify(content)} />

      <section className="grid gap-3 sm:grid-cols-[2fr_1.2fr_0.7fr]">
        <Field label="Título" name="title" defaultValue={song?.title ?? ''} required
               placeholder="Nombre de la canción" autoFocus={!song} />
        <Field label="Autor o artista" name="artist" defaultValue={song?.artist ?? ''}
               placeholder="Opcional" />
        <Field label="Tono" name="songKey" defaultValue={song?.songKey ?? ''}
               placeholder="Ej: G" />
      </section>

      <section>
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <h2 className="font-medium">
            <span className="mr-2 rounded-md bg-surface-2 px-2 py-0.5 text-xs text-muted">
              Paso 1
            </span>
            Pegá la letra
          </h2>
          <p className="text-xs text-muted">
            Separá las partes con <code className="text-text">[Coro]</code>,{' '}
            <code className="text-text">[Verso 1]</code>…
          </p>
        </div>
        <textarea
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          rows={14}
          spellCheck={false}
          placeholder={PLACEHOLDER}
          className="w-full resize-y rounded-2xl border border-border bg-surface px-4 py-3 font-mono text-sm leading-relaxed outline-none focus:border-brand"
        />

        {warnings.length > 0 ? (
          <ul className="mt-2 space-y-1">
            {warnings.map((w, i) => (
              <li key={i} className="rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
                Escribiste <b>[{w.label}]</b> dos veces con texto distinto. Guardamos la
                segunda como <b>{w.createdLabel}</b> para no perderla — si fue un error,
                dejá las dos iguales y se unen solas.
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section>
        <h2 className="mb-2 font-medium">
          <span className="mr-2 rounded-md bg-surface-2 px-2 py-0.5 text-xs text-muted">
            Paso 2
          </span>
          Armá el orden
        </h2>
        <ArrangementBuilder
          blocks={content.blocks}
          flow={content.flow}
          onChange={(flow) => setContent((c) => ({ ...c, flow }))}
        />

        {orphans.length > 0 ? (
          <p className="mt-3 rounded-lg bg-surface-2 px-3 py-2 text-xs text-muted">
            Sin usar en el orden:{' '}
            {orphans.map((b) => b.label).join(', ')}.
          </p>
        ) : null}
      </section>

      {content.flow.length > 0 ? (
        <section>
          <h2 className="mb-2 font-medium">Vista previa</h2>
          <Preview content={content} />
        </section>
      ) : null}

      {state.error ? (
        <p role="alert" className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {state.error}
        </p>
      ) : null}

      <div className="sticky bottom-0 -mx-4 border-t border-border bg-bg/90 px-4 py-3 backdrop-blur safe-pad">
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-xl bg-brand px-4 py-3 font-semibold text-white transition active:scale-[0.99] disabled:opacity-60 sm:w-auto sm:px-8"
        >
          {pending ? 'Guardando…' : song ? 'Guardar cambios' : 'Guardar canción'}
        </button>
      </div>
    </form>
  )
}

function Field({
  label,
  name,
  defaultValue,
  placeholder,
  required,
  autoFocus,
}: {
  label: string
  name: string
  defaultValue: string
  placeholder?: string
  required?: boolean
  autoFocus?: boolean
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      <input
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        autoFocus={autoFocus}
        className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-base outline-none focus:border-brand"
      />
    </label>
  )
}

function Preview({ content }: { content: SongContent }) {
  const byId = new Map(content.blocks.map((b) => [b.id, b]))
  return (
    <div className="overflow-hidden rounded-2xl border border-border">
      {content.flow.map((id, index) => {
        const block = byId.get(id)
        if (!block) return null
        const theme = BLOCK_THEME[block.kind]
        return (
          <div key={`${id}@${index}`} className="flex border-b border-border last:border-0">
            <div
              className="flex w-9 shrink-0 items-center justify-center py-3 text-[10px] font-bold uppercase tracking-wide text-white"
              style={{ background: theme.tab, writingMode: 'vertical-rl', rotate: '180deg' }}
            >
              {block.label}
            </div>
            <p
              className="flex-1 whitespace-pre-line px-4 py-3 text-sm leading-relaxed"
              style={{ background: theme.accent }}
            >
              {block.lyrics}
            </p>
          </div>
        )
      })}
    </div>
  )
}
