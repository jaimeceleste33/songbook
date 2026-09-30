'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/auth'
import * as q from '@/lib/db/queries'
import type { SongContent } from '@/lib/lyrics/types'
import { mergeSingers, sanitiseVoices, singersIn } from '@/lib/lyrics/voices'

export type SongFormState = { error?: string }

/** Shape check: the payload arrives as JSON from the client editor. */
function parseContent(raw: string): SongContent | null {
  try {
    const parsed = JSON.parse(raw) as SongContent
    if (!Array.isArray(parsed.blocks) || !Array.isArray(parsed.flow)) return null
    const ids = new Set(parsed.blocks.map((b) => b.id))
    return {
      // `undefined` voices vanish in the JSON, so unvoiced parts stay as before.
      blocks: parsed.blocks.map((b) => ({ ...b, voices: sanitiseVoices(b) })),
      // Drop references to blocks the singer deleted.
      flow: parsed.flow.filter((id) => ids.has(id)),
    }
  } catch {
    return null
  }
}

export async function saveSong(
  _prev: SongFormState,
  formData: FormData,
): Promise<SongFormState> {
  await requireAuth()

  const id = String(formData.get('id') ?? '').trim()
  const title = String(formData.get('title') ?? '').trim()
  const artist = String(formData.get('artist') ?? '').trim() || null
  const songKey = String(formData.get('songKey') ?? '').trim() || null
  const content = parseContent(String(formData.get('content') ?? ''))

  if (!title) return { error: 'Poné un título a la canción.' }
  if (!content) return { error: 'No pudimos leer la letra. Probá de nuevo.' }
  if (content.blocks.length === 0) return { error: 'Cargá al menos una parte con letra.' }
  if (content.flow.length === 0) {
    return { error: 'Armá el orden de la canción: agregá al menos una parte.' }
  }

  if (id) {
    await q.updateSong(id, { title, artist, songKey, content })
  } else {
    await q.createSong({ title, artist, songKey, content })
  }

  // A singer named for the first time joins the roster and gets her colour.
  const roster = await q.getSingers()
  const merged = mergeSingers(roster, singersIn(content.blocks))
  if (merged.length > roster.length) await q.setSingers(merged)

  revalidatePath('/library')
  redirect('/library')
}

export async function removeSong(formData: FormData): Promise<void> {
  await requireAuth()
  const id = String(formData.get('id') ?? '')
  if (id) {
    await q.deleteSong(id)
    revalidatePath('/library')
  }
  redirect('/library')
}
