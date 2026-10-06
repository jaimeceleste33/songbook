import type { CSSProperties } from 'react'
import { BLOCK_THEME, STAGE } from '@/lib/lyrics/theme'
import { hasChords, sheetLines, type SheetLine } from '@/lib/lyrics/chords'
import type { SongBlock } from '@/lib/lyrics/types'
import { lyricSegments, singerColor } from '@/lib/lyrics/voices'

/**
 * The sheet: how one part is drawn, and how much room the lyrics get.
 *
 * Everything here exists once and is used TWICE — by `SongPage`, which draws
 * the real page, and by `measureAll`, which draws an invisible copy to measure
 * it. If the two ever disagree the measured heights lie and the lyrics run off
 * the bottom of the screen in the middle of a service. So neither of them is
 * allowed its own styling: both read these objects.
 */

/** Padding the page sits in, inside the stage box. */
export const PAGE_PAD_X = 20
export const PAGE_PAD_TOP = 16

/** The title bar, which eats the top of every page. */
export const HEADER_H = 44
export const HEADER_GAP = 12

/** Vertical space between two parts. */
export const BLOCK_GAP = 14

/** Width the lyrics actually get, given the stage box. */
export function usableWidth(stageWidth: number): number {
  return stageWidth - PAGE_PAD_X * 2
}

/** Height the lyrics actually get, once padding and title bar are gone. */
export function usableHeight(stageHeight: number): number {
  return stageHeight - PAGE_PAD_TOP - HEADER_H - HEADER_GAP
}

export interface BlockStyles {
  row: CSSProperties
  strip: CSSProperties
  label: CSSProperties
  body: CSSProperties
}

/**
 * One part: a colour strip down the left with the name rotated inside it, the
 * lyrics on a tinted card beside it. This is the layout the singer asked for —
 * she reads the colour before she reads the word.
 *
 * Sizes are in `em` so the whole part grows with the lyrics, `clamp`ed so the
 * strip stays legible when the text is small and does not eat the screen when
 * the text is large.
 */
export function blockStyles(block: SongBlock): BlockStyles {
  const theme = BLOCK_THEME[block.kind]
  return {
    row: {
      display: 'flex',
      alignItems: 'stretch',
      borderRadius: '6px',
      overflow: 'hidden',
      background: theme.sheet,
    },
    strip: {
      // No font-size of its own: `em` here means em of the lyrics.
      flex: '0 0 auto',
      width: 'clamp(30px, 1.5em, 62px)',
      background: theme.tab,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0.4em 0',
    },
    label: {
      color: '#ffffff',
      fontSize: 'clamp(11px, 0.38em, 22px)',
      fontWeight: 700,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      lineHeight: 1.2,
      textAlign: 'center',
      wordBreak: 'break-word',
      // Bottom-to-top, the way the prototype printed it.
      writingMode: 'vertical-rl',
      rotate: '180deg',
    },
    body: {
      flex: '1 1 auto',
      minWidth: 0,
      padding: '0.34em 0.6em',
      whiteSpace: 'pre-line',
      lineHeight: 1.28,
      fontWeight: 700,
      color: STAGE.ink,
    },
  }
}

/** Line height of the lyrics, reused as the height of one blank line. */
const LINE = '1.28em'

/**
 * One stretch of a part. `box` wraps it; `tag` is the singer's name, drawn
 * only for someone else's lines; `text` holds the lyrics.
 */
export interface SegmentView {
  key: string
  text: string
  /**
   * The lyrics line by line, when they carry chords. Null means plain text,
   * drawn exactly as before chords existed — which is always the case for
   * someone with chords turned off, since their parts arrive already stripped.
   */
  lines: SheetLine[] | null
  /** Name on the tag, or null for the lead's own lines. */
  singer: string | null
  box: CSSProperties
  tag: CSSProperties
  body: CSSProperties
}

