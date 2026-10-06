import type { SongBlock, VoiceRange } from './types'

/**
 * Chords live INSIDE the lyric line, right before the syllable they fall on:
 *
 *   Pues el [F#m]velo [E]se ras[B]gó
 *
 * Never on a line of their own above the lyrics. A part's voices are line
 * numbers into its lyrics (`VoiceRange`), so a chord line would push every
 * marked line down by one and hand the wrong lines to the wrong singer.
 * Inline, a song with chords has exactly the lines it had without them.
 *
 * Pasting the usual "chords above the lyrics" sheet still works: the parser
 * folds each chord line into the lyric below it (see `mergeChordLine`).
 */

const ACCIDENTAL = '(?:#|b|♯|♭)'
const QUALITY = '(?:maj|min|dim|aug|sus|add|m|M|°|ø|\\+|-)'
const CHORD = new RegExp(
  `^(?:[A-G]${ACCIDENTAL}?` +
    `${QUALITY}?\\d{0,2}` +
    // Extensions and alterations: 7, maj7, b5, sus4, add9, #11.
    `(?:(?:maj|sus|add|${ACCIDENTAL}|\\+|-)\\d{1,2})*` +
    `(?:\\([^()]{1,10}\\))?` +
    // Slash chords: the bass note the bass player reads.
    `(?:\\/[A-G]${ACCIDENTAL}?)?` +
    `|N\\.?C\\.?)$`,
)

/** `[E]`, `[F#m7]`, `[E/G#]` inside a line. Anything else in brackets is text. */
const INLINE = /\[([^[\]\n]{1,16})\]/g

export function isChord(token: string): boolean {
  return CHORD.test(token)
}

export function hasChords(text: string): boolean {
  for (const match of text.matchAll(INLINE)) {
    if (isChord(match[1])) return true
  }
  return false
}

/**
 * A pasted line made only of chords: `   F#m    E     B`. Bar lines are
 * allowed between them. A single uppercase `A` or `E` alone on a line counts
 * too — as Spanish lyrics those would be lowercase.
 */
export function isChordLine(line: string): boolean {
  const tokens = line.trim().split(/\s+/).filter((t) => t !== '|')
  return tokens.length > 0 && tokens[0] !== '' && tokens.every(isChord)
}

/**
 * Folds a chord line into the lyric line under it, each chord landing at the
 * column it sat over. Pass `''` as the lyric for a chord line with no lyrics
 * under it (an intro, a turnaround): it becomes `[E]   [B]`.
 *
 * Works right to left so inserting one chord never moves the columns of the
 * ones still to place.
 */
export function mergeChordLine(chordLine: string, lyric: string): string {
  const chords = [...chordLine.matchAll(/\S+/g)]
    .filter((m) => isChord(m[0]))
    .map((m) => ({ col: m.index, chord: m[0] }))
  // Column counting needs one code unit per letter: "ó" composed, not o + accent.
  let out = lyric.normalize('NFC')
  const lyricOnly = lyric.trim() !== ''

  for (let k = chords.length - 1; k >= 0; k--) {
    let col = chords[k].col
    if (col > out.length) out = out.padEnd(col)
    // A chord over the gap just before a word belongs to that word: sites
    // indent the lyrics a space or two under the chord.
    if (lyricOnly && /\s/.test(out[col] ?? '')) {
      const next = out.slice(col).search(/\S/)
      if (next > 0 && next <= 2) col += next
    }
    out = `${out.slice(0, col)}[${chords[k].chord}]${out.slice(col)}`
  }
  return lyricOnly ? out.trimEnd() : out.trim()
}

/** The line without its chords. Brackets that are not chords stay. */
function stripLine(line: string): string {
  return line.replace(INLINE, (whole, inner: string) => (isChord(inner) ? '' : whole))
}

/**
 * The part as someone with chords turned off sees it — exactly the part as it
 * was before chords existed. Lines that were only chords go away, and the
 * voice ranges are renumbered so every singer keeps her own lines.
 */
