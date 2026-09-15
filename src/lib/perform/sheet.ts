import type { CSSProperties } from 'react'
import { BLOCK_THEME, STAGE } from '@/lib/lyrics/theme'
import type { SongBlock } from '@/lib/lyrics/types'

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

/** Apply a style object to a real node, for the off-screen ruler. */
export function applyStyle(el: HTMLElement, style: CSSProperties): void {
  Object.assign(el.style, style)
}
