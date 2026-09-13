'use client'

import { useEffect, useState } from 'react'

/**
 * Registers the offline worker and surfaces two things the singer cares about:
 * that a new version is ready, and that the connection dropped.
 *
 * Development is excluded on purpose: dev chunks are unhashed and caching them
 * serves stale code on the next edit.
 */
export function ServiceWorker() {
  const [updateReady, setUpdateReady] = useState(false)
  const [offline, setOffline] = useState(false)

  useEffect(() => {
    const goOffline = () => setOffline(true)
    const goOnline = () => setOffline(false)
    setOffline(!navigator.onLine)
    window.addEventListener('offline', goOffline)
    window.addEventListener('online', goOnline)
    return () => {
      window.removeEventListener('offline', goOffline)
      window.removeEventListener('online', goOnline)
    }
  }, [])

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    if (!('serviceWorker' in navigator)) return

    let registration: ServiceWorkerRegistration | undefined

    const register = async () => {
      try {
        registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' })

        // A worker already waiting means an update arrived in a previous visit.
        if (registration.waiting) setUpdateReady(true)

        registration.addEventListener('updatefound', () => {
          const installing = registration?.installing
          if (!installing) return
          installing.addEventListener('statechange', () => {
            // `controller` is null on the very first install; that is not an
            // update, it is the worker taking over for the first time.
            if (installing.state === 'installed' && navigator.serviceWorker.controller) {
              setUpdateReady(true)
            }
          })
        })
      } catch {
        // Offline support is a bonus; the app works without it.
      }
    }

    void register()
  }, [])

  const applyUpdate = () => {
    navigator.serviceWorker.getRegistration().then((registration) => {
      registration?.waiting?.postMessage('skip-waiting')
      window.location.reload()
    })
  }

  if (!updateReady && !offline) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center p-3 safe-pad">
      {updateReady ? (
        <button
          type="button"
          onClick={applyUpdate}
          className="pointer-events-auto rounded-full bg-brand px-4 py-2 text-sm font-medium text-white shadow-lg"
        >
          Hay una versión nueva · Tocá para actualizar
        </button>
      ) : (
        <span className="pointer-events-auto rounded-full bg-amber-500/90 px-4 py-2 text-sm font-medium text-black shadow-lg">
          Sin conexión · estás viendo lo guardado
        </span>
      )}
    </div>
  )
}
