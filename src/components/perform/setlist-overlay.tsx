'use client'

import { useEffect, useRef } from 'react'
import type { PerformPage, PerformSong } from '@/lib/perform/layout'

/**
 * The quick index: every song in the repertoire, in order, one tap to jump.
 * Opened by tapping the middle of the page or the name in the footer.
 */
export function SetlistOverlay({
  setlistName,
  songs,
  pages,
  currentIndex,
  jumpTargets,
  scale,
  onScaleChange,
  onJump,
  onClose,
}: {
  setlistName: string
  songs: PerformSong[]
  pages: PerformPage[]
  currentIndex: number
  jumpTargets: Map<number, number>
  scale: number
  onScaleChange: (next: number) => void
  onJump: (pageIndex: number) => void
  onClose: () => void
}) {
  const panelRef = useRef<HTMLDivElement>(null)
  const currentSong = pages[currentIndex]?.songIndex ?? 0

  // Bring the song being sung into view when the index opens.
  useEffect(() => {
    panelRef.current
      ?.querySelector('[data-current="true"]')
      ?.scrollIntoView({ block: 'center' })
  }, [])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Canciones de ${setlistName}`}
      className="absolute inset-0 z-40 flex flex-col bg-black/80 backdrop-blur-sm safe-pad"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        className="mx-auto flex min-h-0 w-full max-w-lg flex-1 flex-col p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex shrink-0 items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold">{setlistName}</p>
            <p className="text-xs text-white/40">
              {songs.length} {songs.length === 1 ? 'canción' : 'canciones'} ·{' '}
              {pages.length} {pages.length === 1 ? 'página' : 'páginas'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-lg px-3 py-2 text-white/50 hover:text-white"
          >
            ✕
          </button>
        </div>

        <ol className="min-h-0 flex-1 space-y-1 overflow-y-auto">
          {songs.map((song, songIndex) => {
            const target = jumpTargets.get(songIndex)
            const isCurrent = songIndex === currentSong
            const pageCount = pages.filter((p) => p.songIndex === songIndex).length

            return (
              <li key={song.id}>
                <button
                  type="button"
                  data-current={isCurrent}
                  disabled={target === undefined}
                  onClick={() => target !== undefined && onJump(target)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition disabled:opacity-40 ${
                    isCurrent ? 'bg-white/15' : 'hover:bg-white/8'
                  }`}
                >
                  <span className="w-6 text-right text-sm tabular-nums text-white/40">
                    {songIndex + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{song.title}</span>
                    {song.artist ? (
                      <span className="block truncate text-xs text-white/40">
                        {song.artist}
                      </span>
                    ) : null}
                  </span>
                  {song.songKey ? (
                    <span className="rounded bg-white/10 px-1.5 py-0.5 text-xs">
                      {song.songKey}
                    </span>
                  ) : null}
                  {pageCount > 1 ? (
                    <span className="text-xs text-white/30">{pageCount} pág.</span>
                  ) : null}
                </button>
              </li>
            )
          })}
        </ol>

        <div className="mt-3 flex shrink-0 items-center justify-between gap-3 rounded-xl bg-white/5 px-4 py-3">
          <span className="text-sm text-white/60">Tamaño de letra</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onScaleChange(scale - 0.1)}
              aria-label="Achicar letra"
              className="size-9 rounded-lg bg-white/10 text-lg leading-none hover:bg-white/20"
            >
              −
            </button>
            <span className="w-12 text-center text-sm tabular-nums text-white/60">
              {Math.round(scale * 100)}%
            </span>
            <button
              type="button"
              onClick={() => onScaleChange(scale + 0.1)}
              aria-label="Agrandar letra"
              className="size-9 rounded-lg bg-white/10 text-lg leading-none hover:bg-white/20"
            >
              +
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
