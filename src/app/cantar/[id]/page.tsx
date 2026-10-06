import { notFound } from 'next/navigation'
import { PerformView } from '@/components/perform/perform-view'
import { getMember, requireMember } from '@/lib/auth'
import { getSetlistWithSongs, getSingers } from '@/lib/db/queries'
import type { PerformSong } from '@/lib/perform/layout'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const member = await getMember()
  const list = member ? await getSetlistWithSongs(member.bandId, id) : null
  return { title: list ? `${list.name} · Songbook` : 'Songbook' }
}

export default async function PerformPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { bandId, showChords } = await requireMember()
  const { id } = await params
  const [list, singers] = await Promise.all([
    getSetlistWithSongs(bandId, id),
    getSingers(bandId),
  ])
  if (!list) notFound()

  const songs: PerformSong[] = list.items.map((item) => ({
    id: item.song.id,
    title: item.song.title,
    artist: item.song.artist,
    songKey: item.song.songKey,
    tempo: item.song.tempo,
    timeSignature: item.song.timeSignature,
    content: item.song.content,
  }))

  return (
    <PerformView
      setlistName={list.name}
      songs={songs}
      singers={singers}
      initialShowChords={showChords}
    />
  )
}
