'use client'

import { useEffect } from 'react'

type WakeLockSentinel = { release: () => Promise<void>; released: boolean }
type WakeLockNavigator = Navigator & {
  wakeLock?: { request: (type: 'screen') => Promise<WakeLockSentinel> }
}

/**
 * Keeps the iPad awake while a song is on screen.
 *
 * The lock is dropped by the browser whenever the tab is hidden, so it is
 * re-acquired on visibilitychange. Where the API is missing the hook is a
 * no-op: the app still works, the screen just dims on its own.
 */
export function useWakeLock(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return
    const api = (navigator as WakeLockNavigator).wakeLock
    if (!api) return

    let sentinel: WakeLockSentinel | null = null
    let cancelled = false

    const acquire = async () => {
      try {
        const lock = await api.request('screen')
        if (cancelled) {
          void lock.release()
          return
        }
        sentinel = lock
      } catch {
        // Denied (battery saver, no user gesture yet). Not worth interrupting.
      }
    }

    const onVisibility = () => {
      if (document.visibilityState === 'visible' && (!sentinel || sentinel.released)) {
        void acquire()
      }
    }

    void acquire()
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisibility)
      if (sentinel && !sentinel.released) void sentinel.release()
    }
  }, [enabled])
}
