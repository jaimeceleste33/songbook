import Link from 'next/link'
import { listSetlists } from '@/lib/db/queries'
import { NewSetlistForm } from '@/components/new-setlist-form'

export const metadata = { title: 'Repertorios · Songbook' }
export const dynamic = 'force-dynamic'

const dateFormat = new Intl.DateTimeFormat('es-AR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

export default async function SetlistsPage() {
  const lists = await listSetlists()

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-semibold tracking-tight">Repertorios</h1>
        <p className="text-sm text-muted">
          El orden de canciones para cada vez que cantás.
        </p>
      </div>

      <NewSetlistForm />

      {lists.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-border bg-surface/50 px-6 py-14 text-center">
          <p className="text-4xl">📋</p>
          <p className="mt-3 font-medium">Todavía no armaste ningún repertorio</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
            Creá uno arriba, elegí las canciones en el orden que las vas a cantar, y el
            día que toque abrís el modo cantar.
          </p>
        </div>
      ) : (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {lists.map((list) => (
            <li key={list.id}>
              <Link
                href={`/setlists/${list.id}`}
                className="block rounded-2xl border border-border bg-surface p-4 transition hover:border-brand/60"
              >
                <p className="font-medium">{list.name}</p>
                <p className="mt-1 text-sm text-muted">
                  {list.serviceDate ? dateFormat.format(list.serviceDate) : 'Sin fecha'} ·{' '}
                  {list.songCount} {list.songCount === 1 ? 'canción' : 'canciones'}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
