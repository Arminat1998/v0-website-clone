import "server-only"

import { getSession, isProfessional } from "@/lib/session"

/** The professional id is the id of the signed-in professional account. */
export async function getProfessionalId() {
  const session = await getSession()
  if (!session?.user) throw new Error("Unauthorized")
  if (!isProfessional(session.user)) throw new Error("Forbidden")
  return session.user.id
}

/** For API routes: the professional id, or null when the caller is not a signed-in professional. */
export async function professionalIdOrNull() {
  try {
    return await getProfessionalId()
  } catch {
    return null
  }
}
