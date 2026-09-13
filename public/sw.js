/**
 * Offline support for a service with bad wifi.
 *
 * The point is narrow: once a setlist has been opened while online, its pages
 * must keep working when the connection drops mid-service.
 *
 * Bump CACHE_VERSION on any change here. Old caches are deleted on activate,
 * and the worker takes control immediately, so a bad version can always be
 * replaced by deploying a new one rather than asking someone to clear Safari.
 */
const CACHE_VERSION = 'v1'
const SHELL_CACHE = `songbook-shell-${CACHE_VERSION}`
const PAGES_CACHE = `songbook-pages-${CACHE_VERSION}`
const ASSETS_CACHE = `songbook-assets-${CACHE_VERSION}`

const KEEP = new Set([SHELL_CACHE, PAGES_CACHE, ASSETS_CACHE])

self.addEventListener('install', (event) => {
  // Nothing is precached: Next's chunk names are hashed per build, so they are
  // picked up at runtime instead of from a manifest that would go stale.
  event.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys()
      await Promise.all(
        names
          .filter((name) => name.startsWith('songbook-') && !KEEP.has(name))
          .map((name) => caches.delete(name)),
      )
      await self.clients.claim()
    })(),
  )
})

/** Lets the page force an update without the singer clearing anything. */
self.addEventListener('message', (event) => {
  if (event.data === 'skip-waiting') self.skipWaiting()
})

const isStaticAsset = (url) =>
  url.pathname.startsWith('/_next/static/') ||
  url.pathname === '/icon.svg' ||
  url.pathname === '/favicon.ico'

/** Pages worth keeping for offline use: the setlist player and its lists. */
const isCacheablePage = (url) =>
  url.pathname === '/' ||
  url.pathname === '/setlists' ||
  url.pathname === '/library' ||
  url.pathname === '/ayuda' ||
  url.pathname.startsWith('/cantar/') ||
  url.pathname.startsWith('/setlists/')

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName)
  try {
    const response = await fetch(request)
    // `fetch` follows redirects, so an expired session comes back as a
    // perfectly healthy 200 whose body is the login page. Caching that under
    // the song's URL would strand the singer in a login loop offline, so a
    // followed redirect is returned but never stored.
    if (response.ok && response.type === 'basic' && !response.redirected) {
      cache.put(request, response.clone())
    }
    return response
  } catch (error) {
    const cached = await cache.match(request)
    if (cached) return cached
    throw error
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)
  if (cached) return cached
  const response = await fetch(request)
  if (response.ok) cache.put(request, response.clone())
  return response
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  // Never touch auth or server actions.
  if (url.pathname === '/login' || url.pathname.startsWith('/api/')) return

  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request, ASSETS_CACHE))
    return
  }

  const isNavigation = request.mode === 'navigate'
  const isRscPayload = url.searchParams.has('_rsc')

  if ((isNavigation || isRscPayload) && isCacheablePage(url)) {
    event.respondWith(networkFirst(request, PAGES_CACHE))
  }
})
