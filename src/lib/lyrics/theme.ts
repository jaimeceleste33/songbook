import type { BlockKind } from './types'

/**
 * One palette for the whole app instead of a colour picker per section.
 * The singer recognises a chorus by colour without reading the tab, and
 * nothing looks inconsistent across songs.
 *
 * `tab`    is the vertical label strip. Same colour everywhere.
 * `accent` tints the block on the DARK editor background.
 * `sheet`  tints the block on the LIGHT performance sheet. Opaque, because
 *          it sits on paper, not on glass.
 */
export const BLOCK_THEME: Record<
  BlockKind,
  { tab: string; accent: string; sheet: string; name: string }
> = {
  verse:     { tab: '#2563eb', accent: 'rgba(37, 99, 235, 0.08)',  sheet: '#e8f0fe', name: 'Verso' },
  prechorus: { tab: '#7c3aed', accent: 'rgba(124, 58, 237, 0.08)', sheet: '#f1eafe', name: 'Pre-coro' },
  chorus:    { tab: '#dc2626', accent: 'rgba(220, 38, 38, 0.10)',  sheet: '#fdeaea', name: 'Coro' },
  bridge:    { tab: '#059669', accent: 'rgba(5, 150, 105, 0.08)',  sheet: '#e4f5ee', name: 'Puente' },
  intro:     { tab: '#64748b', accent: 'rgba(100, 116, 139, 0.08)', sheet: '#eef1f5', name: 'Intro' },
  outro:     { tab: '#475569', accent: 'rgba(71, 85, 105, 0.08)',  sheet: '#ecf0f4', name: 'Final' },
  tag:       { tab: '#ea580c', accent: 'rgba(234, 88, 12, 0.08)',  sheet: '#fdefe4', name: 'Tag' },
  other:     { tab: '#334155', accent: 'rgba(51, 65, 85, 0.06)',   sheet: '#f0f2f6', name: 'Parte' },
}

/**
 * The performance sheet. The singer reads this while singing, so it is paper:
 * light, high contrast, colour carried by the part strips.
 *
 * This is the ONE place that decides light or dark on stage — the rest of the
 * perform view reads these values, it never hardcodes a colour.
 */
export const STAGE = {
  /** The sheet itself. White, the way the singer asked for it. */
  page: '#ffffff',
  /** The title bar. Her default header colour. */
  title: '#38b6ff',
  titleInk: '#ffffff',
  /** The lyrics themselves. Near-black, not pure black: less glare on stage. */
  ink: '#111827',
  /** Footer, page numbers, everything that is not the song. */
  chrome: '#64748b',
} as const

export const BLOCK_KINDS = Object.keys(BLOCK_THEME) as BlockKind[]
