'use client'

import { logout } from '@/lib/auth/actions'

/**
 * Before leaving, drops the pages the offline worker kept: they belong to
 * this person's band, and the next one to sign in on this iPad may be in
 * another. Assets stay — they are the same app for everyone.
 */
export function LogoutButton() {
  const clearPages = async () => {
    try {
      const names = await caches.keys()
      await Promise.all(
        names.filter((n) => n.startsWith('songbook-pages-')).map((n) => caches.delete(n)),
      )
    } catch {
      // No Cache Storage (old browser, private mode): nothing was kept anyway.
    }
  }

  return (
    <form action={async () => {
      await clearPages()
      await logout()
    }}>
      <button
        type="submit"
        className="rounded-lg px-3 py-2 text-sm text-muted transition hover:text-text"
      >
        Salir
      </button>
    </form>
  )
}
