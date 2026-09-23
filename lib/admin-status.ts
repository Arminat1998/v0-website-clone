import type { SubmissionStatus } from "@/contexts/admin-submissions-context"

export const statusLabels: Record<SubmissionStatus, string> = {
  nieuw: "Nieuw",
  "in-beoordeling": "In beoordeling",
  "wacht-op-aanvulling": "Wacht op aanvulling",
  goedgekeurd: "Goedgekeurd",
  afgewezen: "Afgewezen",
}

// Tailwind classes for status pills, using colored /10 backgrounds like the rest of the app
export const statusClasses: Record<SubmissionStatus, string> = {
  nieuw: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  "in-beoordeling": "bg-amber-500/10 text-amber-500 border-amber-500/20",
  "wacht-op-aanvulling": "bg-orange-500/10 text-orange-500 border-orange-500/20",
  goedgekeurd: "bg-green-500/10 text-green-500 border-green-500/20",
  afgewezen: "bg-red-500/10 text-red-500 border-red-500/20",
}

export function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso))
  } catch {
    return iso
  }
}

export function formatDateTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat("nl-NL", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso))
  } catch {
    return iso
  }
}
