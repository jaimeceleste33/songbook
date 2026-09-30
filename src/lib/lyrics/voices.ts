import { SINGER_COLORS } from './theme'
import type { SongBlock, VoiceRange } from './types'

/**
 * Who sings which lines.
 *
 * In the textarea a line that is only `{Name}` hands the lines below it to
 * that singer, until `{}`, another `{Name}` or the end of the part. Put it
 * right under the part name and the whole part is theirs. Nothing marked means
 * the lead sings it — only the exceptions are written down.
 *
 * `{Todas}` or `{Mili y Cele}` need no special case: a name is free text.
 */
const VOICE_MARKER = /^\s*\{\s*([^{}]*?)\s*\}\s*$/

/** Longer than this is lyrics that happen to sit in braces, not a name. */
const MAX_NAME = 40

/**
 * What this line does to the current voice: a name opens one, null closes it,
 * undefined means the line is not a marker at all. `{}`, `{/}` and `{/Mili}`
 * all close, so any closing habit the singer brings works.
 */
export function matchVoiceMarker(line: string): string | null | undefined {
  const match = line.match(VOICE_MARKER)
  if (!match) return undefined
  const name = match[1]
  if (name === '' || name.startsWith('/')) return null
  if (name.length > MAX_NAME) return undefined
  return name.replace(/\s+/g, ' ')
}

/** Case- and accent-insensitive, so "mili" and "Milí" are the same person. */
export function singerKey(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

/** One line of a part as the parser sees it: its text and who sings it. */
export interface VoicedLine {
  text: string
  singer: string | null
}

/**
 * Collapses tagged lines into ranges. Blank lines between two lines of the
 * same singer stay inside the range; a range never starts or ends on one.
 */
export function rangesOf(lines: VoicedLine[]): VoiceRange[] {
  const ranges: VoiceRange[] = []
  lines.forEach((line, i) => {
    if (line.singer === null || line.text.trim() === '') return
    const last = ranges[ranges.length - 1]
    const onlyBlanksBetween =
      last !== undefined && lines.slice(last.to, i).every((l) => l.text.trim() === '')
    if (last && onlyBlanksBetween && singerKey(last.singer) === singerKey(line.singer)) {
      last.to = i + 1
    } else {
      ranges.push({ singer: line.singer, from: i, to: i + 1 })
    }
  })
  return ranges
}

/** Two parts are the same only if the same people sing the same lines. */
export function sameVoices(a: VoiceRange[] = [], b: VoiceRange[] = []): boolean {
  if (a.length !== b.length) return false
  return a.every(
    (r, i) =>
      r.from === b[i].from && r.to === b[i].to && singerKey(r.singer) === singerKey(b[i].singer),
  )
}

/**
 * The content arrives as JSON from the browser. Keep only ranges that fit the
 * lyrics, in order and without overlap, so a bad payload can never break the
 * stage.
 */
export function sanitiseVoices(block: SongBlock): VoiceRange[] | undefined {
  if (!Array.isArray(block.voices)) return undefined
  const lineCount = block.lyrics.split('\n').length
  const clean: VoiceRange[] = []
  let cursor = 0
  for (const r of block.voices) {
    const singer = typeof r?.singer === 'string' ? r.singer.trim().slice(0, MAX_NAME) : ''
    if (!singer || !Number.isInteger(r.from) || !Number.isInteger(r.to)) continue
    if (r.from < cursor || r.to <= r.from || r.to > lineCount) continue
    clean.push({ singer, from: r.from, to: r.to })
    cursor = r.to
  }
  return clean.length > 0 ? clean : undefined
}

/** The part's lyrics with its markers written back in, for the textarea. */
export function voicedText(block: SongBlock): string {
  const voices = block.voices ?? []
  if (voices.length === 0) return block.lyrics

  const lines = block.lyrics.split('\n')
  const out: string[] = []
  lines.forEach((line, i) => {
    const opens = voices.find((r) => r.from === i)
    if (opens) out.push(`{${opens.singer}}`)
    out.push(line)
    const closes = voices.some((r) => r.to === i + 1)
    const isLast = i === lines.length - 1
    // The end of the part closes a voice on its own; say it only mid-part.
    if (closes && !isLast && !voices.some((r) => r.from === i + 1)) out.push('{}')
  })
  return out.join('\n')
}

/** Every singer named in these parts, first spelling wins. */
export function singersIn(blocks: SongBlock[]): string[] {
  const byKey = new Map<string, string>()
  for (const block of blocks) {
    for (const r of block.voices ?? []) {
      const key = singerKey(r.singer)
      if (!byKey.has(key)) byKey.set(key, r.singer)
    }
  }
  return [...byKey.values()]
}

/** Adds the new names to the roster, keeping everyone's place — and colour. */
export function mergeSingers(roster: string[], names: string[]): string[] {
  const known = new Set(roster.map(singerKey))
  const added = names.filter((n) => {
    const key = singerKey(n)
    if (known.has(key)) return false
    known.add(key)
    return true
  })
  return [...roster, ...added]
}

/**
 * A singer's colour is her place in the roster, so Mili is the same colour in
 * every song. A name the roster has not seen yet (a song still being edited)
 * falls back to a hash: stable, just not guaranteed distinct.
 */
export function singerColor(name: string, roster: string[]): string {
  const key = singerKey(name)
  let index = roster.findIndex((n) => singerKey(n) === key)
  if (index < 0) {
    index = 0
    for (const ch of key) index = (index * 31 + ch.charCodeAt(0)) >>> 0
  }
  return SINGER_COLORS[index % SINGER_COLORS.length]
}

/** A stretch of a part to draw: either the lead's lines or someone else's. */
export interface LyricSegment {
  text: string
  singer: string | null
  /** A blank line separated this from the previous stretch. */
  gapBefore: boolean
}

/**
 * Splits a part into stretches for drawing. Blank lines at the seams become
 * `gapBefore` instead of text, so a voiced box never opens or closes on an
 * empty line and the spacing still matches what the singer typed.
 */
export function lyricSegments(block: SongBlock): LyricSegment[] {
  const voices = block.voices ?? []
  if (voices.length === 0) return [{ text: block.lyrics, singer: null, gapBefore: false }]

  const lines = block.lyrics.split('\n')
  const segments: LyricSegment[] = []
  let pendingGap = false

  const emit = (from: number, to: number, singer: string | null) => {
    let start = from
    let end = to
    while (start < end && lines[start].trim() === '') {
      start++
      if (segments.length > 0) pendingGap = true
    }
    let trailingGap = false
    while (end > start && lines[end - 1].trim() === '') {
      end--
      trailingGap = true
    }
    if (start < end) {
      segments.push({ text: lines.slice(start, end).join('\n'), singer, gapBefore: pendingGap })
      pendingGap = false
    }
    if (trailingGap) pendingGap = true
  }

  let cursor = 0
  for (const r of voices) {
    if (r.from < cursor || r.to > lines.length) continue
    emit(cursor, r.from, null)
    emit(r.from, r.to, r.singer)
    cursor = r.to
  }
  emit(cursor, lines.length, null)
  return segments
}
