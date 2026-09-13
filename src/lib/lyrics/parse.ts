import type { BlockKind, ParseResult, ParseWarning, SongBlock } from './types'

/** A line that is only `[Something]` opens a new block. */
const HEADER = /^\s*\[\s*([^\]]+?)\s*\]\s*$/

/**
 * Label -> kind. Spanish first: the singer writes in Spanish.
 * Order matters — `prechorus` must beat `chorus`, which contains it.
 */
const KIND_RULES: ReadonlyArray<readonly [RegExp, BlockKind]> = [
  [/\b(pre[\s-]?coro|pre[\s-]?chorus|pre)\b/i, 'prechorus'],
  [/\b(coro|chorus|estribillo)\b/i, 'chorus'],
  [/\b(verso|verse|estrofa)\b/i, 'verse'],
  [/\b(puente|bridge)\b/i, 'bridge'],
  [/\b(intro|introducci[oó]n)\b/i, 'intro'],
  [/\b(final|outro|cierre)\b/i, 'outro'],
  [/\b(tag|repite|coda|remate)\b/i, 'tag'],
]

export function inferKind(label: string): BlockKind {
  for (const [pattern, kind] of KIND_RULES) {
    if (pattern.test(label)) return kind
  }
  return 'other'
}

/** Case- and accent-insensitive key so "CORO", "Coro" and "Còro" match. */
function labelKey(label: string): string {
  return label
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

/** Trailing spaces and blank-line runs shouldn't make two blocks differ. */
function normaliseLyrics(text: string): string {
  return text
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/**
 * Turn pasted lyrics into blocks + flow.
 *
 * Both paste styles work:
 *
 *   - Chorus written once   -> one block, flow follows the written order.
 *   - Chorus written thrice -> still ONE block; each repeat appends the same
 *                              id to the flow. That is the whole point.
 *
 * A repeated label whose text differs is NOT merged and NOT dropped: it
 * becomes its own block and we report a warning.
 */
export function parseLyrics(raw: string): ParseResult {
  const lines = raw.replace(/\r\n?/g, '\n').split('\n')

  const blocks: SongBlock[] = []
  const flow: string[] = []
  const warnings: ParseWarning[] = []
  /** labelKey -> blocks sharing that label, in creation order. */
  const byLabel = new Map<string, SongBlock[]>()

  let currentLabel: string | null = null
  let buffer: string[] = []
  let nextId = 1

  const flush = () => {
    const lyrics = normaliseLyrics(buffer.join('\n'))
    buffer = []

    // Text before the first [Header], if it's only blank space, is not a block.
    if (currentLabel === null && lyrics === '') return

    const label = currentLabel ?? 'Intro'
    const key = labelKey(label)
    const existing = byLabel.get(key) ?? []

    // An exact re-statement of a block we already have is a repetition.
    const same = existing.find((b) => b.lyrics === lyrics)
    if (same) {
      flow.push(same.id)
      return
    }

    // A bare `[Coro]` with no text under it is a reference to the real one.
    if (lyrics === '' && existing.length > 0) {
      flow.push(existing[0].id)
      return
    }

    let finalLabel = label
    if (existing.length > 0) {
      finalLabel = `${label} (${existing.length + 1})`
      warnings.push({
        kind: 'duplicate-label-different-text',
        label,
        createdLabel: finalLabel,
      })
    }

    const block: SongBlock = {
      id: `b${nextId++}`,
      label: finalLabel,
      kind: inferKind(label),
      lyrics,
    }
    blocks.push(block)
    byLabel.set(key, [...existing, block])
    flow.push(block.id)
  }

  for (const line of lines) {
    const header = line.match(HEADER)
    if (header) {
      flush()
      currentLabel = header[1]
    } else {
      buffer.push(line)
    }
  }
  flush()

  return { blocks, flow, warnings }
}

/** Blocks in singing order, ready to paginate. Skips dangling ids. */
export function expandFlow(
  blocks: SongBlock[],
  flow: string[],
): Array<{ block: SongBlock; occurrence: number }> {
  const index = new Map(blocks.map((b) => [b.id, b]))
  const seen = new Map<string, number>()
  const out: Array<{ block: SongBlock; occurrence: number }> = []

  for (const id of flow) {
    const block = index.get(id)
    if (!block) continue
    const occurrence = (seen.get(id) ?? 0) + 1
    seen.set(id, occurrence)
    out.push({ block, occurrence })
  }
  return out
}

/** Rebuild pasteable text from blocks + flow. Used by export and backup. */
export function serialiseSong(blocks: SongBlock[], flow: string[]): string {
  const emitted = new Set<string>()
  return expandFlow(blocks, flow)
    .map(({ block }) => {
      if (emitted.has(block.id)) return `[${block.label}]`
      emitted.add(block.id)
      return `[${block.label}]\n${block.lyrics}`
    })
    .join('\n\n')
}
