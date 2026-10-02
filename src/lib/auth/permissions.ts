import type { Role } from '@/lib/auth/roles'

/**
 * The single place that says who may do what. Pages ask it to decide which
 * buttons to show; server actions ask it again before touching data, because
 * a hidden button is not a permission check.
 */
export type Permission =
  /** Create and edit songs and setlists, reorder, add or take songs out of a setlist. */
  | 'content:edit'
  /** Move songs and setlists to the trash, and restore them from it. */
  | 'content:delete'
  /** Invite, remove and change the role of members; rename the band. */
  | 'band:manage'

const GRANTS: Record<Role, readonly Permission[]> = {
  admin: ['content:edit', 'content:delete', 'band:manage'],
  editor: ['content:edit'],
  viewer: [],
}

export function can(role: Role, permission: Permission): boolean {
  return GRANTS[role].includes(permission)
}

export const ROLE_LABEL: Record<Role, string> = {
  admin: 'Admin',
  editor: 'Edita',
  viewer: 'Solo ve',
}

export const ROLE_DESCRIPTION: Record<Role, string> = {
  admin: 'Hace todo: edita, manda a la papelera y maneja quién entra.',
  editor: 'Carga y edita canciones y repertorios. No puede borrar.',
  viewer: 'Ve las canciones y canta. No cambia nada.',
}
