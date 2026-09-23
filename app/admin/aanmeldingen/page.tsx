"use client"

import { Suspense, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useSearchParams } from "next/navigation"
import { Search, SlidersHorizontal, X } from "lucide-react"
import {
  useAdmin,
  type SubmissionStatus,
  defaultFilters,
} from "@/contexts/admin-submissions-context"
import { statusLabels, statusClasses, formatDate } from "@/lib/admin-status"

const statusOptions: { value: SubmissionStatus | "alle"; label: string }[] = [
  { value: "alle", label: "Alle statussen" },
  { value: "nieuw", label: "Nieuw" },
  { value: "in-beoordeling", label: "In beoordeling" },
  { value: "wacht-op-aanvulling", label: "Wacht op aanvulling" },
  { value: "goedgekeurd", label: "Goedgekeurd" },
  { value: "afgewezen", label: "Afgewezen" },
]

function AanmeldingenContent() {
  const { submissions, filters, setFilters } = useAdmin()
  const searchParams = useSearchParams()

  // Sync status from the overview stat-card links (only on mount / when query changes)
  const queryStatus = searchParams.get("status")
  useEffect(() => {
    if (queryStatus && statusOptions.some((o) => o.value === queryStatus)) {
      setFilters({ ...filters, status: queryStatus as SubmissionStatus | "alle" })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryStatus])

  const disciplines = ["alle", ...Array.from(new Set(submissions.map((s) => s.discipline)))]
  const reviewers = ["alle", ...Array.from(new Set(submissions.map((s) => s.reviewer).filter(Boolean) as string[]))]

  const filtered = submissions.filter((s) => {
    const matchesSearch =
      !filters.search ||
      s.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      s.discipline.toLowerCase().includes(filters.search.toLowerCase()) ||
      s.city.toLowerCase().includes(filters.search.toLowerCase())
    const matchesStatus = filters.status === "alle" || s.status === filters.status
    const matchesDiscipline = filters.discipline === "alle" || s.discipline === filters.discipline
    const matchesReviewer =
      filters.reviewer === "alle" || (filters.reviewer === "geen" ? !s.reviewer : s.reviewer === filters.reviewer)
    return matchesSearch && matchesStatus && matchesDiscipline && matchesReviewer
  })

  const sorted = [...filtered].sort((a, b) => +new Date(b.submittedAt) - +new Date(a.submittedAt))

  const hasActiveFilters =
    filters.search !== "" ||
    filters.status !== "alle" ||
    filters.discipline !== "alle" ||
    filters.reviewer !== "alle"

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Aanmeldingen</h1>
        <p className="text-muted-foreground mt-1">
          {sorted.length} van {submissions.length} aanmeldingen
        </p>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-xl p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="Zoek op naam, discipline of stad..."
              className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-red-600/40"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <SlidersHorizontal className="w-4 h-4 hidden sm:block" />
            </div>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value as SubmissionStatus | "alle" })}
              className="px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-red-600/40"
            >
              {statusOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>

            <select
              value={filters.discipline}
              onChange={(e) => setFilters({ ...filters, discipline: e.target.value })}
              className="px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-red-600/40"
            >
              {disciplines.map((d) => (
                <option key={d} value={d}>
                  {d === "alle" ? "Alle disciplines" : d}
                </option>
              ))}
            </select>

            <select
              value={filters.reviewer}
              onChange={(e) => setFilters({ ...filters, reviewer: e.target.value })}
              className="px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-red-600/40"
            >
              <option value="alle">Alle behandelaars</option>
              <option value="geen">Niet toegewezen</option>
              {reviewers
                .filter((r) => r !== "alle")
                .map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
            </select>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={() => setFilters(defaultFilters)}
                className="inline-flex items-center gap-1.5 px-3 py-2.5 text-sm text-red-500 hover:text-red-400 transition-colors"
              >
                <X className="w-4 h-4" />
                Wissen
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table / list */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {sorted.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-foreground font-medium">Geen aanmeldingen gevonden</p>
            <p className="text-muted-foreground text-sm mt-1">Pas je filters aan om meer resultaten te zien.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {sorted.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/admin/aanmeldingen/${s.id}`}
                  className="flex items-center gap-4 p-4 hover:bg-accent transition-colors"
                >
                  <Image
                    src={s.photo || "/placeholder.svg"}
                    alt={s.name}
                    width={56}
                    height={56}
                    className="w-14 h-14 rounded-full object-cover flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground truncate">{s.name}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {s.discipline} &middot; {s.city}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {s.reviewer ? `Behandelaar: ${s.reviewer}` : "Nog niet toegewezen"}
                    </p>
                  </div>
                  <div className="hidden md:block text-sm text-muted-foreground flex-shrink-0 text-right">
                    <p>Aangemeld</p>
                    <p className="text-foreground">{formatDate(s.submittedAt)}</p>
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border flex-shrink-0 ${statusClasses[s.status]}`}
                  >
                    {statusLabels[s.status]}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default function AanmeldingenPage() {
  return (
    <Suspense fallback={<div className="p-8 text-muted-foreground">Laden...</div>}>
      <AanmeldingenContent />
    </Suspense>
  )
}
