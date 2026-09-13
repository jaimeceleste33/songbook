import Link from 'next/link'
import { notFound } from 'next/navigation'
import { removeSetlist } from '@/lib/actions/setlists'
import { getSetlistWithSongs, listSongs } from '@/lib/db/queries'
import { SetlistBuilder } from '@/components/setlist-builder'

export const dynamic = 'force-dynamic'

export default async function SetlistPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [list, library] = await Promise.all([getSetlistWithSongs(id), listSongs()])
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
          <form action={removeSetlist}>
            <input type="hidden" name="id" value={list.id} />
            <button
              type="submit"
              className="rounded-xl border border-border px-3 py-2.5 text-sm text-muted transition hover:border-red-500/50 hover:text-red-400"
            >
              Eliminar
            </button>
          </form>
        </div>
      </div>

      <SetlistBuilder setlistId={list.id} chosen={chosen} library={library} />
    </div>
  )
}
