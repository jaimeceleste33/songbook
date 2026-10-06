import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'
import type { Role } from '@/lib/auth/roles'
import type { SongContent } from '@/lib/lyrics/types'

export { ROLES, type Role } from '@/lib/auth/roles'

/**
 * The tenant. Every song, setlist and setting belongs to exactly one band, so
 * a second band is a new row here rather than a new deployment.
 */
export const bands = pgTable('bands', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  /** Stored lowercased and trimmed; it is the login identifier. */
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  passwordHash: text('password_hash').notNull(),
  /**
   * Chords over the lyrics when singing. Per person, not per band: the
   * keyboard player wants them, most singers do not. Off unless turned on.
   */
  showChords: boolean('show_chords').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

/**
 * The role lives on the membership, not on the user, so one person can sing
 * in two bands with a different role in each.
 */
export const bandMembers = pgTable(
  'band_members',
  {
    bandId: uuid('band_id')
      .notNull()
      .references(() => bands.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: text('role').$type<Role>().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.bandId, t.userId] })],
)

/**
 * A single-use link that adds whoever opens it to a band with a given role.
 * Only the SHA-256 of the token is stored: a leaked database cannot be used to
 * join a band.
 */
export const invitations = pgTable('invitations', {
  id: uuid('id').primaryKey().defaultRandom(),
  bandId: uuid('band_id')
    .notNull()
    .references(() => bands.id, { onDelete: 'cascade' }),
  role: text('role').$type<Role>().notNull(),
  tokenHash: text('token_hash').notNull().unique(),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  acceptedAt: timestamp('accepted_at', { withTimezone: true }),
  acceptedBy: uuid('accepted_by').references(() => users.id, { onDelete: 'set null' }),
})

/** A single-use link an admin hands to a member who forgot their password. */
export const passwordResets = pgTable('password_resets', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true }),
})

/**
 * The library. `content` holds blocks + flow as JSONB rather than two extra
 * tables: a song is always read and written whole, we never query inside it,
 * and this keeps every save atomic.
 *
 * `deletedAt` set means the song is in the trash. Nothing is ever hard
 * deleted from the app, so a mistaken tap can always be undone.
 */
export const songs = pgTable(
  'songs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    // No cascade: removing a band must never silently take its songs with it.
    bandId: uuid('band_id')
      .notNull()
      .references(() => bands.id),
    title: text('title').notNull(),
    artist: text('artist'),
    songKey: text('song_key'),
    /** Beats per minute, for whoever counts the band in. */
    tempo: integer('tempo'),
    /** "4/4", "6/8". Free text checked on save. */
    timeSignature: text('time_signature'),
    content: jsonb('content').$type<SongContent>().notNull(),
    tags: text('tags').array().notNull().default([]),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => [
    index('songs_title_idx').on(t.title),
    index('songs_band_idx').on(t.bandId),
  ],
)

/** A repertoire: the ordered set of songs for one service. Trashed like songs. */
export const setlists = pgTable(
  'setlists',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    bandId: uuid('band_id')
      .notNull()
      .references(() => bands.id),
    name: text('name').notNull(),
    serviceDate: timestamp('service_date', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => [index('setlists_band_idx').on(t.bandId)],
)

export const setlistItems = pgTable(
  'setlist_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    setlistId: uuid('setlist_id')
      .notNull()
      .references(() => setlists.id, { onDelete: 'cascade' }),
    // Only reachable by a hard delete, which the app never does: a trashed
    // song keeps its place here and reappears in its setlists when restored.
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
 * Per-band key/value: onboarding completion, the singers roster. One row per
 * band and key.
 */
export const appSettings = pgTable(
  'app_settings',
  {
    bandId: uuid('band_id')
      .notNull()
      .references(() => bands.id, { onDelete: 'cascade' }),
    key: text('key').notNull(),
    value: jsonb('value').notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.bandId, t.key] })],
)

export type SongRow = typeof songs.$inferSelect
export type NewSongRow = typeof songs.$inferInsert
export type SetlistRow = typeof setlists.$inferSelect
export type SetlistItemRow = typeof setlistItems.$inferSelect
