import { expandFlow } from '@/lib/lyrics/parse'
import { BLOCK_THEME } from '@/lib/lyrics/theme'
import type { SongContent } from '@/lib/lyrics/types'
import { FONT_MAX, FONT_MIN, fitFontSize, packPages, type FlowEntry } from './paginate'

export interface PerformSong {
  id: string
  title: string
  artist: string | null
  songKey: string | null
  content: SongContent
}

export interface PerformPage {
  songIndex: number
  songId: string
  title: string
  artist: string | null
  songKey: string | null
  /** 1-based page number within its song. */
  pageInSong: number
  pagesInSong: number
  fontSize: number
  entries: FlowEntry[]
}

export const BLOCK_GAP = 14

/** Flow entries with keys unique per position. */
export function entriesOf(content: SongContent): FlowEntry[] {
  return expandFlow(content.blocks, content.flow).map((e, index) => ({
    ...e,
    key: `${e.block.id}@${index}`,
  }))
}

/**
 * Measures every entry in one layout pass at the given font size.
 *
 * The measuring node must already be the exact width of a real page, and its
 * children must be styled identically to the rendered ones — otherwise the
 * packed heights lie and blocks overflow at performance time.
 */
export function measureAll(
  host: HTMLElement,
  entries: FlowEntry[],
  fontSize: number,
): Map<string, number> {
  host.style.fontSize = `${fontSize}px`
  host.replaceChildren(
    ...entries.map((entry) => {
      const wrapper = document.createElement('div')
      wrapper.dataset.key = entry.key

      const tab = document.createElement('div')
      tab.textContent = entry.block.label
      tab.style.cssText =
        'font-size:0.34em;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;' +
        'margin-bottom:0.18em;line-height:1.2;'

      const body = document.createElement('div')
      // textContent, never innerHTML: lyrics are user input.
      body.textContent = entry.block.lyrics
      body.style.cssText = 'white-space:pre-line;line-height:1.28;font-weight:600;'

      wrapper.append(tab, body)
      return wrapper
    }),
  )

  const heights = new Map<string, number>()
  for (const child of Array.from(host.children) as HTMLElement[]) {
    heights.set(child.dataset.key!, child.getBoundingClientRect().height)
  }
  return heights
}

/**
 * Lays out the whole setlist.
 *
 * Per song: find the biggest font size that keeps it on one page. If even the
 * minimum size needs more than one, let it run to as many pages as it needs at
 * a comfortable size — turning a page mid-song is fine, unreadable text is not.
 */
export function buildPages(
  songs: PerformSong[],
  host: HTMLElement,
  pageHeight: number,
  scale: number,
): PerformPage[] {
  const pages: PerformPage[] = []
  const min = Math.round(FONT_MIN * scale)
  const max = Math.round(FONT_MAX * scale)

  songs.forEach((song, songIndex) => {
    const entries = entriesOf(song.content)
    if (entries.length === 0) return

    const cache = new Map<number, Map<string, number>>()
    const measure = (entry: FlowEntry, fontSize: number) => {
      let level = cache.get(fontSize)
      if (!level) {
        level = measureAll(host, entries, fontSize)
        cache.set(fontSize, level)
      }
      return level.get(entry.key) ?? 0
    }

    // Try one page first; grow the target until the text stays readable.
    let fontSize = fitFontSize(entries, pageHeight, measure, BLOCK_GAP, 1, min, max)
    let target = 1
    while (fontSize <= min && target < 6) {
      target += 1
      fontSize = fitFontSize(entries, pageHeight, measure, BLOCK_GAP, target, min, max)
    }

    const packed = packPages(entries, fontSize, pageHeight, measure, BLOCK_GAP)
    packed.forEach((pageEntries, index) => {
      pages.push({
        songIndex,
        songId: song.id,
        title: song.title,
        artist: song.artist,
        songKey: song.songKey,
        pageInSong: index + 1,
        pagesInSong: packed.length,
        fontSize,
        entries: pageEntries,
      })
    })
  })

  return pages
}

export { BLOCK_THEME }
