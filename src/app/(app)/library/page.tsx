import Link from 'next/link'
import { listSongs } from '@/lib/db/queries'
import { SearchBox } from '@/components/search-box'

export const metadata = { title: 'Librería · Songbook' }
export const dynamic = 'force-dynamic'

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const items = await listSongs(q)

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Librería</h1>
          <p className="text-sm text-muted">
            {items.length} {items.length === 1 ? 'canción' : 'canciones'}
          </p>
        </div>
        <Link
          href="/library/new"
          className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition active:scale-[0.99]"
        >
          + Nueva canción
        </Link>
      </div>

      <SearchBox placeholder="Buscar por título…" defaultValue={q ?? ''} />

      {items.length === 0 ? (
        <EmptyState searching={Boolean(q)} />
      ) : (
        <ul className="mt-4 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
          {items.map((song) => (
            <li key={song.id}>
              <Link
                href={`/library/${song.id}`}
                className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-surface-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{song.title}</p>
                  {song.artist ? (
                    <p className="truncate text-sm text-muted">{song.artist}</p>
                  ) : null}
                </div>
                {song.songKey ? (
                  <span className="rounded-md bg-surface-2 px-2 py-1 text-xs font-medium text-muted">
                    {song.songKey}
                  </span>
                ) : null}
                <span aria-hidden className="text-muted">›</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function EmptyState({ searching }: { searching: boolean }) {
  return (
    <div className="mt-4 rounded-2xl border border-dashed border-border bg-surface/50 px-6 py-14 text-center">
      <p className="text-4xl">{searching ? '🔍' : '🎵'}</p>
      <p className="mt-3 font-medium">
        {searching ? 'No encontramos esa canción' : 'Todavía no cargaste ninguna canción'}
      </p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
        {searching
          ? 'Probá con otra parte del título.'
          : 'Cargá la primera y después armá el repertorio con las que vayas a cantar.'}
      </p>
      {!searching ? (
        <Link
          href="/library/new"
          className="mt-5 inline-block rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white"
        >
          Cargar mi primera canción
        </Link>
      ) : null}
    </div>
  )
}
