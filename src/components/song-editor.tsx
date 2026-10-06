'use client'

import { useActionState, useEffect, useMemo, useRef, useState } from 'react'
import { saveSong, type SongFormState } from '@/lib/actions/songs'
import { inlineChords, matchHeader, parseLyrics } from '@/lib/lyrics/parse'
import { reconcileFlow, unusedBlocks } from '@/lib/lyrics/reconcile'
import { serialiseSong } from '@/lib/lyrics/parse'
import type { SongContent } from '@/lib/lyrics/types'
import { mergeSingers, singerColor, singersIn } from '@/lib/lyrics/voices'
import { ArrangementBuilder } from './arrangement-builder'
import { SongPreview } from './song-preview'

const PLACEHOLDER = `Verso 1
Escribí acá la primera estrofa,
un renglón por línea.

Coro
Y acá el coro, una sola vez.
Después lo repetís en el orden.

Verso 2
La segunda estrofa.`

/**
 * Wraps the lines under the selection (or the caret's line) in `{name}` … `{}`.
 * Part names at the top of the selection are skipped: a marker above a part
 * name would end at that name and mark nothing.
 */
function wrapInVoice(value: string, selStart: number, selEnd: number, name: string) {
  let start = value.lastIndexOf('\n', selStart - 1) + 1
  // A selection that ends right after a line break stops at the line above.
  const last = selEnd > selStart && value[selEnd - 1] === '\n' ? selEnd - 1 : selEnd
  const lineEnd = value.indexOf('\n', last)
  const end = lineEnd === -1 ? value.length : lineEnd

  while (start < end) {
    const next = value.indexOf('\n', start)
    const stop = next === -1 || next > end ? end : next
    if (matchHeader(value.slice(start, stop)) === null) break
    start = stop + 1
  }
  if (start >= end) return null

  const open = `{${name}}\n`
  const next = value.slice(0, start) + open + value.slice(start, end) + '\n{}' + value.slice(end)
  return { next, caret: end + open.length }
}

/**
 * What saving would take away from the song as it was opened, when it is
 * enough to ask first: a whole part gone, or under 70% of the text left.
 * Asking on every save would teach everyone to tap "Guardar igual" blind.
 */
function losses(before: SongContent, after: SongContent) {
  const length = (c: SongContent) => c.blocks.reduce((n, b) => n + b.lyrics.trim().length, 0)
  const labels = new Set(after.blocks.map((b) => b.label))
  const texts = new Set(after.blocks.map((b) => b.lyrics.trim()))
  // Renaming a part or rewording it is not losing it; both changing at once is.
  const parts = before.blocks
    .filter((b) => !labels.has(b.label) && !texts.has(b.lyrics.trim()))
    .map((b) => b.label)
  const was = length(before)
  const kept = was === 0 ? 1 : length(after) / was
  return parts.length > 0 || kept < 0.7 ? { parts, keptPercent: Math.round(kept * 100) } : null
}

