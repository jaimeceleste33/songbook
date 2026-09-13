import Link from 'next/link'
import { notFound } from 'next/navigation'
import { SongEditor } from '@/components/song-editor'
import { removeSong } from '@/lib/actions/songs'
import { getSong } from '@/lib/db/queries'

export const dynamic = 'force-dynamic'

export default async function EditSongPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const song = await getSong(id)
  if (!song) notFound()

  return (
    <div>
      <Link href="/library" className="mb-4 inline-block text-sm text-muted hover:text-text">
        ‹ Librería
      </Link>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{song.title}</h1>
        <form action={removeSong}>
          <input type="hidden" name="id" value={song.id} />
          <button
            type="submit"
            className="rounded-xl border border-border px-3 py-2 text-sm text-muted transition hover:border-red-500/50 hover:text-red-400"
          >
            Eliminar
          </button>
        </form>
      </div>

      <SongEditor
        song={{
          id: song.id,
          title: song.title,
          artist: song.artist,
          songKey: song.songKey,
          content: song.content,
        }}
      />
    </div>
  )
}
