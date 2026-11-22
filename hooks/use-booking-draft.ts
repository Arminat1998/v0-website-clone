"use client"

import { useEffect, useRef } from "react"

/**
 * Keeps what was typed in the booking form in this browser tab, so a refresh does not lose it. Personal and billing
 * details are left out; those come from the account.
 */
export function useBookingDraft<T extends object>(professionalKey: string | null, draft: T, restore: (saved: Partial<T>) => void, done: boolean) {
  const key = professionalKey ? `booking-draft:${professionalKey}` : null
  const restored = useRef(false)
  const json = JSON.stringify(draft)

  useEffect(() => {
    if (!key || restored.current) return
    restored.current = true
    try {
      const saved = JSON.parse(sessionStorage.getItem(key) ?? "null")
      if (saved && typeof saved === "object") restore(saved)
    } catch {
      // No storage, or an unreadable draft: start empty.
    }
    // Only once per page: `restore` is a new function on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const first = useRef(true)
  useEffect(() => {
    // The first run still holds the empty form.
    if (first.current) {
      first.current = false
      return
    }
    if (!key) return
    try {
      if (done) sessionStorage.removeItem(key)
      else sessionStorage.setItem(key, json)
    } catch {
      // No storage available.
    }
  }, [key, json, done])
}
