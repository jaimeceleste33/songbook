import type { CSSProperties } from 'react'
import { withoutChords, type SheetLine } from '@/lib/lyrics/chords'
import { expandFlow } from '@/lib/lyrics/parse'
import { BLOCK_THEME } from '@/lib/lyrics/theme'
import type { SongContent } from '@/lib/lyrics/types'
import { FONT_MAX, FONT_MIN, fitFontSize, packPages, type FlowEntry } from './paginate'
import {
  BLOCK_GAP,
  applyStyle,
  blockStyles,
  chordStyles,
  segmentViews,
  type ChordStyles,
} from './sheet'

export interface PerformSong {
  id: string
  title: string
  artist: string | null
  songKey: string | null
  tempo: number | null
  timeSignature: string | null
  content: SongContent
}

export interface PerformPage {
  songIndex: number
  songId: string
  title: string
  artist: string | null
  songKey: string | null
  tempo: number | null
  timeSignature: string | null
  /** 1-based page number within its song. */
  pageInSong: number
  pagesInSong: number
  fontSize: number
  entries: FlowEntry[]
  /** The singer roster, in order: it decides each singer's colour. */
  singers: string[]
}

/**
 * Flow entries with keys unique per position. With chords off the parts are
 * stripped HERE, before anything is measured or drawn, so the page is exactly
 * the one there was before chords existed.
 */
export function entriesOf(content: SongContent, showChords: boolean): FlowEntry[] {
  const blocks = showChords ? content.blocks : content.blocks.map(withoutChords)
  return expandFlow(blocks, content.flow).map((e, index) => ({
    ...e,
    key: `${e.block.id}@${index}`,
  }))
}

const CHORDS = chordStyles()

/** `ChordLines` (components/chord-lines.tsx), built by hand for the ruler. */
function appendChordLines(parent: HTMLElement, lines: SheetLine[], styles: ChordStyles) {
  const el = (style: CSSProperties, text?: string) => {
    const node = document.createElement('span')
    applyStyle(node, style)
    if (text !== undefined) node.textContent = text
    return node
  }
  for (const line of lines) {
    const row = document.createElement('div')
    if (line.kind === 'blank') {
      applyStyle(row, styles.blank)
    } else if (line.kind === 'text') {
      applyStyle(row, styles.line)
      row.textContent = line.text
    } else if (line.kind === 'chords') {
      applyStyle(row, styles.chordRow)
      for (const chord of line.chords) row.append(el(styles.chordRowItem, chord))
    } else {
      applyStyle(row, styles.line)
      for (const run of line.runs) {
        if ('space' in run) {
          row.append(run.space)
        } else if (run.word.every((p) => p.chord === null)) {
          row.append(run.word.map((p) => p.text).join(''))
        } else {
          const word = el(styles.word)
          for (const piece of run.word) {
            if (piece.chord === null) {
              word.append(piece.text)
              continue
            }
            const anchor = el(styles.anchor)
            anchor.append(el(styles.chord, piece.chord), el(styles.syllable, piece.text || '\u00a0'))
            word.append(anchor)
          }
          row.append(word)
        }
      }
    }
    parent.append(row)
  }
}

/**
 * Measures every entry in one layout pass at the given font size.
 *
 * The measuring node must already be the exact width of a real page, and its
 * children must be styled identically to the rendered ones — otherwise the
 * packed heights lie and blocks overflow at performance time. That is why the
 * styles come from `sheet.ts`: `SongPage` renders the very same objects.
 */
export function measureAll(
  host: HTMLElement,
  entries: FlowEntry[],
  fontSize: number,
  singers: string[],
): Map<string, number> {
  host.style.fontSize = `${fontSize}px`
  host.replaceChildren(
    ...entries.map((entry) => {
      const styles = blockStyles(entry.block)

      const row = document.createElement('div')
      row.dataset.key = entry.key
      applyStyle(row, styles.row)

      const strip = document.createElement('div')
      applyStyle(strip, styles.strip)
      const label = document.createElement('div')
      applyStyle(label, styles.label)
      label.textContent = entry.block.label
      strip.append(label)

      const body = document.createElement('div')
      applyStyle(body, styles.body)
      // textContent, never innerHTML: lyrics and names are user input.
      for (const view of segmentViews(entry.block, singers)) {
        const box = document.createElement('div')
        applyStyle(box, view.box)
        if (view.singer !== null) {
          const tag = document.createElement('div')
          applyStyle(tag, view.tag)
          tag.textContent = view.singer
          box.append(tag)
        }
        const text = document.createElement('div')
        applyStyle(text, view.body)
        if (view.lines) appendChordLines(text, view.lines, CHORDS)
        else text.textContent = view.text
        box.append(text)
        body.append(box)
      }

      row.append(strip, body)
      return row
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
  singers: string[],
  showChords: boolean,
): PerformPage[] {
  const pages: PerformPage[] = []
  const min = Math.round(FONT_MIN * scale)
  const max = Math.round(FONT_MAX * scale)

  songs.forEach((song, songIndex) => {
    const entries = entriesOf(song.content, showChords)
    if (entries.length === 0) return

    const cache = new Map<number, Map<string, number>>()
    const measure = (entry: FlowEntry, fontSize: number) => {
      let level = cache.get(fontSize)
      if (!level) {
        level = measureAll(host, entries, fontSize, singers)
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
        tempo: song.tempo,
        timeSignature: song.timeSignature,
        pageInSong: index + 1,
        pagesInSong: packed.length,
        fontSize,
        entries: pageEntries,
        singers,
      })
    })
  })

  return pages
}

export { BLOCK_GAP, BLOCK_THEME }
