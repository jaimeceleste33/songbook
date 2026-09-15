'use client'

import { STAGE } from '@/lib/lyrics/theme'
import type { PerformPage } from '@/lib/perform/layout'
import {
  BLOCK_GAP,
  HEADER_GAP,
  HEADER_H,
  blockStyles,
} from '@/lib/perform/sheet'

/**
 * One printed page.
 *
 * Every measurement and every colour here comes from `sheet.ts` and `STAGE` —
 * nothing is styled locally. `measureAll` builds an invisible copy of this
 * exact markup to decide the font size, so a style that lives only here would
 * make the two disagree and spill lyrics off the page during a service.
 */
export function SongPage({ page }: { page: PerformPage }) {
  return (
    <article className="flex h-full flex-col">
      <header
        className="flex shrink-0 items-center justify-between gap-3 px-4"
        style={{
          height: HEADER_H,
          marginBottom: HEADER_GAP,
          borderRadius: 6,
          background: STAGE.title,
          color: STAGE.titleInk,
        }}
      >
        <h1 className="truncate text-base font-bold uppercase tracking-wide">
          {page.title}
        </h1>
        <span className="shrink-0 text-sm font-semibold tabular-nums opacity-80">
          {page.songKey ? `${page.songKey} · ` : ''}
          {page.pagesInSong > 1 ? `${page.pageInSong}/${page.pagesInSong}` : ''}
        </span>
      </header>

      <div
        className="min-h-0 flex-1"
        style={{
          fontSize: `${page.fontSize}px`,
          display: 'grid',
          gap: `${BLOCK_GAP}px`,
          alignContent: 'start',
        }}
      >
        {page.entries.map((entry) => {
          const styles = blockStyles(entry.block)
          return (
            <div key={entry.key} style={styles.row}>
              <div style={styles.strip}>
                <div style={styles.label}>{entry.block.label}</div>
              </div>
              <div style={styles.body}>{entry.block.lyrics}</div>
            </div>
          )
        })}
      </div>
    </article>
  )
}