export function withoutChords(block: SongBlock): SongBlock {
  if (!hasChords(block.lyrics)) return block

  const lines = block.lyrics.split('\n')
  /** newIndex[i] = how many lines survive before old line i. */
  const newIndex: number[] = []
  const kept: string[] = []
  lines.forEach((line, i) => {
    newIndex[i] = kept.length
    const stripped = stripLine(line)
    const wasOnlyChords = stripped.trim() === '' && line.trim() !== ''
    const blank = stripped.trim() === ''
    // Dropping a chord-only line must not leave two blank lines in a row.
    const extraBlank = blank && (kept.length === 0 || kept[kept.length - 1].trim() === '')
    if (wasOnlyChords || extraBlank) return
    kept.push(stripped.trimEnd())
  })
  newIndex[lines.length] = kept.length
  while (kept.length > 0 && kept[kept.length - 1] === '') kept.pop()

  const voices: VoiceRange[] = []
  for (const r of block.voices ?? []) {
    const from = newIndex[r.from]
    const to = Math.min(newIndex[r.to], kept.length)
    if (to > from) voices.push({ singer: r.singer, from, to })
  }

  const { voices: _old, ...rest } = block
  return { ...rest, lyrics: kept.join('\n'), ...(voices.length > 0 ? { voices } : {}) }
}

/* ------------------------------ rendering ------------------------------- */

/** A syllable with the chord played on it, or plain text inside a word. */
export interface ChordPiece {
  chord: string | null
  text: string
}

/**
 * A word with at least one chord is one unbreakable run, so a line that wraps
 * never leaves a chord at the end of one row and its syllable on the next.
 */
export type LyricRun = { space: string } | { word: ChordPiece[] }

export type SheetLine =
  | { kind: 'blank' }
  /** A line with no chords: drawn exactly as before. */
  | { kind: 'text'; text: string }
  /** Only chords, no lyrics: an intro or a turnaround. */
  | { kind: 'chords'; chords: string[] }
  | { kind: 'lyric'; runs: LyricRun[] }

/** Splits a line into the text before the first chord and chord + syllables after. */
function piecesOf(line: string): ChordPiece[] {
  const pieces: ChordPiece[] = []
  let chord: string | null = null
  let last = 0
  for (const match of line.matchAll(INLINE)) {
    if (!isChord(match[1])) continue
    const text = line.slice(last, match.index)
    if (chord !== null || text !== '') pieces.push({ chord, text })
    chord = match[1]
    last = match.index + match[0].length
  }
  pieces.push({ chord, text: line.slice(last) })
  return pieces
}

function runsOf(pieces: ChordPiece[]): LyricRun[] {
  const runs: LyricRun[] = []
  let word: ChordPiece[] = []
  const endWord = () => {
    if (word.length > 0) runs.push({ word })
    word = []
  }
  for (const { chord, text } of pieces) {
    // Odd indices are the spaces between words.
    text.split(/(\s+)/).forEach((part, i) => {
      if (i % 2 === 1) {
        endWord()
        runs.push({ space: part })
      } else if (i === 0 ? chord !== null || part !== '' : part !== '') {
        word.push({ chord: i === 0 ? chord : null, text: part })
      }
    })
  }
  endWord()
  return runs
}

/** A stretch of lyrics, line by line, ready to draw with its chords. */
export function sheetLines(text: string): SheetLine[] {
  return text.split('\n').map((line): SheetLine => {
    if (line.trim() === '') return { kind: 'blank' }
    if (!hasChords(line)) return { kind: 'text', text: line }
    const pieces = piecesOf(line)
    if (pieces.every((p) => p.text.trim() === '')) {
      return { kind: 'chords', chords: pieces.flatMap((p) => (p.chord ? [p.chord] : [])) }
    }
    return { kind: 'lyric', runs: runsOf(pieces) }
  })
}
