import { restoreSetlist, restoreSong } from '@/lib/actions/trash'
import { requirePagePermission } from '@/lib/auth'
import { listTrash } from '@/lib/db/queries'

export const metadata = { title: 'Papelera · Songbook' }
export const dynamic = 'force-dynamic'

const dateFormat = new Intl.DateTimeFormat('es-AR', {
  day: 'numeric',
  month: 'long',
  hour: '2-digit',
  minute: '2-digit',
})

/**
 * Nothing here is ever emptied on its own: the whole point is that a mistaken
 * tap costs nothing. Restoring is one tap and needs no confirmation.
 */
export default async function TrashPage() {
  const { bandId } = await requirePagePermission('content:delete')
  const trash = await listTrash(bandId)
  const empty = trash.songs.length === 0 && trash.setlists.length === 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Papelera</h1>
        <p className="text-sm text-muted">
          Lo que se elimina queda acá. Tocá «Recuperar» y vuelve tal como estaba.
        </p>
      </div>

      {empty ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface/50 px-6 py-14 text-center">
          <p className="text-4xl">🗑️</p>
          <p className="mt-3 font-medium">La papelera está vacía</p>
        </div>
      ) : null}

      {trash.setlists.length > 0 ? (
        <TrashList
          title="Repertorios"
          action={restoreSetlist}
          rows={trash.setlists.map((s) => ({ id: s.id, label: s.name, deletedAt: s.deletedAt }))}
        />
      ) : null}

      {trash.songs.length > 0 ? (
        <TrashList
          title="Canciones"
          action={restoreSong}
          rows={trash.songs.map((s) => ({
            id: s.id,
            label: s.artist ? `${s.title} · ${s.artist}` : s.title,
            deletedAt: s.deletedAt,
          }))}
        />
      ) : null}
    </div>
  )
}

function TrashList({
  title,
  action,
  rows,
}: {
  title: string
  action: (formData: FormData) => Promise<void>
  rows: { id: string; label: string; deletedAt: Date | null }[]
}) {
  return (
    <section>
      <h2 className="mb-2 font-medium">{title}</h2>
      <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
        {rows.map((row) => (
          <li key={row.id} className="flex items-center gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{row.label}</p>
              {row.deletedAt ? (
                <p className="text-xs text-muted">Eliminado el {dateFormat.format(row.deletedAt)}</p>
              ) : null}
            </div>
            <form action={action}>
              <input type="hidden" name="id" value={row.id} />
              <button
                type="submit"
                className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition active:scale-[0.99]"
              >
                Recuperar
              </button>
            </form>
          </li>
        ))}
      </ul>
    </section>
  )
}
