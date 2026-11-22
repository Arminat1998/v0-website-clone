"use client"

import Link from "next/link"
import { ArrowRight, RotateCcw, SearchX, Sparkles, TriangleAlert, Wallet, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useLanguage } from "@/contexts/language-context"
import { belongsToOtherList, filtersFromText } from "@/lib/adaptive-filters"
import { RESULT_FILTERS, SORT_OPTIONS, activeFilters, formatHours, withoutFilter, type FilterKey, type ListFilters, type ProfessionalKind } from "@/lib/list-filters"
import { formatEuro } from "@/lib/bookings/pricing"
import type { ListSearch } from "@/hooks/use-list-search"

/** Shown when the registered professionals could not be fetched, with a button to try again. */
export function LiveListError({ onRetry, retrying }: { onRetry: () => void; retrying: boolean }) {
  const nl = useLanguage().language !== "en"
  return (
    <div role="alert" className="mb-4 flex flex-col gap-3 rounded-lg border border-red-500/40 bg-red-500/10 p-4 sm:flex-row sm:items-center">
      <TriangleAlert className="size-5 shrink-0 text-red-600 dark:text-red-400" aria-hidden />
      <p className="flex-1 text-sm text-foreground">
        {nl
          ? "De professionals konden niet worden geladen. Controleer je verbinding en probeer het opnieuw."
          : "The professionals could not be loaded. Check your connection and try again."}
      </p>
      <Button type="button" variant="outline" className="h-11" onClick={onRetry} disabled={retrying}>
        <RotateCcw className={`size-4 ${retrying ? "animate-spin motion-reduce:animate-none" : ""}`} aria-hidden />
        {nl ? "Opnieuw proberen" : "Try again"}
      </Button>
    </div>
  )
}

/** Placeholder cards while the list loads. */
export function ListSkeleton() {
  const nl = useLanguage().language !== "en"
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5" aria-busy="true" aria-live="polite">
      <span className="sr-only">{nl ? "Professionals laden" : "Loading professionals"}</span>
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="h-[520px] animate-pulse motion-reduce:animate-none rounded-xl border border-border bg-card" />
      ))}
    </div>
  )
}

/**
 * Nothing matches: names every filter that is set, with a button to drop just that one and how many results that
 * gives. Suggestions are only offered when they lead somewhere.
 */
