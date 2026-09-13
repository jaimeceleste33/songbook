'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/auth'
import { ONBOARDING_KEY, createSetlist, addSongToSetlist, createSong, setSetting } from '@/lib/db/queries'
import { parseLyrics } from '@/lib/lyrics/parse'

/**
 * Placeholder lyrics written for the tour — not a real song. They exist so the
 * singer can open performance mode on the very first run and see how a page
 * turns before loading anything of their own.
 */
const DEMO_LYRICS = `[Verso 1]
Esta es una canción de ejemplo
para que veas cómo se ve la letra
cuando la pasás en el escenario.

[Coro]
El coro se escribe una sola vez
y después lo repetís
todas las veces que haga falta.

[Verso 2]
Cada parte lleva su color
para que la encuentres de un vistazo
sin tener que leerla entera.

[Puente]
Podés borrar esta canción
cuando cargues las tuyas.`

export async function finishOnboarding(formData: FormData): Promise<void> {
  await requireAuth()

  if (String(formData.get('withDemo') ?? '') === 'yes') {
    const parsed = parseLyrics(DEMO_LYRICS)
    const byLabel = new Map(parsed.blocks.map((b) => [b.label.toLowerCase(), b.id]))
    const pick = (label: string) => byLabel.get(label.toLowerCase())

    // Verse, chorus, verse, chorus, bridge, chorus — a shape he'll recognise.
    const order = ['verso 1', 'coro', 'verso 2', 'coro', 'puente', 'coro']
      .map(pick)
      .filter((id): id is string => Boolean(id))

    const songId = await createSong({
      title: 'Canción de ejemplo',
      artist: null,
      songKey: null,
      content: { blocks: parsed.blocks, flow: order.length > 0 ? order : parsed.flow },
    })

    const setlistId = await createSetlist('Repertorio de prueba', null)
    await addSongToSetlist(setlistId, songId)
  }

  await setSetting(ONBOARDING_KEY, true)
  revalidatePath('/', 'layout')
  redirect('/')
}

export async function skipOnboarding(): Promise<void> {
  await requireAuth()
  await setSetting(ONBOARDING_KEY, true)
  revalidatePath('/', 'layout')
  redirect('/')
}