/**
 * The body of a part, split by who sings it. `SongPage` and `measureAll` both
 * draw exactly this list, so a voiced part measures as tall as it renders.
 *
 * Someone else's lines get three cues at once, because on stage one glance has
 * to be enough and colour alone is not (the part already owns the colour):
 * her NAME on a tag, a bar in her colour down the side, and slightly softer
 * ink — still readable, visibly not the lead's to sing.
 */
export function segmentViews(block: SongBlock, singers: string[]): SegmentView[] {
  return lyricSegments(block).map((segment, i) => {
    const gap = segment.gapBefore ? LINE : undefined
    const lines = hasChords(segment.text) ? sheetLines(segment.text) : null
    if (segment.singer === null) {
      return {
        key: `s${i}`,
        text: segment.text,
        lines,
        singer: null,
        box: { marginTop: gap },
        tag: {},
        body: {},
      }
    }

    const color = singerColor(segment.singer, singers)
    return {
      key: `s${i}`,
      text: segment.text,
      lines,
      singer: segment.singer,
      box: {
        marginTop: gap ?? '0.18em',
        marginBottom: '0.18em',
        borderLeft: `clamp(4px, 0.16em, 9px) solid ${color}`,
        borderRadius: '0 4px 4px 0',
        // Hex alpha: the singer's colour at ~10%, over the part's tint.
        background: `${color}1a`,
        padding: '0.14em 0.4em 0.18em 0.45em',
      },
      tag: {
        display: 'block',
        width: 'fit-content',
        maxWidth: '100%',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        fontSize: 'clamp(11px, 0.4em, 22px)',
        fontWeight: 800,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        lineHeight: 1.3,
        color: '#ffffff',
        background: color,
        borderRadius: '999px',
        padding: '0.1em 0.7em',
        marginBottom: '0.2em',
      },
      body: { color: STAGE.otherInk },
    }
  })
}

export interface ChordStyles {
  /** One lyric line; a line that wraps stays one block. */
  line: CSSProperties
  blank: CSSProperties
  /** A word with a chord in it: never split across two rows. */
  word: CSSProperties
  /** Chord on top, its syllable underneath. */
  anchor: CSSProperties
  chord: CSSProperties
  syllable: CSSProperties
  /** A line of only chords — an intro, a turnaround. */
  chordRow: CSSProperties
  chordRowItem: CSSProperties
}

/**
 * Chords over their syllables. Each chord sits on top of the exact syllable
 * it is played on, so a line that wraps on a narrow screen carries its chords
 * with it — aligning chords with spaces, the way the sites print them, falls
 * apart the moment the line wraps or the font is not monospaced.
 *
 * A chord wider than its syllable pushes the rest of the word along
 * ("tem- -bló"): spacing out a word beats two chords printed on top of each
 * other. Lines without chords are drawn exactly like before.
 *
 * `color` is a parameter because the editor preview sits on the dark app, not
 * on paper.
 */
export function chordStyles(color: string = STAGE.chord): ChordStyles {
  const chordText: CSSProperties = {
    fontSize: '0.72em',
    fontWeight: 800,
    lineHeight: 1.2,
    color,
    whiteSpace: 'nowrap',
  }
  return {
    line: {},
    blank: { height: LINE },
    word: { whiteSpace: 'nowrap' },
    // Its baseline is its last line — the syllable — so it sits on the
    // lyrics' baseline and the chord rises above the line.
    anchor: { display: 'inline-block' },
    chord: { ...chordText, display: 'block', paddingRight: '0.4em' },
    syllable: { display: 'block' },
    // Smaller than a lyric line: there are no words under these chords.
    chordRow: { ...chordText, whiteSpace: 'normal', padding: '0.1em 0' },
    chordRowItem: { display: 'inline-block', marginRight: '1.6em' },
  }
}

/** Apply a style object to a real node, for the off-screen ruler. */
export function applyStyle(el: HTMLElement, style: CSSProperties): void {
  Object.assign(el.style, style)
}
