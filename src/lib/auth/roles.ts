/**
 * Kept apart from the schema so client components can list the roles without
 * pulling the database layer into the browser bundle.
 * Ordered from most to least powerful. See `./permissions.ts`.
 */
export const ROLES = ['admin', 'editor', 'viewer'] as const
export type Role = (typeof ROLES)[number]
