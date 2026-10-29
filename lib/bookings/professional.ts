import "server-only"

import { getSession, isProfessional } from "@/lib/session"

/** The professional id is the id of the signed-in professional account. */
export async function getProfessionalId() {
  const session = await getSession()
  if (!session?.user) throw new Error("Unauthorized")
  if (!isProfessional(session.user)) throw new Error("Forbidden")
  return session.user.id
}
