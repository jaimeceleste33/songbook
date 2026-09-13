import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'
import type { SongContent } from '@/lib/lyrics/types'

/**
 * The library. `content` holds blocks + flow as JSONB rather than two extra
 * tables: a song is always read and written whole, we never query inside it,
 * and this keeps every save atomic.
 */
export const songs = pgTable(
  'songs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: text('title').notNull(),
    artist: text('artist'),
    songKey: text('song_key'),
    content: jsonb('content').$type<SongContent>().notNull(),
    tags: text('tags').array().notNull().default([]),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('songs_title_idx').on(t.title)],
)

/** A repertoire: the ordered set of songs for one service. */
export const setlists = pgTable('setlists', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  serviceDate: timestamp('service_date', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const setlistItems = pgTable(
  'setlist_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    setlistId: uuid('setlist_id')
      .notNull()
      .references(() => setlists.id, { onDelete: 'cascade' }),
    // Removing a song from the library removes it from every setlist too.
    songId: uuid('song_id')
      .notNull()
      .references(() => songs.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
    notes: text('notes'),
  },
  (t) => [
    index('setlist_items_setlist_idx').on(t.setlistId, t.position),
  ],
)

/**
 * Single-user key/value: onboarding completion, display preferences.
 * One row per key; there is no user table by design.
 */
export const appSettings = pgTable(
  'app_settings',
  {
    key: text('key').primaryKey(),
    value: jsonb('value').notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('app_settings_key_idx').on(t.key)],
)

export type SongRow = typeof songs.$inferSelect
export type NewSongRow = typeof songs.$inferInsert
export type SetlistRow = typeof setlists.$inferSelect
export type SetlistItemRow = typeof setlistItems.$inferSelect
