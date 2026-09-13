import type { SongBlock } from '@/lib/lyrics/types'

export interface FlowEntry {
  block: SongBlock
  occurrence: number
  /** Index inside the expanded flow. Unique per entry, unlike block.id. */
  key: string
}

export const FONT_MIN = 16
export const FONT_MAX = 96

/**
 * Packs blocks into pages, cutting only between blocks — a verse is never
 * split across a page turn.
 *
 * `measure(entry, fontSize)` must return the rendered height in px.
 * A single block taller than the page still gets its own page: better one
 * overflowing page than an infinite loop.
 */
export function packPages(
  entries: FlowEntry[],
  fontSize: number,
  pageHeight: number,
  measure: (entry: FlowEntry, fontSize: number) => number,
  gap: number,
): FlowEntry[][] {
  const pages: FlowEntry[][] = []
  let current: FlowEntry[] = []
  let used = 0

  for (const entry of entries) {
    const height = measure(entry, fontSize)
    const needed = current.length === 0 ? height : used + gap + height

    if (current.length > 0 && needed > pageHeight) {
      pages.push(current)
      current = [entry]
      used = height
    } else {
      current.push(entry)
      used = needed
    }
  }

  if (current.length > 0) pages.push(current)
  return pages.length > 0 ? pages : [[]]
}

/**
 * Largest font size that still fits the song in `targetPages` pages.
 *
 * Binary search over integer sizes. Line wrapping changes with font size, so
 * every candidate is measured for real instead of scaled arithmetically.
 */
export function fitFontSize(
  entries: FlowEntry[],
  pageHeight: number,
  measure: (entry: FlowEntry, fontSize: number) => number,
  gap: number,
  targetPages: number,
  min = FONT_MIN,
  max = FONT_MAX,
): number {
  let lo = min
  let hi = max
  let best = min

  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2)
    const pages = packPages(entries, mid, pageHeight, measure, gap)
    if (pages.length <= targetPages) {
      best = mid
      lo = mid + 1
    } else {
      hi = mid - 1
    }
  }
  return best
}
