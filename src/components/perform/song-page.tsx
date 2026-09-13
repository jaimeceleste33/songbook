'use client'

import { BLOCK_THEME } from '@/lib/lyrics/theme'
import { BLOCK_GAP, type PerformPage } from '@/lib/perform/layout'

/**
 * One printed page. The styling here must mirror `measureAll` in layout.ts —
 * if the two drift apart the measured heights stop matching and text overflows
 * the page during a service, which is the one thing that must never happen.
 */
export function SongPage({ page }: { page: PerformPage }) {
  return (
    <article className="flex h-full flex-col">
      <header className="mb-3 flex shrink-0 items-baseline justify-between gap-3 border-b border-white/10 pb-2">
        <h1 className="truncate text-lg font-semibold tracking-tight text-white/90">
          {page.title}
        </h1>
        <span className="shrink-0 text-sm tabular-nums text-white/40">
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
          const theme = BLOCK_THEME[entry.block.kind]
          return (
            <div key={entry.key}>
              <div
                style={{
                  fontSize: '0.34em',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  marginBottom: '0.18em',
                  lineHeight: 1.2,
                  color: theme.tab,
                }}
              >
                {entry.block.label}
              </div>
              <div style={{ whiteSpace: 'pre-line', lineHeight: 1.28, fontWeight: 600 }}>
                {entry.block.lyrics}
              </div>
            </div>
          )
        })}
      </div>
    </article>
  )
}
