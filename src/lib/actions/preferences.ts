'use server'

import { requireMember } from '@/lib/auth'
import { setShowChords } from '@/lib/db/accounts'

/**
 * A personal setting, so any role may change it — but only their own: the
 * user comes from the session, never from the request.
 */
export async function saveShowChords(on: boolean): Promise<void> {
  const { userId } = await requireMember()
  await setShowChords(userId, on === true)
}