export function NoResults({
  kind,
  search,
  count,
  suggestions,
}: {
  kind: ProfessionalKind
  search: ListSearch
  /** The number of results for a search text with these filters. */
  count: (query: string, filters: ListFilters) => number
  suggestions: string[]
}) {
  const { t, language } = useLanguage()
  const nl = language === "nl"
  const { query, filters } = search
  const releases: { key: FilterKey | "text"; label: string; results: number; onClick: () => void }[] = activeFilters(filters, language)
    .filter(({ key }) => RESULT_FILTERS.includes(key))
    .map(({ key, label }) => ({ key, label, results: count(query, withoutFilter(filters, key)), onClick: () => search.remove(key) }))
  const withoutText = query.trim() ? count("", filters) : 0
  if (query.trim() && (withoutText > 0 || releases.length === 0)) {
    releases.push({ key: "text", label: `"${query.trim().slice(0, 40)}"`, results: withoutText, onClick: search.dropText })
  }
  const starts = suggestions.filter((text) => count(text, filtersFromText(text, kind)) > 0)
  const results = (n: number) => (nl ? `${n} ${n === 1 ? "resultaat" : "resultaten"}` : `${n} ${n === 1 ? "result" : "results"}`)

  return (
    <div className="mx-auto max-w-2xl rounded-xl border border-border bg-card px-4 py-8 text-center sm:px-6">
      <SearchX className="mx-auto mb-3 size-10 text-muted-foreground" aria-hidden />
      <p role="status" className="text-lg font-semibold text-foreground">
        {t.noPerfectMatch}
      </p>
      <p className="mx-auto mt-2 max-w-prose text-sm text-muted-foreground">
        {releases.length > 1 && releases.every((release) => release.results === 0)
          ? nl ? "Geen professional past bij deze combinatie. Laat meer dan één keuze los, of wis alles:" : "No professional fits this combination. Drop more than one choice, or clear all:"
          : releases.length > 1
          ? nl ? "Geen professional past bij deze combinatie. Laat een van de keuzes los:" : "No professional fits this combination. Drop one of the choices:"
          : releases.length === 1
            ? nl ? "Geen professional past bij deze keuze. Laat die los:" : "No professional fits this choice. Drop it:"
            : t.noResultsSubtext}
      </p>
      {releases.length > 0 && (
        <ul className="mt-5 flex flex-wrap justify-center gap-2">
          {releases.map(({ key, label, results: n, onClick }) => (
            <li key={key} className="max-w-full">
              <button
                type="button"
                onClick={onClick}
                className="inline-flex min-h-11 max-w-full items-center gap-2 rounded-full border border-border bg-background px-4 py-1.5 text-left text-sm text-foreground transition-colors hover:border-red-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
              >
                <X className="size-4 shrink-0 text-red-600 dark:text-red-400" aria-hidden />
                <span className="sr-only">{nl ? "Loslaten:" : "Drop:"}</span>
                <span className="min-w-0 [overflow-wrap:anywhere]">{label}</span>
                {n > 0 && <span className="shrink-0 text-muted-foreground">{results(n)}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
      {(releases.length > 0 || query) && (
        <Button type="button" className="mt-5 h-11 bg-red-700 px-6 text-white hover:bg-red-600" onClick={search.clearAll}>
          {nl ? "Alle filters wissen" : "Clear all filters"}
        </Button>
      )}
      {starts.length > 0 && (
        <div className="mt-6 border-t border-border pt-5">
          <p className="mb-3 text-sm text-muted-foreground">{nl ? "Of begin opnieuw met:" : "Or start again with:"}</p>
          <div className="flex flex-wrap justify-center gap-2">
            {starts.map((suggestion) => (
              <Button key={suggestion} type="button" variant="outline" className="h-11" onClick={() => search.search(suggestion)}>
                {suggestion}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/** A total budget does not filter, because rates are per hour. With a duration it is turned into an hourly amount. */
export function BudgetNote({ search }: { search: ListSearch }) {
  const { language } = useLanguage()
  const nl = language === "nl"
  const { budget, duration } = search.filters
  if (budget <= 0) return null
  const euro = (amount: number) => formatEuro(amount * 100, nl ? "nl-NL" : "en-GB")
  const hours = Number(duration)
  const perHour = hours > 0 ? Math.floor(budget / hours) : 0
  return (
    <div className="mb-4 flex flex-col gap-3 rounded-lg border border-border bg-card p-3 text-sm sm:flex-row sm:items-center">
      <Wallet className="hidden size-4 shrink-0 text-red-600 dark:text-red-400 sm:block" aria-hidden />
      <p className="flex-1 text-foreground">
        {perHour > 0
          ? nl
            ? `Budget ${euro(budget)} in totaal: bij ${formatHours(duration, true)} is dat ongeveer ${euro(perHour)} per uur, zonder apparatuur, reiskosten en btw.`
            : `Budget ${euro(budget)} in total: for ${formatHours(duration, false)} that is about ${euro(perHour)} per hour, without equipment, travel costs and VAT.`
          : nl
            ? `Budget ${euro(budget)} in totaal. De tarieven hier zijn per uur, dus hier filteren we niet op. Vul een duur in voor een schatting per uur.`
            : `Budget ${euro(budget)} in total. Rates here are per hour, so this does not filter. Enter a duration for an estimate per hour.`}
      </p>
      <div className="flex flex-wrap gap-2">
        {perHour > 0 && search.filters.priceRange[1] !== perHour && (
          <Button type="button" variant="outline" className="h-11" onClick={() => search.update({ priceRange: [0, perHour] })}>
            {nl ? `Toon tot ${euro(perHour)} per uur` : `Show up to ${euro(perHour)} per hour`}
          </Button>
        )}
        <Button type="button" variant="ghost" className="h-11" onClick={() => search.remove("budget")}>
          {nl ? "Budget wissen" : "Clear budget"}
        </Button>
      </div>
    </div>
  )
}

export function SortSelect({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const { t } = useLanguage()
  const labels = {
    relevance: t.relevance,
    "price-low": t.priceLow,
    "price-high": t.priceHigh,
    rating: t.rating,
    popularity: t.popularity,
    availability: t.availability,
  }
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full data-[size=default]:h-12 sm:w-44" aria-label={t.sortBy}>
        <SelectValue placeholder={t.sortBy} />
      </SelectTrigger>
      <SelectContent>
        {SORT_OPTIONS.map((option) => (
          <SelectItem key={option} value={option}>
            {labels[option]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

/** How many professionals match; read out when it changes. */
export function ResultCount({ count, query }: { count: number; query: string }) {
  const nl = useLanguage().language !== "en"
  const found = nl ? `${count} ${count === 1 ? "professional" : "professionals"} gevonden` : `${count} ${count === 1 ? "professional" : "professionals"} found`
  return (
    <p role="status" className="flex items-center gap-2 text-sm font-medium text-foreground">
      {query.trim() && <Sparkles className="size-4 shrink-0 text-red-600 dark:text-red-400" aria-hidden />}
      <span className="min-w-0 [overflow-wrap:anywhere]">
        {found}
        {query.trim() && ` ${nl ? "voor" : "for"} "${query.trim()}"`}
      </span>
    </p>
  )
}

/** Leads a search for a photographer from the artist list to the photo & video list, and the other way around. */
export function OtherListHint({ kind, query }: { kind: ProfessionalKind; query: string }) {
  const nl = useLanguage().language !== "en"
  if (!belongsToOtherList(query, kind)) return null
  const href = `${kind === "artist" ? "/photo-video" : "/artiesten"}?q=${encodeURIComponent(query.trim())}`
  return (
    <div className="mb-4 flex flex-col gap-3 rounded-lg border border-border bg-card p-3 text-sm sm:flex-row sm:items-center">
      <p className="flex-1 text-foreground">
        {kind === "artist"
          ? nl ? "Zoek je een fotograaf of videograaf? Die staan op een andere pagina." : "Looking for a photographer or videographer? They are on another page."
          : nl ? "Zoek je een artiest? Die staan op een andere pagina." : "Looking for an artist? They are on another page."}
      </p>
      <Button asChild variant="outline" className="h-11">
        <Link href={href}>
          {kind === "artist" ? (nl ? "Naar foto en video" : "Go to photo and video") : nl ? "Naar artiesten" : "Go to artists"}
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </Button>
    </div>
  )
}
