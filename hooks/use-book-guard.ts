"use client"

import type { MouseEvent } from "react"
import { authClient } from "@/lib/auth-client"

/**
 * Booking requires an account. Returns a guard for book buttons and links:
 * logged-in users continue, everyone else gets the login modal on the current
 * page and is sent to `href` after logging in.
 */
export function useBookGuard() {
  const { data: sessionData, isPending } = authClient.useSession()

  return (href: string, event?: MouseEvent) => {
    // While the session is still loading, let the booking page decide.
    if (sessionData?.user || isPending) return true
    event?.preventDefault()
    window.dispatchEvent(new CustomEvent("arsi:open-login", { detail: { next: href } }))
    return false
  }
}
