import "server-only"

import { cache } from "react"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"

export const getSession = cache(async () => auth.api.getSession({ headers: await headers() }))

export type SessionUser = NonNullable<Awaited<ReturnType<typeof getSession>>>["user"]

export function isProfessional(user: SessionUser) {
  return user.role === "professional"
}

/** For pages: send visitors without a session to the home page and open the login modal. */
export async function requireUser(redirectTo = "/?login=1") {
  const session = await getSession()
  if (!session?.user) redirect(redirectTo)
  return session.user
}

/** For pages: only professionals may open the professional dashboard. */
export async function requireProfessionalUser() {
  const user = await requireUser()
  if (!isProfessional(user)) redirect("/mijn-boekingen")
  return user
}
