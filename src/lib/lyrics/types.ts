/**
 * A song is stored as two separate things:
 *
 *  - `blocks`: the unique pieces of text. A chorus is written ONCE.
 *  - `flow`:   the order those blocks are sung, repetitions included.
 *              e.g. ["b1", "b3", "b2", "b3", "b1", "b2", "b3"]
 *
 * Keeping them apart is what lets the singer paste a lyric once and then
 * arrange it, instead of retyping the chorus for every repeat.
 */

export type BlockKind =
  | 'verse'
  | 'prechorus'
  | 'chorus'
  | 'bridge'
  | 'intro'
  | 'outro'
  | 'tag'
  | 'other'

export interface SongBlock {
  /** Stable within a song. Referenced by `flow`. */
  id: string
  /** What the singer sees on the coloured tab: "Verso 1", "Coro". */
  label: string
  kind: BlockKind
  lyrics: string
}

export interface SongContent {
  blocks: SongBlock[]
  /** Block ids in singing order. May repeat the same id many times. */
  flow: string[]
}

/**
 * Raised by the parser when the same label shows up twice with different
 * text. We never drop the second one — it becomes its own block — but the
 * editor surfaces this so the singer can merge them if it was a typo.
 */
export interface ParseWarning {
  kind: 'duplicate-label-different-text'
  label: string
  createdLabel: string
}

export interface ParseResult extends SongContent {
  warnings: ParseWarning[]
}
