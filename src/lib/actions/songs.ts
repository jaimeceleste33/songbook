'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requirePermission } from '@/lib/auth'
import * as q from '@/lib/db/queries'
import type { SongContent } from '@/lib/lyrics/types'
import { mergeSingers, sanitiseVoices, singersIn } from '@/lib/lyrics/voices'

export type SongFormState = { error?: string }

/** Empty is fine (unknown tempo); anything else must be a plausible BPM. */
function parseTempo(raw: string): number | null | undefined {
  if (raw === '') return null
  const bpm = Number(raw)
  return Number.isInteger(bpm) && bpm >= 20 && bpm <= 300 ? bpm : undefined
}

/** "4/4", "6/8", "12/8". Empty means not set. */
function parseTimeSignature(raw: string): string | null | undefined {
  const compact = raw.replace(/\s+/g, '')
  if (compact === '') return null
  return /^\d{1,2}\/(1|2|4|8|16)$/.test(compact) ? compact : undefined
}

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
  const tempo = parseTempo(String(formData.get('tempo') ?? '').trim())
  const timeSignature = parseTimeSignature(String(formData.get('timeSignature') ?? ''))
  const content = parseContent(String(formData.get('content') ?? ''))

  if (!title) return { error: 'Poné un título a la canción.' }
  if (tempo === undefined) return { error: 'El tempo va en número, entre 20 y 300 BPM.' }
  if (timeSignature === undefined) {
    return { error: 'El compás se escribe como 4/4 o 6/8.' }
  }
  if (!content) return { error: 'No pudimos leer la letra. Probá de nuevo.' }
  if (content.blocks.length === 0) return { error: 'Cargá al menos una parte con letra.' }
  if (content.flow.length === 0) {
    return { error: 'Armá el orden de la canción: agregá al menos una parte.' }
  }

  if (id) {
    const saved = await q.updateSong(bandId, id, {
      title,
      artist,
      songKey,
      tempo,
      timeSignature,
      content,
    })
    if (!saved) {
      return { error: 'Esta canción ya no está en la librería (¿la mandaron a la papelera?).' }
    }
  } else {
    await q.createSong(bandId, { title, artist, songKey, tempo, timeSignature, content })
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
