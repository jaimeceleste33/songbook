'use server'

import { revalidatePath } from 'next/cache'
import { requirePermission } from '@/lib/auth'
import * as q from '@/lib/db/queries'

export async function restoreSong(formData: FormData): Promise<void> {
  const { bandId } = await requirePermission('content:delete')
  const id = String(formData.get('id') ?? '')
  if (id) await q.restoreSong(bandId, id)
  revalidatePath('/', 'layout')
}

export async function restoreSetlist(formData: FormData): Promise<void> {
  const { bandId } = await requirePermission('content:delete')
  const id = String(formData.get('id') ?? '')
  if (id) await q.restoreSetlist(bandId, id)
  revalidatePath('/', 'layout')
}
