"use client"

import { useState, useMemo, useCallback } from "react"
import { SmartSearchInput } from "@/components/smart-search-input"
import { PhotoVideoCard } from "@/components/photo-video-card"
import { ArtiestProfileModal } from "@/components/artiest-profile-modal"
import { BudgetNote, LiveListError, ListSkeleton, NoResults, OtherListHint, ResultCount, SortSelect } from "@/components/list-status"
import { smartSearch, enhancedPhotographers } from "@/lib/smart-search"
import type { Artist, Photographer } from "@/lib/smart-search"
import { distanceToCity, filterProfessionals, sortProfessionals, type ListFilters } from "@/lib/list-filters"
import { isDemoProfessional } from "@/lib/demo-professionals"
import { useLiveProfessionals } from "@/hooks/use-live-professionals"
import type { ListSearch } from "@/hooks/use-list-search"
import { useLanguage } from "@/contexts/language-context"

interface PhotoVideoGridProps {
  search: ListSearch
  autoStart?: boolean
  onAutoStartComplete?: () => void
}

/** The artist profile view shows photographers too; specialisations take the place of music genres. */
function photographerAsArtist(professional: Photographer): Artist {
  const years = professional.experience?.match(/\d+/)?.[0]
  return {
    id: professional.id,
    name: professional.name,
    specialty: professional.specialty,
    location: professional.location,
    rating: professional.rating,
    reviews: professional.reviews,
    price: professional.price,
    available: professional.available,
    description: professional.description,
    eventTypes: professional.eventTypes,
    musicStyles: professional.serviceTypes,
    experience: years,
    availableDates: professional.availableDates,
    unavailableDates: professional.unavailableDates,
    minHours: professional.minHours,
    maxHours: professional.maxHours,
    rangeKm: professional.rangeKm,
    category: professional.category,
    image: professional.image,
    banner: professional.banner,
    avatar: professional.avatar,
    // No sample DJ equipment: photographers only show the extras they listed.
    equipmentDetails: { packageItems: [], extraItems: professional.equipmentDetails?.extraItems ?? [] },
    kind: "photo-video",
  }
}

export function PhotoVideoGrid({ search, autoStart, onAutoStartComplete }: PhotoVideoGridProps) {
  const [sortBy, setSortBy] = useState("")
  const [selectedProfessional, setSelectedProfessional] = useState<Photographer | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [visitedIds, setVisitedIds] = useState<Set<number>>(new Set())
  const nl = useLanguage().language === "nl"
  const { query, filters } = search

  // Approved photographers and videographers who registered themselves, shown before the example profiles.
  const { professionals: live, isLoading: liveLoading, failed, isRetrying, retry } = useLiveProfessionals("photo-video")
  // The list appears in one go: nothing is shown until the registered professionals have loaded too.
  const allPhotographers = useMemo(() => (liveLoading ? [] : [...live, ...enhancedPhotographers]), [live, liveLoading])

  const find = useCallback(
    (text: string, by: ListFilters) => smartSearch(text, filterProfessionals(allPhotographers, by), "photo-video"),
    [allPhotographers],
  )
  const count = useCallback((text: string, by: ListFilters) => find(text, by).length, [find])
  const sortedProfessionals = useMemo(() => sortProfessionals(find(query, filters), sortBy, isDemoProfessional), [find, query, filters, sortBy])
  const isEmpty = !liveLoading && sortedProfessionals.length === 0
  const handleProfessionalClick = (professional: Photographer) => {
    setSelectedProfessional(professional)
    setIsModalOpen(true)
  }

  const handleModalClose = (open: boolean) => {
    if (!open && selectedProfessional) {
      setVisitedIds((prev) => new Set(prev).add(selectedProfessional.id))
    }
    setIsModalOpen(open)
  }

  return (
    <div className="min-w-0 flex-1 p-4 md:p-6 bg-background">
      <div className="mb-8">
        <h1 className="mb-6 text-2xl md:text-3xl font-bold text-foreground">
          {nl ? "Boek je fotograaf of videograaf!" : "Book your photographer or videographer!"}
        </h1>

        <div className="mb-4 flex flex-col items-stretch justify-between gap-3 rounded-lg border border-border bg-card p-3 sm:flex-row sm:items-start">
          <div className="min-w-0 flex-1">
            <SmartSearchInput
              kind="photo-video"
              search={search}
              count={count}
              autoStart={autoStart && !liveLoading}
              onAutoStartComplete={onAutoStartComplete}
              resultsId="photo-video-results"
            />
          </div>
          <SortSelect value={sortBy} onChange={setSortBy} />
        </div>

        <OtherListHint kind="photo-video" query={query} />
        <BudgetNote search={search} />
        {!liveLoading && <ResultCount count={sortedProfessionals.length} query={query} />}
      </div>

      {failed && <LiveListError onRetry={retry} retrying={isRetrying} />}
      {liveLoading && <ListSkeleton />}

      <div id="photo-video-results" className="scroll-mt-24">
        {isEmpty && <NoResults search={search} count={count} kind="photo-video" suggestions={nl ? ["Fotograaf voor een bruiloft", "Videograaf voor een bedrijfsfeest", "Productlancering", "Drone"] : ["Photographer for a wedding", "Videographer for a corporate event", "Product launch", "Drone"]} />}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5">
          {sortedProfessionals.map((professional) => (
            <PhotoVideoCard
              key={professional.id}
              professional={professional}
              onClick={() => handleProfessionalClick(professional)}
              isVisited={visitedIds.has(professional.id)}
              distanceKm={distanceToCity(professional, filters.city)}
            />
          ))}
        </div>
      </div>

      {/* Same profile window as on the artists page, with photographer labels. */}
      <ArtiestProfileModal
        artist={selectedProfessional ? photographerAsArtist(selectedProfessional) : null}
        open={isModalOpen}
        onOpenChange={handleModalClose}
        fullPageHref={selectedProfessional?.href ?? null}
      />
    </div>
  )
}
