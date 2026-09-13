import type { BlockKind } from './types'

/**
 * One palette for the whole app instead of a colour picker per section.
 * The singer recognises a chorus by colour without reading the tab, and
 * nothing looks inconsistent across songs.
 *
 * `tab` is the vertical label strip, `accent` tints the block background.
 */
export const BLOCK_THEME: Record<BlockKind, { tab: string; accent: string; name: string }> = {
  verse:     { tab: '#2563eb', accent: 'rgba(37, 99, 235, 0.08)',  name: 'Verso' },
  prechorus: { tab: '#7c3aed', accent: 'rgba(124, 58, 237, 0.08)', name: 'Pre-coro' },
  chorus:    { tab: '#dc2626', accent: 'rgba(220, 38, 38, 0.10)',  name: 'Coro' },
  bridge:    { tab: '#059669', accent: 'rgba(5, 150, 105, 0.08)',  name: 'Puente' },
  intro:     { tab: '#64748b', accent: 'rgba(100, 116, 139, 0.08)', name: 'Intro' },
  outro:     { tab: '#475569', accent: 'rgba(71, 85, 105, 0.08)',  name: 'Final' },
  tag:       { tab: '#ea580c', accent: 'rgba(234, 88, 12, 0.08)',  name: 'Tag' },
  other:     { tab: '#334155', accent: 'rgba(51, 65, 85, 0.06)',   name: 'Parte' },
}

export const BLOCK_KINDS = Object.keys(BLOCK_THEME) as BlockKind[]
