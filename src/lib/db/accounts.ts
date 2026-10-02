import 'server-only'
import { and, asc, eq, gt, isNull, sql } from 'drizzle-orm'
import { db } from './index'
import { bandMembers, bands, invitations, passwordResets, users, type Role } from './schema'
import {
  INVITATION_TTL_MS,
  PASSWORD_RESET_TTL_MS,
  hashToken,
  newToken,
} from '@/lib/auth/tokens'

export function normaliseEmail(email: string): string {
  return email.trim().toLowerCase()
}

/* -------------------------------- users --------------------------------- */

export async function findUserByEmail(email: string) {
  const [row] = await db
    .select()
    .from(users)
    .where(eq(users.email, normaliseEmail(email)))
    .limit(1)
  return row ?? null
}

/** Everything a request needs to know about who is asking, or null. */
export async function getMembership(userId: string, bandId: string) {
  const [row] = await db
    .select({
      userId: users.id,
      name: users.name,
      email: users.email,
      bandId: bands.id,
      bandName: bands.name,
      role: bandMembers.role,
    })
    .from(bandMembers)
    .innerJoin(users, eq(users.id, bandMembers.userId))
    .innerJoin(bands, eq(bands.id, bandMembers.bandId))
    .where(and(eq(bandMembers.userId, userId), eq(bandMembers.bandId, bandId)))
    .limit(1)
  return row ?? null
}

/** The band a user lands in after logging in: the first one they joined. */
export async function firstBandOf(userId: string): Promise<string | null> {
  const [row] = await db
    .select({ bandId: bandMembers.bandId })
    .from(bandMembers)
    .where(eq(bandMembers.userId, userId))
    .orderBy(asc(bandMembers.createdAt))
    .limit(1)
  return row?.bandId ?? null
}

/* -------------------------------- bands --------------------------------- */

export async function renameBand(bandId: string, name: string) {
  await db.update(bands).set({ name }).where(eq(bands.id, bandId))
}

export async function listMembers(bandId: string) {
  return db
    .select({
      userId: users.id,
      name: users.name,
      email: users.email,
      role: bandMembers.role,
      joinedAt: bandMembers.createdAt,
    })
    .from(bandMembers)
    .innerJoin(users, eq(users.id, bandMembers.userId))
    .where(eq(bandMembers.bandId, bandId))
    .orderBy(asc(bandMembers.createdAt))
}

async function adminCount(bandId: string): Promise<number> {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(bandMembers)
    .where(and(eq(bandMembers.bandId, bandId), eq(bandMembers.role, 'admin')))
  return count
}

/**
 * A band must always keep one admin, or nobody could restore from the trash
 * or let anyone else in.
 */
export type MemberChange = { ok: true } | { ok: false; reason: 'last-admin' | 'not-member' }

export async function setMemberRole(
  bandId: string,
  userId: string,
  role: Role,
): Promise<MemberChange> {
  const current = await getMembership(userId, bandId)
  if (!current) return { ok: false, reason: 'not-member' }
  if (current.role === 'admin' && role !== 'admin' && (await adminCount(bandId)) <= 1) {
    return { ok: false, reason: 'last-admin' }
  }
  await db
    .update(bandMembers)
    .set({ role })
    .where(and(eq(bandMembers.bandId, bandId), eq(bandMembers.userId, userId)))
  return { ok: true }
}

/** Takes the person out of the band. Their account and other bands are untouched. */
export async function removeMember(bandId: string, userId: string): Promise<MemberChange> {
  const current = await getMembership(userId, bandId)
  if (!current) return { ok: false, reason: 'not-member' }
  if (current.role === 'admin' && (await adminCount(bandId)) <= 1) {
    return { ok: false, reason: 'last-admin' }
  }
  await db
    .delete(bandMembers)
    .where(and(eq(bandMembers.bandId, bandId), eq(bandMembers.userId, userId)))
  return { ok: true }
}

/* ----------------------------- invitations ------------------------------ */

/** Returns the raw token, the only time it exists outside the link. */
export async function createInvitation(bandId: string, role: Role, createdBy: string | null) {
  const token = newToken()
  await db.insert(invitations).values({
    bandId,
    role,
    tokenHash: hashToken(token),
    createdBy,
    expiresAt: new Date(Date.now() + INVITATION_TTL_MS),
  })
  return token
}

