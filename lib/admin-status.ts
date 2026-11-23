import type { SubmissionStatus } from "@/contexts/admin-submissions-context"

// Tailwind classes for status pills, using colored /10 backgrounds like the rest of the app
export const statusClasses: Record<SubmissionStatus, string> = {
  nieuw: "bg-blue-500/10 text-blue-800 dark:text-blue-400 border-blue-500/20",
  "in-beoordeling": "bg-amber-500/10 text-amber-800 dark:text-amber-400 border-amber-500/20",
  "wacht-op-aanvulling": "bg-orange-500/10 text-orange-800 dark:text-orange-400 border-orange-500/20",
  goedgekeurd: "bg-green-500/10 text-green-800 dark:text-green-400 border-green-500/20",
  afgewezen: "bg-red-500/10 text-red-800 dark:text-red-400 border-red-500/20",
}

export function formatDate(iso: string, locale = "nl-NL"): string {
  try {
    return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Amsterdam" }).format(new Date(iso))
  } catch {
    return iso
  }
}

export function formatDateTime(iso: string, locale = "nl-NL"): string {
  try {
    return new Intl.DateTimeFormat(locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Amsterdam",
    }).format(new Date(iso))
  } catch {
    return iso
  }
}
