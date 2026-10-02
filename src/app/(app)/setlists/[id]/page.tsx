import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ConfirmAction } from '@/components/confirm-action'
import { removeSetlist } from '@/lib/actions/setlists'
import { requireMember } from '@/lib/auth'
import { can } from '@/lib/auth/permissions'
import { getSetlistWithSongs, listSongs } from '@/lib/db/queries'
import { SetlistBuilder } from '@/components/setlist-builder'

export const dynamic = 'force-dynamic'

export default async function SetlistPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { bandId, role } = await requireMember()
  const [list, library] = await Promise.all([
    getSetlistWithSongs(bandId, id),
    listSongs(bandId),
  ])
  if (!list) notFound()

  const chosen = list.items.map((item) => ({
    songId: item.song.id,
    title: item.song.title,
    artist: item.song.artist,
    songKey: item.song.songKey,
  }))

  return (
    <div>
      <Link href="/setlists" className="mb-4 inline-block text-sm text-muted hover:text-text">
        ‹ Repertorios
      </Link>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{list.name}</h1>
        <div className="flex items-center gap-2">
          {chosen.length > 0 ? (
            <Link
              href={`/cantar/${list.id}`}
              className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white transition active:scale-[0.99]"
            >
              ▶ Cantar
            </Link>
          ) : null}
          {can(role, 'content:delete') ? (
            <ConfirmAction
              action={removeSetlist}
              fields={{ id: list.id }}
              label="Eliminar"
              title={`¿Mandar «${list.name}» a la papelera?`}
              confirmLabel="Mandar a la papelera"
            >
              <p>Deja de aparecer en Repertorios. Las canciones siguen en la librería.</p>
              <p>Si fue sin querer, lo recuperás desde Papelera tal como estaba.</p>
            </ConfirmAction>
          ) : null}
        </div>
      </div>

      {can(role, 'content:edit') ? (
        <SetlistBuilder setlistId={list.id} chosen={chosen} library={library} />
      ) : chosen.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-5 text-sm text-muted">
          Este repertorio todavía no tiene canciones.
        </p>
      ) : (
        <ol className="space-y-2">
          {chosen.map((item, index) => (
            <li
              key={item.songId}
              className="flex items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2.5"
            >
              <span className="w-5 text-right text-sm tabular-nums text-muted">{index + 1}</span>
              <Link href={`/library/${item.songId}`} className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{item.title}</span>
                {item.artist ? (
                  <span className="block truncate text-xs text-muted">{item.artist}</span>
                ) : null}
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
