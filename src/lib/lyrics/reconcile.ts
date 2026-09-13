import type { SongBlock, SongContent } from './types'

/** Case/accent-insensitive label key, mirrors the one in parse.ts. */
function key(label: string): string {
  return label
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * The textarea owns the text; the arrangement is separate state. When the
 * singer edits the lyrics we re-parse and must not throw away the order they
 * already built.
 *
 * Blocks are matched by label:
 *   - same label  -> the flow keeps pointing at it
 *   - deleted     -> its references drop out of the flow
 *   - brand new   -> appended once at the end, so it is visible
 */
export function reconcileFlow(
  previous: SongContent | null,
  parsed: SongContent,
): string[] {
  if (!previous || previous.flow.length === 0) return parsed.flow

  const oldById = new Map(previous.blocks.map((b) => [b.id, b]))
  const newByKey = new Map(parsed.blocks.map((b) => [key(b.label), b]))

  const remapped: string[] = []
  for (const oldId of previous.flow) {
    const oldBlock = oldById.get(oldId)
    if (!oldBlock) continue
    const match = newByKey.get(key(oldBlock.label))
    if (match) remapped.push(match.id)
  }

  const oldKeys = new Set(previous.blocks.map((b) => key(b.label)))
  const added = parsed.blocks.filter((b) => !oldKeys.has(key(b.label))).map((b) => b.id)

  const result = [...remapped, ...added]
  return result.length > 0 ? result : parsed.flow
}

/** Blocks the singer wrote but never placed in the order. Shown as a nudge. */
export function unusedBlocks(blocks: SongBlock[], flow: string[]): SongBlock[] {
  const used = new Set(flow)
  return blocks.filter((b) => !used.has(b.id))
}
