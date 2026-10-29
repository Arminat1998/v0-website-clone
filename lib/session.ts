import "server-only"

import { cache } from "react"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { getRestriction } from "@/lib/moderation"

/** Banned or suspended accounts are treated as signed out everywhere on the platform. */
export const getSession = cache(async () => {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return session
  return getRestriction(session.user) ? null : session
})

export type SessionUser = NonNullable<Awaited<ReturnType<typeof getSession>>>["user"]

export function isProfessional(user: SessionUser) {
  return user.role === "professional"
}

export function isAdmin(user: SessionUser) {
  return user.role === "admin"
}

/** For admin pages and actions: only accounts with the admin role get through. */
export async function requireAdmin() {
  const user = await requireUser("/?login=1")
  if (!isAdmin(user)) redirect("/")
  return user
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
