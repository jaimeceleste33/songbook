import Link from 'next/link'
import { requireMember } from '@/lib/auth'
import { can } from '@/lib/auth/permissions'
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
  const { bandId, role } = await requireMember()
  const canEdit = can(role, 'content:edit')
  const lists = await listSetlists(bandId)

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-semibold tracking-tight">Repertorios</h1>
        <p className="text-sm text-muted">
          El orden de canciones para cada vez que cantás.
        </p>
      </div>

      {canEdit ? <NewSetlistForm /> : null}

      {lists.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-border bg-surface/50 px-6 py-14 text-center">
          <p className="text-4xl">📋</p>
          <p className="mt-3 font-medium">Todavía no hay repertorios</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
            {canEdit
              ? 'Creá uno arriba, elegí las canciones en el orden que las vas a cantar, y el día que toque abrís el modo cantar.'
              : 'Cuando alguien de la banda arme uno, lo vas a ver acá.'}
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
