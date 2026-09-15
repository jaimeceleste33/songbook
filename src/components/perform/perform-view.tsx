'use client'

import Link from 'next/link'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { STAGE } from '@/lib/lyrics/theme'
import { buildPages, type PerformPage, type PerformSong } from '@/lib/perform/layout'
import { PAGE_PAD_TOP, PAGE_PAD_X, usableHeight, usableWidth } from '@/lib/perform/sheet'
import { useWakeLock } from '@/lib/perform/use-wake-lock'
import { SongPage } from './song-page'
import { SetlistOverlay } from './setlist-overlay'

/** Past this fraction of a swipe the page commits instead of springing back. */
const COMMIT_AT = 0.3
const FLIP_MS = 420
const SCALE_KEY = 'songbook:font-scale'

type Flip = { dir: 'next' | 'prev'; progress: number; animating: boolean }

export function PerformView({
  setlistName,
  songs,
}: {
  setlistName: string
  songs: PerformSong[]
}) {
  const stageRef = useRef<HTMLDivElement>(null)
  const measureRef = useRef<HTMLDivElement>(null)

  const [pages, setPages] = useState<PerformPage[]>([])
  const [index, setIndex] = useState(0)
  const [flip, setFlip] = useState<Flip | null>(null)
  const [overlay, setOverlay] = useState(false)
  const [scale, setScale] = useState(1)
  const [ready, setReady] = useState(false)

  useWakeLock(true)

  // Restore the singer's preferred text size.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SCALE_KEY)
      if (saved) setScale(Number(saved) || 1)
    } catch {
      // Private mode or blocked storage: the default scale is fine.
    }
  }, [])

  const changeScale = (next: number) => {
    const clamped = Math.min(1.6, Math.max(0.6, Number(next.toFixed(2))))
    setScale(clamped)
    try {
      localStorage.setItem(SCALE_KEY, String(clamped))
    } catch {
      // Ignore: the size still applies for this session.
    }
  }

  /** Re-lay out on mount, on resize and whenever the text size changes. */
  useLayoutEffect(() => {
    const stage = stageRef.current
    const host = measureRef.current
    if (!stage || !host) return

    let frame = 0
    const relayout = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const rect = stage.getBoundingClientRect()
        if (rect.width < 40 || rect.height < 40) return
        // The ruler must be the width of the LYRICS, not of the stage: the
        // page padding is not text space, and measuring it as if it were made
        // every line wrap later than it really does.
        host.style.width = `${usableWidth(rect.width)}px`
        const built = buildPages(songs, host, usableHeight(rect.height), scale)
        setPages(built)
        setIndex((i) => Math.min(i, Math.max(0, built.length - 1)))
        setReady(true)
      })
    }

    relayout()
    const observer = new ResizeObserver(relayout)
    observer.observe(stage)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [songs, scale])

  const total = pages.length
  const canNext = index < total - 1
  const canPrev = index > 0

  const go = useCallback(
    (dir: 'next' | 'prev') => {
      if (flip?.animating) return
      if (dir === 'next' && !canNext) return
      if (dir === 'prev' && !canPrev) return

      setFlip({ dir, progress: dir === 'next' ? 0 : 1, animating: true })
      requestAnimationFrame(() => {
        setFlip({ dir, progress: dir === 'next' ? 1 : 0, animating: true })
      })
      window.setTimeout(() => {
        setIndex((i) => (dir === 'next' ? i + 1 : i - 1))
        setFlip(null)
      }, FLIP_MS)
    },
    [flip, canNext, canPrev],
  )

  /* --------------------------- drag to turn ---------------------------- */

  const drag = useRef<{ x: number; y: number; dir: 'next' | 'prev' | null; moved: boolean } | null>(
    null,
  )

  const onPointerDown = (e: React.PointerEvent) => {
    if (overlay || flip?.animating) return
    drag.current = { x: e.clientX, y: e.clientY, dir: null, moved: false }
  }

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current
    const stage = stageRef.current
    if (!d || !stage) return

    const dx = e.clientX - d.x
    const dy = e.clientY - d.y
    if (!d.moved && Math.abs(dx) < 8) {
      // Vertical intent: let it be, this is not a page turn.
      if (Math.abs(dy) > 12) drag.current = null
      return
    }
    d.moved = true

    if (!d.dir) {
      d.dir = dx < 0 ? 'next' : 'prev'
      if ((d.dir === 'next' && !canNext) || (d.dir === 'prev' && !canPrev)) {
        drag.current = null
        return
      }
    }

    const width = stage.getBoundingClientRect().width
    const raw = d.dir === 'next' ? -dx / width : dx / width
    const progress = Math.min(1, Math.max(0, raw))
    setFlip({ dir: d.dir, progress: d.dir === 'next' ? progress : 1 - progress, animating: false })
  }

  const onPointerUp = (e: React.PointerEvent) => {
    const d = drag.current
    const stage = stageRef.current
    drag.current = null
    if (!d || !stage) return

    // A tap, not a drag: use zones.
    if (!d.moved) {
      const rect = stage.getBoundingClientRect()
      const ratio = (e.clientX - rect.left) / rect.width
      if (ratio < 0.28) go('prev')
      else if (ratio > 0.72) go('next')
      else setOverlay(true)
      return
    }

    if (!d.dir) return
    const dx = e.clientX - d.x
    const width = rect0(stage)
    const travelled = Math.min(1, Math.abs(dx) / width)

    if (travelled >= COMMIT_AT) {
      setFlip({ dir: d.dir, progress: d.dir === 'next' ? 1 : 0, animating: true })
      const dir = d.dir
      window.setTimeout(() => {
        setIndex((i) => (dir === 'next' ? i + 1 : i - 1))
        setFlip(null)
      }, FLIP_MS)
    } else {
      setFlip({ dir: d.dir, progress: d.dir === 'next' ? 0 : 1, animating: true })
      window.setTimeout(() => setFlip(null), FLIP_MS)
    }
  }

  /* ----------------------------- keyboard ------------------------------ */

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (overlay) {
        if (e.key === 'Escape') setOverlay(false)
        return
      }
      if (['ArrowRight', 'ArrowDown', 'PageDown', ' '].includes(e.key)) {
        e.preventDefault()
        go('next')
      } else if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(e.key)) {
        e.preventDefault()
        go('prev')
      } else if (e.key === 'Escape') {
        setOverlay(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go, overlay])

  /* ------------------------------ render ------------------------------- */

  const current = pages[index]
  const under = flip
    ? flip.dir === 'next'
      ? pages[index + 1]
      : pages[index]
    : undefined
  const leaf = flip ? (flip.dir === 'next' ? pages[index] : pages[index - 1]) : undefined
  const angle = flip ? -180 * flip.progress : 0

  const jumpTargets = useMemo(() => {
    const firsts = new Map<number, number>()
    pages.forEach((page, i) => {
      if (!firsts.has(page.songIndex)) firsts.set(page.songIndex, i)
    })
    return firsts
  }, [pages])

  return (
    <div
      className="perform-root fixed inset-0 flex flex-col safe-pad"
      style={{ background: STAGE.page, color: STAGE.ink }}
    >
      {/* Off-screen ruler. Same width as a page, never visible. */}
      <div
        ref={measureRef}
        aria-hidden
        style={{
          position: 'absolute',
          left: -99999,
          top: 0,
          visibility: 'hidden',
          pointerEvents: 'none',
          display: 'grid',
          gap: '14px',
          alignContent: 'start',
        }}
      />

      <div
        ref={stageRef}
        className="relative min-h-0 flex-1"
        style={{ perspective: '2200px', padding: `${PAGE_PAD_TOP}px ${PAGE_PAD_X}px 0` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          drag.current = null
          setFlip(null)
        }}
      >
        {!ready ? (
          <p className="grid h-full place-items-center" style={{ color: STAGE.chrome }}>
            Preparando…
          </p>
        ) : total === 0 ? (
          <div className="grid h-full place-items-center text-center">
            <div>
              <p style={{ color: STAGE.chrome }}>
                Este repertorio no tiene canciones con letra.
              </p>
              <Link href="/setlists" className="mt-3 inline-block text-brand underline">
                Volver
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* What sits underneath the turning leaf. */}
            <div
              className="absolute inset-0"
              style={{ padding: `${PAGE_PAD_TOP}px ${PAGE_PAD_X}px 0` }}
            >
              {under ? <SongPage page={under} /> : current ? <SongPage page={current} /> : null}
            </div>

            {/* The leaf itself. */}
            {flip && leaf ? (
              <div
                className="page-leaf absolute inset-0"
                style={{
                  padding: `${PAGE_PAD_TOP}px ${PAGE_PAD_X}px 0`,
                  transformOrigin: 'left center',
                  transformStyle: 'preserve-3d',
                  transform: `rotateY(${angle}deg)`,
                  transition: flip.animating
                    ? `transform ${FLIP_MS}ms cubic-bezier(0.22, 0.61, 0.36, 1)`
                    : 'none',
                  willChange: 'transform',
                }}
              >
                <div style={{ backfaceVisibility: 'hidden', height: '100%' }}>
                  <SongPage page={leaf} />
                </div>
                {/* The paper back of the sheet. */}
                <div
                  aria-hidden
                  className="absolute inset-0"
                  style={{
                    background: STAGE.page,
                    transform: 'rotateY(180deg)',
                    backfaceVisibility: 'hidden',
                  }}
                />
                {/* Shadow deepening as the sheet lifts. */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(to left, rgba(15,23,42,0.28), rgba(15,23,42,0) 55%)',
                    opacity: Math.sin(Math.min(1, flip.progress) * Math.PI),
                  }}
                />
              </div>
            ) : null}
          </>
        )}
      </div>

      {/* Footer: position, and the only always-visible way out. */}
      <footer
        className="flex shrink-0 items-center justify-between gap-3 px-5 pb-2 pt-1 text-xs"
        style={{ color: STAGE.chrome }}
      >
        <Link href="/setlists" className="rounded px-2 py-1">
          ‹ Salir
        </Link>
        <button
          type="button"
          onClick={() => setOverlay(true)}
          className="truncate rounded px-2 py-1"
        >
          {setlistName}
        </button>
        <span className="tabular-nums">
          {total > 0 ? `${index + 1}/${total}` : '—'}
        </span>
      </footer>

      {overlay ? (
        <SetlistOverlay
          setlistName={setlistName}
          songs={songs}
          pages={pages}
          currentIndex={index}
          jumpTargets={jumpTargets}
          scale={scale}
          onScaleChange={changeScale}
          onJump={(pageIndex) => {
            setFlip(null)
            setIndex(pageIndex)
            setOverlay(false)
          }}
          onClose={() => setOverlay(false)}
        />
      ) : null}
    </div>
  )
}

function rect0(el: HTMLElement): number {
  const width = el.getBoundingClientRect().width
  return width > 0 ? width : 1
}
