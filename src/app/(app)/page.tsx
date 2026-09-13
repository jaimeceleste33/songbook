import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ONBOARDING_KEY, getSetting, listSetlists, listSongs } from '@/lib/db/queries'

export const dynamic = 'force-dynamic'

const dateFormat = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'long' })

export default async function HomePage() {
  const done = await getSetting<boolean>(ONBOARDING_KEY)
  if (!done) redirect('/bienvenida')

  const [lists, songs] = await Promise.all([listSetlists(), listSongs()])
  const next = lists[0]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Hola 👋</h1>
        <p className="text-sm text-muted">
          {songs.length} {songs.length === 1 ? 'canción' : 'canciones'} en tu librería.
        </p>
      </div>

      {next ? (
        <section className="rounded-2xl border border-border bg-surface p-5">
          <p className="text-xs uppercase tracking-wide text-muted">Último repertorio</p>
          <p className="mt-1 text-xl font-semibold">{next.name}</p>
          <p className="text-sm text-muted">
            {next.serviceDate ? dateFormat.format(next.serviceDate) : 'Sin fecha'} ·{' '}
            {next.songCount} {next.songCount === 1 ? 'canción' : 'canciones'}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {next.songCount > 0 ? (
              <Link
                href={`/cantar/${next.id}`}
                className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white"
              >
                ▶ Cantar
              </Link>
            ) : null}
            <Link
              href={`/setlists/${next.id}`}
              className="rounded-xl border border-border px-5 py-2.5 text-sm font-medium"
            >
              Editar
            </Link>
          </div>
        </section>
      ) : (
        <section className="rounded-2xl border border-dashed border-border bg-surface/50 p-6 text-center">
          <p className="text-4xl">📋</p>
          <p className="mt-3 font-medium">Armá tu primer repertorio</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
            Elegí las canciones en el orden que las vas a cantar.
          </p>
          <Link
            href="/setlists"
            className="mt-4 inline-block rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white"
          >
            Crear repertorio
          </Link>
        </section>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/library/new"
          className="rounded-2xl border border-border bg-surface p-5 transition hover:border-brand/60"
        >
          <p className="text-2xl">🎵</p>
          <p className="mt-2 font-medium">Cargar una canción</p>
          <p className="text-sm text-muted">Pegás la letra y marcás las partes.</p>
        </Link>
        <Link
          href="/setlists"
          className="rounded-2xl border border-border bg-surface p-5 transition hover:border-brand/60"
        >
          <p className="text-2xl">📋</p>
          <p className="mt-2 font-medium">Mis repertorios</p>
          <p className="text-sm text-muted">Armá el orden de cada servicio.</p>
        </Link>
      </div>
    </div>
  )
}
