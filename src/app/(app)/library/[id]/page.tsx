import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ConfirmAction } from '@/components/confirm-action'
import { SongEditor } from '@/components/song-editor'
import { SongPreview } from '@/components/song-preview'
import { removeSong } from '@/lib/actions/songs'
import { requireMember } from '@/lib/auth'
import { can } from '@/lib/auth/permissions'
import { getSingers, getSong } from '@/lib/db/queries'
import { mergeSingers, singersIn } from '@/lib/lyrics/voices'

export const dynamic = 'force-dynamic'

export default async function EditSongPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { bandId, role } = await requireMember()
  const [song, singers] = await Promise.all([getSong(bandId, id), getSingers(bandId)])
  if (!song) notFound()

  return (
    <div>
      <Link href="/library" className="mb-4 inline-block text-sm text-muted hover:text-text">
        ‹ Librería
      </Link>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{song.title}</h1>
          {!can(role, 'content:edit') && song.artist ? (
            <p className="text-sm text-muted">{song.artist}</p>
          ) : null}
        </div>
        {can(role, 'content:delete') ? (
          <ConfirmAction
            action={removeSong}
            fields={{ id: song.id }}
            label="Eliminar"
            title={`¿Mandar «${song.title}» a la papelera?`}
            confirmLabel="Mandar a la papelera"
          >
            <p>Deja de aparecer en la librería y en los repertorios donde está.</p>
            <p>Si fue sin querer, la recuperás desde Papelera y vuelve a todos esos repertorios.</p>
          </ConfirmAction>
        ) : null}
      </div>

      {can(role, 'content:edit') ? (
        <SongEditor
          song={{
            id: song.id,
            title: song.title,
            artist: song.artist,
            songKey: song.songKey,
            tempo: song.tempo,
            timeSignature: song.timeSignature,
            content: song.content,
          }}
          singers={singers}
        />
      ) : (
        <SongPreview
          content={song.content}
          roster={mergeSingers(singers, singersIn(song.content.blocks))}
        />
      )}
    </div>
  )
}
