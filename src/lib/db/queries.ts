import 'server-only'
import { and, asc, desc, eq, ilike, inArray, isNotNull, isNull, sql } from 'drizzle-orm'
import { db } from './index'
import { appSettings, setlistItems, setlists, songs } from './schema'
import type { SongContent } from '@/lib/lyrics/types'

/*
 * Every function takes the band first and filters by it. That argument is
 * required on purpose: a query that forgets it would show one band's songs to
 * another, and TypeScript is what makes forgetting it impossible.
 *
 * Trashed rows (`deleted_at` set) are invisible everywhere except the trash.
 */

const liveSong = (bandId: string) => and(eq(songs.bandId, bandId), isNull(songs.deletedAt))
const liveSetlist = (bandId: string) =>
  and(eq(setlists.bandId, bandId), isNull(setlists.deletedAt))

/* ------------------------------- songs ---------------------------------- */

export async function listSongs(bandId: string, search?: string) {
  const term = search?.trim()
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
    .where(and(liveSong(bandId), term ? ilike(songs.title, `%${term}%`) : undefined))
    .orderBy(asc(songs.title))
}

export async function getSong(bandId: string, id: string) {
  const [row] = await db
    .select()
    .from(songs)
    .where(and(eq(songs.id, id), liveSong(bandId)))
    .limit(1)
  return row ?? null
}

export async function createSong(
  bandId: string,
  input: {
    title: string
    artist?: string | null
    songKey?: string | null
    tempo?: number | null
    timeSignature?: string | null
    content: SongContent
  },
) {
  const [row] = await db
    .insert(songs)
    .values({
      bandId,
      title: input.title,
      artist: input.artist ?? null,
      songKey: input.songKey ?? null,
      tempo: input.tempo ?? null,
      timeSignature: input.timeSignature ?? null,
      content: input.content,
    })
    .returning({ id: songs.id })
  return row.id
}

/** False when the song is gone (trashed meanwhile, or not this band's). */
export async function updateSong(
  bandId: string,
  id: string,
  input: {
    title: string
    artist?: string | null
    songKey?: string | null
    tempo?: number | null
    timeSignature?: string | null
    content: SongContent
  },
): Promise<boolean> {
  const rows = await db
    .update(songs)
    .set({
      title: input.title,
      artist: input.artist ?? null,
      songKey: input.songKey ?? null,
      tempo: input.tempo ?? null,
      timeSignature: input.timeSignature ?? null,
      content: input.content,
      updatedAt: new Date(),
    })
    .where(and(eq(songs.id, id), liveSong(bandId)))
    .returning({ id: songs.id })
  return rows.length > 0
}

/**
 * To the trash. Its setlist entries stay where they are, hidden, so restoring
 * the song puts it back in every setlist it was in.
 */
export async function trashSong(bandId: string, id: string) {
  await db
    .update(songs)
    .set({ deletedAt: new Date() })
    .where(and(eq(songs.id, id), liveSong(bandId)))
}

export async function restoreSong(bandId: string, id: string) {
  await db
    .update(songs)
    .set({ deletedAt: null })
    .where(and(eq(songs.id, id), eq(songs.bandId, bandId)))
}

/* ------------------------------ setlists -------------------------------- */

export async function listSetlists(bandId: string) {
  return db
    .select({
      id: setlists.id,
      name: setlists.name,
      serviceDate: setlists.serviceDate,
      updatedAt: setlists.updatedAt,
      // Spelled out with aliases: drizzle renders columns unqualified inside
      // `sql`, and a bare "id" here resolves to setlist_items.id, which made
      // this count 0 for every setlist.
      songCount: sql<number>`(
        select count(*)::int from "setlist_items" si
        inner join "songs" so on so."id" = si."song_id"
        where si."setlist_id" = "setlists"."id" and so."deleted_at" is null
      )`,
    })
    .from(setlists)
    .where(liveSetlist(bandId))
    .orderBy(desc(setlists.serviceDate), desc(setlists.updatedAt))
}

/** A setlist with its songs already in singing order, content included. */
export async function getSetlistWithSongs(bandId: string, id: string) {
  const [list] = await db
    .select()
    .from(setlists)
    .where(and(eq(setlists.id, id), liveSetlist(bandId)))
    .limit(1)
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
    .where(and(eq(setlistItems.setlistId, id), isNull(songs.deletedAt)))
    .orderBy(asc(setlistItems.position))

  return { ...list, items }
}

async function ownsSetlist(bandId: string, setlistId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: setlists.id })
    .from(setlists)
    .where(and(eq(setlists.id, setlistId), liveSetlist(bandId)))
    .limit(1)
  return Boolean(row)
}

export async function createSetlist(bandId: string, name: string, serviceDate: Date | null) {
  const [row] = await db
    .insert(setlists)
    .values({ bandId, name, serviceDate })
    .returning({ id: setlists.id })
  return row.id
}

