import Link from 'next/link'
import { SongEditor } from '@/components/song-editor'

export const metadata = { title: 'Nueva canción · Songbook' }

export default function NewSongPage() {
  return (
    <div>
      <Link href="/library" className="mb-4 inline-block text-sm text-muted hover:text-text">
        ‹ Librería
      </Link>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Nueva canción</h1>
      <SongEditor />
    </div>
  )
}