export function SongEditor({
  song,
  singers,
}: {
  song?: {
    id: string
    title: string
    artist: string | null
    songKey: string | null
    tempo: number | null
    timeSignature: string | null
    content: SongContent
  }
  /** The saved roster: its order is every singer's colour. */
  singers: string[]
}) {
  const [state, action, pending] = useActionState<SongFormState, FormData>(saveSong, {})

  const formRef = useRef<HTMLFormElement>(null)
  const confirmRef = useRef<HTMLDialogElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
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

  const parsedNow = useMemo(() => parseLyrics(raw), [raw])
  const warnings = parsedNow.warnings
  const orphans = useMemo(
    () => unusedBlocks(content.blocks, content.flow),
    [content],
  )
  // Saved singers first, so their colours match the stage; new names after.
  const roster = useMemo(
    () => mergeSingers(singers, singersIn(content.blocks)),
    [singers, content.blocks],
  )

  const markVoice = (name: string) => {
    const el = textareaRef.current
    if (!el) return
    const result = wrapInVoice(el.value, el.selectionStart, el.selectionEnd, name)
    if (!result) return
    setRaw(result.next)
    requestAnimationFrame(() => el.setSelectionRange(result.caret, result.caret))
  }

  /**
   * A sheet pasted with chords above the lyrics is folded into chords inside
   * the lines right away, so what the textarea shows is what gets saved — and
   * marking a voice can never land between a chord line and its lyric.
   */
  const pasteWithChords = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pasted = e.clipboardData.getData('text/plain')
    const folded = inlineChords(pasted)
    if (folded === pasted.replace(/\r\n?/g, '\n')) return
    e.preventDefault()
    const el = e.currentTarget
    const next = el.value.slice(0, el.selectionStart) + folded + el.value.slice(el.selectionEnd)
    const caret = el.selectionStart + folded.length
    setRaw(next)
    requestAnimationFrame(() => el.setSelectionRange(caret, caret))
  }

  // Measured against the latest parse, not the debounced one, so text deleted
  // a moment before tapping save still counts.
  const pendingLoss = song
    ? losses(song.content, { blocks: parsedNow.blocks, flow: content.flow })
    : null

  const save = () => {
    if (pendingLoss) confirmRef.current?.showModal()
    else formRef.current?.requestSubmit()
  }

  return (
    <form ref={formRef} action={action} className="space-y-6">
      <input type="hidden" name="id" value={song?.id ?? ''} />
      <input type="hidden" name="content" value={JSON.stringify(content)} />

      <section className="grid grid-cols-3 gap-3 sm:grid-cols-[2fr_1.2fr_0.7fr_0.8fr_0.7fr]">
        <Field label="Título" name="title" defaultValue={song?.title ?? ''} required
               placeholder="Nombre de la canción" autoFocus={!song} className="col-span-3 sm:col-span-1" />
        <Field label="Autor o artista" name="artist" defaultValue={song?.artist ?? ''}
               placeholder="Opcional" className="col-span-3 sm:col-span-1" />
        <Field label="Tono" name="songKey" defaultValue={song?.songKey ?? ''}
               placeholder="Ej: G" />
        <Field label="Tempo (BPM)" name="tempo" defaultValue={song?.tempo?.toString() ?? ''}
               placeholder="Ej: 72" inputMode="numeric" />
        <Field label="Compás" name="timeSignature" defaultValue={song?.timeSignature ?? ''}
               placeholder="Ej: 4/4" />
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
            Poné <code className="text-text">Coro</code>,{' '}
            <code className="text-text">Verso 1</code>… en su propio renglón
          </p>
        </div>
        <VoiceBar roster={roster} onPick={markVoice} />
        <p className="mb-2 text-xs text-muted">
          ¿Con acordes? Pegala tal cual, con los acordes arriba de la letra, y se acomodan
          solos. O escribilos antes de la sílaba:{' '}
          <code className="text-text">Pues el [F#m]velo se ras[B]gó</code>
        </p>
        <textarea
          ref={textareaRef}
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          onPaste={pasteWithChords}
          rows={14}
          spellCheck={false}
          placeholder={PLACEHOLDER}
          className="w-full resize-y rounded-2xl border border-border bg-surface px-4 py-3 font-mono text-sm leading-relaxed outline-none focus:border-brand"
        />

        {warnings.length > 0 ? (
          <ul className="mt-2 space-y-1">
            {warnings.map((w, i) => (
              <li key={i} className="rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
                Escribiste <b>[{w.label}]</b> dos veces con texto o voces distintas. Guardamos la
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
          <SongPreview content={content} roster={roster} />
        </section>
      ) : null}

      {state.error ? (
        <p role="alert" className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {state.error}
        </p>
      ) : null}

      <div className="sticky bottom-0 -mx-4 border-t border-border bg-bg/90 px-4 py-3 backdrop-blur safe-pad">
        {/* Not type="submit": saving goes through `save` so a big loss is asked about first. */}
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="w-full rounded-xl bg-brand px-4 py-3 font-semibold text-white transition active:scale-[0.99] disabled:opacity-60 sm:w-auto sm:px-8"
        >
          {pending ? 'Guardando…' : song ? 'Guardar cambios' : 'Guardar canción'}
        </button>
      </div>

      <dialog
        ref={confirmRef}
        className="m-auto w-[min(92vw,26rem)] rounded-2xl border border-border bg-surface p-5 text-text shadow-xl backdrop:bg-black/60"
      >
        <h2 className="text-lg font-semibold">¿Guardar con menos letra?</h2>
        <div className="mt-2 space-y-2 text-sm leading-relaxed text-muted">
          {pendingLoss && pendingLoss.parts.length > 0 ? (
            <p>
              Se van estas partes: <b className="text-text">{pendingLoss.parts.join(', ')}</b>.
            </p>
          ) : null}
          {pendingLoss && pendingLoss.keptPercent < 70 ? (
            <p>
              Queda el <b className="text-text">{pendingLoss.keptPercent}%</b> de la letra que
              tenía.
            </p>
          ) : null}
          <p>Si no fue a propósito, tocá «Seguir editando» y salí sin guardar.</p>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            autoFocus
            onClick={() => confirmRef.current?.close()}
            className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium"
          >
            Seguir editando
          </button>
          <button
            type="button"
            onClick={() => {
              confirmRef.current?.close()
              formRef.current?.requestSubmit()
            }}
            className="rounded-xl bg-red-500/90 px-4 py-2.5 text-sm font-semibold text-white"
          >
            Guardar igual
          </button>
        </div>
      </dialog>
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
  inputMode,
  className,
}: {
  label: string
  name: string
  defaultValue: string
  placeholder?: string
  required?: boolean
  autoFocus?: boolean
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']
  className?: string
}) {
  return (
    <label className={`block ${className ?? ''}`}>
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      <input
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        autoFocus={autoFocus}
        inputMode={inputMode}
        className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-base outline-none focus:border-brand"
      />
    </label>
  )
}

/**
 * One tap per singer instead of typing braces: on the iPad keyboard `{` sits
 * two layers deep. What it writes is plain text the singer can read and fix.
 */
function VoiceBar({ roster, onPick }: { roster: string[]; onPick: (name: string) => void }) {
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState('')

  const addNew = () => {
    const name = draft.trim().replace(/[{}]/g, '')
    if (name) onPick(name)
    setDraft('')
    setAdding(false)
  }

  return (
    <div className="mb-2 rounded-2xl border border-border bg-surface-2 px-3 py-2.5">
      <p className="mb-2 text-xs text-muted">
        ¿Unas líneas las canta otra persona? Seleccionalas y tocá su nombre. Lo que no
        marques es tuyo.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {roster.map((name) => (
          <button
            key={name}
            type="button"
            // Keep the textarea's selection: the tap must not steal focus.
            onPointerDown={(e) => e.preventDefault()}
            onClick={() => onPick(name)}
            className="rounded-full px-3 py-1.5 text-sm font-semibold text-white transition active:scale-95"
            style={{ background: singerColor(name, roster) }}
          >
            {name}
          </button>
        ))}
        {adding ? (
          <span className="flex items-center gap-1.5">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addNew()
                } else if (e.key === 'Escape') {
                  setAdding(false)
                }
              }}
              autoFocus
              maxLength={40}
              placeholder="Nombre"
              className="w-32 rounded-full border border-border bg-surface px-3 py-1.5 text-sm outline-none focus:border-brand"
            />
            <button
              type="button"
              onClick={addNew}
              className="rounded-full bg-brand px-3 py-1.5 text-sm font-semibold text-white"
            >
              Marcar
            </button>
          </span>
        ) : (
          <button
            type="button"
            onPointerDown={(e) => e.preventDefault()}
            onClick={() => setAdding(true)}
            className="rounded-full border border-dashed border-border px-3 py-1.5 text-sm text-muted hover:text-text"
          >
            + Otra voz
          </button>
        )}
      </div>
    </div>
  )
}
