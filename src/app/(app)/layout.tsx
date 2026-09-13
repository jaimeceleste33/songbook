import Link from 'next/link'
import { requireAuth } from '@/lib/auth'
import { logout } from '@/lib/auth/actions'
import { NavLink } from '@/components/nav-link'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireAuth()

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-border bg-bg/85 backdrop-blur">
        <nav className="mx-auto flex max-w-5xl items-center gap-1 px-4 py-3">
          <Link href="/" className="mr-3 flex items-center gap-2 font-semibold">
            <span className="text-xl">🎵</span>
            <span className="hidden sm:inline">Songbook</span>
          </Link>
          <NavLink href="/setlists">Repertorios</NavLink>
          <NavLink href="/library">Librería</NavLink>
          <div className="flex-1" />
          <Link
            href="/ayuda"
            className="rounded-lg px-3 py-2 text-sm text-muted transition hover:text-text"
          >
            Ayuda
          </Link>
          <form action={logout}>
            <button
              type="submit"
              className="rounded-lg px-3 py-2 text-sm text-muted transition hover:text-text"
            >
              Salir
            </button>
          </form>
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6 safe-pad">{children}</main>
    </div>
  )
}
