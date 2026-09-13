'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/auth'
import * as q from '@/lib/db/queries'

export type SetlistFormState = { error?: string }

function parseDate(value: string): Date | null {
  if (!value.trim()) return null
  const date = new Date(`${value}T12:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

export async function createSetlist(
  _prev: SetlistFormState,
  formData: FormData,
): Promise<SetlistFormState> {
  await requireAuth()
  const name = String(formData.get('name') ?? '').trim()
  if (!name) return { error: 'Poné un nombre al repertorio.' }

  const id = await q.createSetlist(name, parseDate(String(formData.get('serviceDate') ?? '')))
  revalidatePath('/setlists')
  redirect(`/setlists/${id}`)
}

export async function renameSetlist(formData: FormData): Promise<void> {
  await requireAuth()
  const id = String(formData.get('id') ?? '')
  const name = String(formData.get('name') ?? '').trim()
  if (!id || !name) return
  await q.renameSetlist(id, name, parseDate(String(formData.get('serviceDate') ?? '')))
  revalidatePath(`/setlists/${id}`)
}

export async function removeSetlist(formData: FormData): Promise<void> {
  await requireAuth()
  const id = String(formData.get('id') ?? '')
  if (id) {
    await q.deleteSetlist(id)
    revalidatePath('/setlists')
  }
  redirect('/setlists')
}

export async function addSong(formData: FormData): Promise<void> {
  await requireAuth()
  const setlistId = String(formData.get('setlistId') ?? '')
  const songId = String(formData.get('songId') ?? '')
  if (!setlistId || !songId) return
  await q.addSongToSetlist(setlistId, songId)
  revalidatePath(`/setlists/${setlistId}`)
}

export async function removeItem(formData: FormData): Promise<void> {
  await requireAuth()
  const setlistId = String(formData.get('setlistId') ?? '')
  const itemId = String(formData.get('itemId') ?? '')
  if (!setlistId || !itemId) return
  await q.removeSetlistItem(setlistId, itemId)
  revalidatePath(`/setlists/${setlistId}`)
}

/** Called by the drag-and-drop list after a reorder. */
export async function reorderSetlist(setlistId: string, songIds: string[]): Promise<void> {
  await requireAuth()
  await q.setSetlistSongs(setlistId, songIds)
  revalidatePath(`/setlists/${setlistId}`)
}
