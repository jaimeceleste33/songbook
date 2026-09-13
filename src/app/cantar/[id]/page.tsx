import { notFound } from 'next/navigation'
import { PerformView } from '@/components/perform/perform-view'
import { requireAuth } from '@/lib/auth'
import { getSetlistWithSongs } from '@/lib/db/queries'
import type { PerformSong } from '@/lib/perform/layout'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const list = await getSetlistWithSongs(id)
  return { title: list ? `${list.name} · Songbook` : 'Songbook' }
}

export default async function PerformPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAuth()
  const { id } = await params
  const list = await getSetlistWithSongs(id)
  if (!list) notFound()

  const songs: PerformSong[] = list.items.map((item) => ({
    id: item.song.id,
    title: item.song.title,
    artist: item.song.artist,
    songKey: item.song.songKey,
    content: item.song.content,
  }))

  return <PerformView setlistName={list.name} songs={songs} />
}
