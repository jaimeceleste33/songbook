# Songbook

Lyrics library and setlist player for a live singer, built for iPad use.

Load songs once, build a setlist for each service, then turn pages like a book
while performing. Full screen, large type, screen stays awake.

## How a song is stored

A song is **two separate things**:

- `blocks` — the unique pieces of text. A chorus is written **once**.
- `flow` — the order those blocks are sung, repetitions included.

So a song sung `Verse 1 → Chorus → Verse 2 → Chorus → Bridge → Chorus` stores
four blocks and a six-entry flow. Both live in one JSONB column on `songs`:
a song is always read and written whole, so extra tables would buy nothing.

Lyrics are pasted with bracket headers, which the parser turns into blocks:

```
[Verso 1]
...

[Coro]
...
```

Writing `[Coro]` again with the same text is understood as a repeat, not a new
block. Writing it with *different* text creates a second block and warns —
nothing is silently dropped.

## Stack

- Next.js 16 (App Router, Turbopack) + React 19 + Tailwind 4
- Postgres on Neon via `@neondatabase/serverless` + Drizzle ORM
- `jose` for the signed session cookie, `@dnd-kit` for touch drag-and-drop
- Users, bands and roles in the same Postgres; passwords hashed with Node's scrypt

## Users, bands and roles

Every song, setlist and setting belongs to a **band**. People join a band
through a single-use invitation link, with one of three roles:

| | admin | editor | viewer |
|---|---|---|---|
| View and sing | ✓ | ✓ | ✓ |
| Create/edit songs and setlists | ✓ | ✓ | |
| Move to trash, restore | ✓ | | |
| Invite, remove, change roles | ✓ | | |

`src/lib/auth/permissions.ts` is the only place that maps roles to
permissions. Pages use it to hide buttons; server actions check it again with
`requirePermission()`, since a hidden button is not a permission check. Every
query in `src/lib/db/queries.ts` takes the band id as a required argument.

Nothing is hard-deleted from the app: "Eliminar" sets `deleted_at` and the
admin restores it from **Papelera**. Saving a song that loses a whole part or
more than 30% of its text asks first.

The links nobody inside the app can create come from a script:

```bash
pnpm admin:link --url https://<app>                        # admin invite for the only band
pnpm admin:link --url https://<app> --new-band "Name"      # a new band and its admin invite
pnpm admin:link --url https://<app> --reset person@x.com   # new-password link
```

## Local setup

```bash
pnpm install
cp .env.example .env.local     # then fill in the two values
pnpm db:migrate                # create the tables
pnpm dev
pnpm admin:link --url http://localhost:3000   # open the link to create your admin user
```

`SESSION_SECRET` must be long and random: `openssl rand -base64 32`.

## Deploying

1. Push this repo to the singer's GitHub account.
2. Import it in their Vercel account.
3. Add the **Neon** integration from the Vercel Marketplace. It creates its own
   connection-string variable; the app reads `DATABASE_URL`, `STORAGE_URL` or
   `POSTGRES_URL`, whichever is set, so leave the integration's variable alone
   instead of copying its value elsewhere — the provider rotates it.
4. Add `SESSION_SECRET` as an environment variable.
5. Run `pnpm db:migrate` against the production database to create tables.
6. Run `pnpm admin:link --url https://<app>` and open the link to create the
   band's admin.

The connection string must be the **pooled** endpoint (host ending in
`-pooler`). Serverless invocations are many and short-lived and will exhaust an
unpooled endpoint; `pnpm db:migrate` warns if it sees a non-pooled remote host.

On the iPad: open the deployed URL in Safari, Share → **Add to Home Screen**.

## Layout notes

`src/lib/perform/layout.ts` measures every block off-screen at candidate font
sizes and binary-searches the largest size that keeps a song on one page. If a
song cannot fit legibly it spills onto more pages, always cutting **between**
blocks — a verse is never split across a page turn.

The measuring node in `measureAll` and the rendered page in
`src/components/perform/song-page.tsx` must keep identical typography. If they
drift, measured heights stop matching and text overflows mid-service.

## Reference

`reference/example.html` is the original single-file prototype this replaced.
Kept for reference only; nothing imports it.
