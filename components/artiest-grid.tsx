"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { SmartSearchInput } from "@/components/smart-search-input"
import { ArtiestCard } from "@/components/artiest-card"
import { ArtiestProfileModal } from "@/components/artiest-profile-modal"
import { BudgetNote, LiveListError, ListSkeleton, NoResults, OtherListHint, ResultCount, SortSelect } from "@/components/list-status"
import { smartSearch, enhancedArtists } from "@/lib/smart-search"
import type { Artist } from "@/lib/smart-search"
import { filterProfessionals, sortProfessionals, type ListFilters } from "@/lib/list-filters"
import { isDemoProfessional } from "@/lib/demo-professionals"
import { useLiveProfessionals } from "@/hooks/use-live-professionals"
import type { ListSearch } from "@/hooks/use-list-search"
import { useLanguage } from "@/contexts/language-context"
import { updateListState, getViewedArtistIds, markArtistViewed } from "@/lib/artiest-list-state"

interface ArtiestGridProps {
  search: ListSearch
  initialSort?: string
  autoStart?: boolean
  onAutoStartComplete?: () => void
}

export function ArtiestGrid({ search, initialSort, autoStart, onAutoStartComplete }: ArtiestGridProps) {
  const [sortBy, setSortBy] = useState(initialSort ?? "")
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [visitedArtistIds, setVisitedArtistIds] = useState<Set<number>>(new Set())
  const { t, language } = useLanguage()
  const { query, filters } = search

  useEffect(() => {
    updateListState({ sortBy })
  }, [sortBy])

  useEffect(() => {
    setVisitedArtistIds((prev) => new Set([...prev, ...getViewedArtistIds()]))
  }, [])

  const { professionals: liveArtists, isLoading: liveLoading, failed, isRetrying, retry } = useLiveProfessionals("artist")
  // The list appears in one go: nothing is shown until the registered artists have loaded too.
  const allArtists = useMemo(() => (liveLoading ? [] : [...liveArtists, ...enhancedArtists]), [liveArtists, liveLoading])

  const find = useCallback(
    (text: string, by: ListFilters) => smartSearch(text, filterProfessionals(allArtists, by), "artist"),
    [allArtists],
  )
  const count = useCallback((text: string, by: ListFilters) => find(text, by).length, [find])
  const sortedArtists = useMemo(() => sortProfessionals(find(query, filters), sortBy, isDemoProfessional), [find, query, filters, sortBy])
  const isEmpty = !liveLoading && sortedArtists.length === 0
  const handleArtistClick = (artist: Artist) => {
    setSelectedArtist(artist)
    setIsModalOpen(true)
  }

  const handleModalClose = (open: boolean) => {
    if (!open && selectedArtist) {
      setVisitedArtistIds((prev) => new Set(prev).add(selectedArtist.id))
      markArtistViewed(selectedArtist.id)
    }
    setIsModalOpen(open)
  }

  return (
    <div className="min-w-0 flex-1 p-4 md:p-6 bg-background">
      <div className="mb-8">
        <h1 className="mb-6 text-2xl md:text-3xl font-bold text-foreground">{t.bookYourArtist}</h1>

        <div className="mb-4 flex flex-col items-stretch justify-between gap-3 rounded-lg border border-border bg-card p-3 sm:flex-row sm:items-start">
          <div className="min-w-0 flex-1">
            <SmartSearchInput
              kind="artist"
              search={search}
              count={count}
              autoStart={autoStart && !liveLoading}
              onAutoStartComplete={onAutoStartComplete}
              resultsId="artist-results"
            />
          </div>
          <SortSelect value={sortBy} onChange={setSortBy} />
        </div>

        <OtherListHint kind="artist" query={query} />
        <BudgetNote search={search} />
        {!liveLoading && <ResultCount count={sortedArtists.length} query={query} />}
      </div>

      {failed && <LiveListError onRetry={retry} retrying={isRetrying} />}
      {liveLoading && <ListSkeleton />}

      <div id="artist-results" className="scroll-mt-24">
        {isEmpty && <NoResults search={search} count={count} kind="artist" suggestions={language === "nl" ? ["DJ voor een bruiloft", "DJ voor een verjaardag", "Band voor een bedrijfsfeest", "Achtergrondmuziek"] : ["DJ for a wedding", "DJ for a birthday", "Band for a corporate event", "Background music"]} />}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5">
          {sortedArtists.map((artist) => (
            <ArtiestCard
              key={artist.id}
              artist={artist}
              onClick={() => handleArtistClick(artist)}
              isVisited={visitedArtistIds.has(artist.id)}
            />
          ))}
        </div>
      </div>

      <ArtiestProfileModal artist={selectedArtist} open={isModalOpen} onOpenChange={handleModalClose} />
    </div>
  )
}