export async function renameSetlist(
  bandId: string,
  id: string,
  name: string,
  serviceDate: Date | null,
) {
  await db
    .update(setlists)
    .set({ name, serviceDate, updatedAt: new Date() })
    .where(and(eq(setlists.id, id), liveSetlist(bandId)))
}

export async function trashSetlist(bandId: string, id: string) {
  await db
    .update(setlists)
    .set({ deletedAt: new Date() })
    .where(and(eq(setlists.id, id), liveSetlist(bandId)))
}

export async function restoreSetlist(bandId: string, id: string) {
  await db
    .update(setlists)
    .set({ deletedAt: null })
    .where(and(eq(setlists.id, id), eq(setlists.bandId, bandId)))
}

/**
 * Replaces the visible ordering. Entries for trashed songs are left alone so
 * a restored song comes back to its setlists; song ids from another band or
 * already trashed are ignored.
 */
export async function setSetlistSongs(bandId: string, setlistId: string, songIds: string[]) {
  if (!(await ownsSetlist(bandId, setlistId))) return

  await db.transaction(async (tx) => {
    const valid =
      songIds.length > 0
        ? new Set(
            (
              await tx
                .select({ id: songs.id })
                .from(songs)
                .where(and(inArray(songs.id, songIds), liveSong(bandId)))
            ).map((r) => r.id),
          )
        : new Set<string>()

    const trashed = tx
      .select({ id: songs.id })
      .from(songs)
      .where(isNotNull(songs.deletedAt))

    await tx
      .delete(setlistItems)
      .where(
        and(
          eq(setlistItems.setlistId, setlistId),
          sql`${setlistItems.songId} not in ${trashed}`,
        ),
      )

    const kept = songIds.filter((id) => valid.has(id))
    if (kept.length > 0) {
      await tx
        .insert(setlistItems)
        .values(kept.map((songId, index) => ({ setlistId, songId, position: index })))
    }
    await tx.update(setlists).set({ updatedAt: new Date() }).where(eq(setlists.id, setlistId))
  })
}

export async function addSongToSetlist(bandId: string, setlistId: string, songId: string) {
  if (!(await ownsSetlist(bandId, setlistId))) return
  if (!(await getSong(bandId, songId))) return

  const [{ next }] = await db
    .select({ next: sql<number>`coalesce(max(${setlistItems.position}) + 1, 0)::int` })
    .from(setlistItems)
    .where(eq(setlistItems.setlistId, setlistId))

  await db.insert(setlistItems).values({ setlistId, songId, position: next })
  await db.update(setlists).set({ updatedAt: new Date() }).where(eq(setlists.id, setlistId))
}

export async function removeSetlistItem(bandId: string, setlistId: string, itemId: string) {
  if (!(await ownsSetlist(bandId, setlistId))) return
  await db
    .delete(setlistItems)
    .where(and(eq(setlistItems.id, itemId), eq(setlistItems.setlistId, setlistId)))
}

/* -------------------------------- trash --------------------------------- */

export async function listTrash(bandId: string) {
  const [trashedSongs, trashedSetlists] = await Promise.all([
    db
      .select({
        id: songs.id,
        title: songs.title,
        artist: songs.artist,
        deletedAt: songs.deletedAt,
      })
      .from(songs)
      .where(and(eq(songs.bandId, bandId), isNotNull(songs.deletedAt)))
      .orderBy(desc(songs.deletedAt)),
    db
      .select({
        id: setlists.id,
        name: setlists.name,
        serviceDate: setlists.serviceDate,
        deletedAt: setlists.deletedAt,
      })
      .from(setlists)
      .where(and(eq(setlists.bandId, bandId), isNotNull(setlists.deletedAt)))
      .orderBy(desc(setlists.deletedAt)),
  ])
  return { songs: trashedSongs, setlists: trashedSetlists }
}

/* ------------------------------ settings -------------------------------- */

export async function getSetting<T>(bandId: string, key: string): Promise<T | null> {
  const [row] = await db
    .select({ value: appSettings.value })
    .from(appSettings)
    .where(and(eq(appSettings.bandId, bandId), eq(appSettings.key, key)))
    .limit(1)
  return (row?.value as T) ?? null
}

export async function setSetting(bandId: string, key: string, value: unknown) {
  await db
    .insert(appSettings)
    .values({ bandId, key, value })
    .onConflictDoUpdate({
      target: [appSettings.bandId, appSettings.key],
      set: { value, updatedAt: new Date() },
    })
}

export const ONBOARDING_KEY = 'onboarding_completed'

/**
 * Everyone who sings besides the lead, in the order they first appeared. The
 * order IS the colour assignment, so names are only ever appended.
 */
const SINGERS_KEY = 'singers'

export async function getSingers(bandId: string): Promise<string[]> {
  const value = await getSetting<unknown>(bandId, SINGERS_KEY)
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : []
}

export async function setSingers(bandId: string, singers: string[]) {
  await setSetting(bandId, SINGERS_KEY, singers)
}
