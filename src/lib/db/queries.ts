import 'server-only'
import { and, asc, desc, eq, ilike, sql } from 'drizzle-orm'
import { db } from './index'
import { appSettings, setlistItems, setlists, songs } from './schema'
import type { SongContent } from '@/lib/lyrics/types'

/* ------------------------------- songs ---------------------------------- */

export async function listSongs(search?: string) {
  const where = search?.trim() ? ilike(songs.title, `%${search.trim()}%`) : undefined
  return db
    .select({
      id: songs.id,
      title: songs.title,
      artist: songs.artist,
      songKey: songs.songKey,
      tags: songs.tags,
      updatedAt: songs.updatedAt,
    })
    .from(songs)
    .where(where)
    .orderBy(asc(songs.title))
}

export async function getSong(id: string) {
  const [row] = await db.select().from(songs).where(eq(songs.id, id)).limit(1)
  return row ?? null
}

export async function createSong(input: {
  title: string
  artist?: string | null
  songKey?: string | null
  content: SongContent
}) {
  const [row] = await db
    .insert(songs)
    .values({
      title: input.title,
      artist: input.artist ?? null,
      songKey: input.songKey ?? null,
      content: input.content,
    })
    .returning({ id: songs.id })
  return row.id
}

export async function updateSong(
  id: string,
  input: {
    title: string
    artist?: string | null
    songKey?: string | null
    content: SongContent
  },
) {
  await db
    .update(songs)
    .set({
      title: input.title,
      artist: input.artist ?? null,
      songKey: input.songKey ?? null,
      content: input.content,
      updatedAt: new Date(),
    })
    .where(eq(songs.id, id))
}

export async function deleteSong(id: string) {
  await db.delete(songs).where(eq(songs.id, id))
}

/* ------------------------------ setlists -------------------------------- */

export async function listSetlists() {
  return db
    .select({
      id: setlists.id,
      name: setlists.name,
      serviceDate: setlists.serviceDate,
      updatedAt: setlists.updatedAt,
      songCount: sql<number>`(
        select count(*)::int from ${setlistItems}
        where ${setlistItems.setlistId} = ${setlists.id}
      )`,
    })
    .from(setlists)
    .orderBy(desc(setlists.serviceDate), desc(setlists.updatedAt))
}

/** A setlist with its songs already in singing order, content included. */
export async function getSetlistWithSongs(id: string) {
  const [list] = await db.select().from(setlists).where(eq(setlists.id, id)).limit(1)
  if (!list) return null

  const items = await db
    .select({
      itemId: setlistItems.id,
      position: setlistItems.position,
      notes: setlistItems.notes,
      song: songs,
    })
    .from(setlistItems)
    .innerJoin(songs, eq(setlistItems.songId, songs.id))
    .where(eq(setlistItems.setlistId, id))
    .orderBy(asc(setlistItems.position))

  return { ...list, items }
}

export async function createSetlist(name: string, serviceDate: Date | null) {
  const [row] = await db
    .insert(setlists)
    .values({ name, serviceDate })
    .returning({ id: setlists.id })
  return row.id
}

export async function renameSetlist(id: string, name: string, serviceDate: Date | null) {
  await db
    .update(setlists)
    .set({ name, serviceDate, updatedAt: new Date() })
    .where(eq(setlists.id, id))
}

export async function deleteSetlist(id: string) {
  await db.delete(setlists).where(eq(setlists.id, id))
}

/** Replaces the whole ordering in one transaction-ish sweep. */
export async function setSetlistSongs(setlistId: string, songIds: string[]) {
  await db.delete(setlistItems).where(eq(setlistItems.setlistId, setlistId))
  if (songIds.length > 0) {
    await db.insert(setlistItems).values(
      songIds.map((songId, index) => ({ setlistId, songId, position: index })),
    )
  }
  await db.update(setlists).set({ updatedAt: new Date() }).where(eq(setlists.id, setlistId))
}

export async function addSongToSetlist(setlistId: string, songId: string) {
  const [{ next }] = await db
    .select({ next: sql<number>`coalesce(max(${setlistItems.position}) + 1, 0)::int` })
    .from(setlistItems)
    .where(eq(setlistItems.setlistId, setlistId))

  await db.insert(setlistItems).values({ setlistId, songId, position: next })
  await db.update(setlists).set({ updatedAt: new Date() }).where(eq(setlists.id, setlistId))
}

export async function removeSetlistItem(setlistId: string, itemId: string) {
  await db
    .delete(setlistItems)
    .where(and(eq(setlistItems.id, itemId), eq(setlistItems.setlistId, setlistId)))
}

/* ------------------------------ settings -------------------------------- */

export async function getSetting<T>(key: string): Promise<T | null> {
  const [row] = await db
    .select({ value: appSettings.value })
    .from(appSettings)
    .where(eq(appSettings.key, key))
    .limit(1)
  return (row?.value as T) ?? null
}

export async function setSetting(key: string, value: unknown) {
  await db
    .insert(appSettings)
    .values({ key, value })
    .onConflictDoUpdate({
      target: appSettings.key,
      set: { value, updatedAt: new Date() },
    })
}

export const ONBOARDING_KEY = 'onboarding_completed'
