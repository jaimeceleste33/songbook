'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requirePermission } from '@/lib/auth'
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
  const { bandId } = await requirePermission('content:edit')

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
    const saved = await q.updateSong(bandId, id, { title, artist, songKey, content })
    if (!saved) {
      return { error: 'Esta canción ya no está en la librería (¿la mandaron a la papelera?).' }
    }
  } else {
    await q.createSong(bandId, { title, artist, songKey, content })
  }

  // A singer named for the first time joins the roster and gets their colour.
  const roster = await q.getSingers(bandId)
  const merged = mergeSingers(roster, singersIn(content.blocks))
  if (merged.length > roster.length) await q.setSingers(bandId, merged)

  revalidatePath('/library')
  redirect('/library')
}

/** To the trash, never gone: an admin can restore it from /papelera. */
export async function removeSong(formData: FormData): Promise<void> {
  const { bandId } = await requirePermission('content:delete')
  const id = String(formData.get('id') ?? '')
  if (id) {
    await q.trashSong(bandId, id)
    revalidatePath('/', 'layout')
  }
  redirect('/library')
}