export async function listPendingInvitations(bandId: string) {
  return db
    .select({
      id: invitations.id,
      role: invitations.role,
      createdAt: invitations.createdAt,
      expiresAt: invitations.expiresAt,
    })
    .from(invitations)
    .where(
      and(
        eq(invitations.bandId, bandId),
        isNull(invitations.acceptedAt),
        gt(invitations.expiresAt, new Date()),
      ),
    )
    .orderBy(asc(invitations.createdAt))
}

export async function revokeInvitation(bandId: string, id: string) {
  await db
    .delete(invitations)
    .where(
      and(eq(invitations.id, id), eq(invitations.bandId, bandId), isNull(invitations.acceptedAt)),
    )
}

/** The invitation behind a link, if it can still be used. */
export async function findOpenInvitation(token: string) {
  const [row] = await db
    .select({ role: invitations.role, bandId: bands.id, bandName: bands.name })
    .from(invitations)
    .innerJoin(bands, eq(bands.id, invitations.bandId))
    .where(
      and(
        eq(invitations.tokenHash, hashToken(token)),
        isNull(invitations.acceptedAt),
        gt(invitations.expiresAt, new Date()),
      ),
    )
    .limit(1)
  return row ?? null
}

export type AcceptInvitation =
  | { kind: 'new'; name: string; email: string; passwordHash: string }
  | { kind: 'existing'; userId: string }

/**
 * Uses the link up and adds the person to the band, all or nothing. The
 * conditional update is what makes a link single-use even if two people open
 * it at once: only one of them gets the row back.
 */
export async function acceptInvitation(
  token: string,
  who: AcceptInvitation,
): Promise<{ userId: string; bandId: string } | null> {
  return db.transaction(async (tx) => {
    const [invitation] = await tx
      .update(invitations)
      .set({ acceptedAt: new Date() })
      .where(
        and(
          eq(invitations.tokenHash, hashToken(token)),
          isNull(invitations.acceptedAt),
          gt(invitations.expiresAt, new Date()),
        ),
      )
      .returning({ id: invitations.id, bandId: invitations.bandId, role: invitations.role })
    if (!invitation) return null

    let userId: string
    if (who.kind === 'new') {
      const [created] = await tx
        .insert(users)
        .values({
          name: who.name,
          email: normaliseEmail(who.email),
          passwordHash: who.passwordHash,
        })
        .returning({ id: users.id })
      userId = created.id
    } else {
      userId = who.userId
    }

    // Someone already in the band keeps the role they have.
    await tx
      .insert(bandMembers)
      .values({ bandId: invitation.bandId, userId, role: invitation.role })
      .onConflictDoNothing()
    await tx
      .update(invitations)
      .set({ acceptedBy: userId })
      .where(eq(invitations.id, invitation.id))

    return { userId, bandId: invitation.bandId }
  })
}

/* --------------------------- password resets ---------------------------- */

/** Null when the user is not in this band: admins only reset their own people. */
export async function createPasswordReset(bandId: string, userId: string) {
  if (!(await getMembership(userId, bandId))) return null
  const token = newToken()
  await db.insert(passwordResets).values({
    userId,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
  })
  return token
}

export async function findOpenPasswordReset(token: string) {
  const [row] = await db
    .select({ name: users.name, email: users.email })
    .from(passwordResets)
    .innerJoin(users, eq(users.id, passwordResets.userId))
    .where(
      and(
        eq(passwordResets.tokenHash, hashToken(token)),
        isNull(passwordResets.usedAt),
        gt(passwordResets.expiresAt, new Date()),
      ),
    )
    .limit(1)
  return row ?? null
}

/** Single-use for the same reason as invitations. Returns the user, or null. */
export async function usePasswordReset(token: string, passwordHash: string) {
  return db.transaction(async (tx) => {
    const [reset] = await tx
      .update(passwordResets)
      .set({ usedAt: new Date() })
      .where(
        and(
          eq(passwordResets.tokenHash, hashToken(token)),
          isNull(passwordResets.usedAt),
          gt(passwordResets.expiresAt, new Date()),
        ),
      )
      .returning({ userId: passwordResets.userId })
    if (!reset) return null
    await tx.update(users).set({ passwordHash }).where(eq(users.id, reset.userId))
    return reset.userId
  })
}
