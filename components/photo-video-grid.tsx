"use client"

import { useState, useMemo, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SmartSearchInput } from "@/components/smart-search-input"
import { PhotoVideoCard } from "@/components/photo-video-card"
import { ArtiestProfileModal } from "@/components/artiest-profile-modal"
import { smartSearch, enhancedPhotographers } from "@/lib/smart-search"
import type { Artist, Photographer } from "@/lib/smart-search"
import type { FilterState } from "@/lib/conversational-ai"
import { useLanguage } from "@/contexts/language-context"
import { LiveListError, ListSkeleton } from "@/components/list-status"
import { useLiveProfessionals } from "@/hooks/use-live-professionals"

interface PhotoVideoGridProps {
  initialSearch?: string
  initialFilters?: any
  onSearchChange?: (query: string) => void
  appliedFilters?: any
  searchInsights?: string[]
  onFilterUpdate?: (filters: Partial<FilterState>) => void
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
    category: professional.category,
    image: professional.image,
    banner: professional.banner,
    avatar: professional.avatar,
    // No sample DJ equipment: photographers only show the extras they listed.
    equipmentDetails: { packageItems: [], extraItems: professional.equipmentDetails?.extraItems ?? [] },
    kind: "photo-video",
  }
}

export function PhotoVideoGrid({
  initialSearch,
  initialFilters,
  onSearchChange,
  appliedFilters,
  searchInsights,
  onFilterUpdate,
}: PhotoVideoGridProps) {
  const [searchTerm, setSearchTerm] = useState(initialSearch || "")
  const [sortBy, setSortBy] = useState("") // Changed default sortBy from "relevance" to "" to match Artiesten page behavior
  const [selectedProfessional, setSelectedProfessional] = useState<Photographer | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [urlFilters] = useState(initialFilters || {})
  const [shouldAutoStart, setShouldAutoStart] = useState(false)
  const [visitedIds, setVisitedIds] = useState<Set<number>>(new Set())
  const { t, language } = useLanguage()
  const nl = language === "nl"

  // Approved photographers and videographers who registered themselves, shown before the example profiles.
  const { professionals: live, isLoading: liveLoading, failed, isRetrying, retry } = useLiveProfessionals("photo-video")
  // The list appears in one go: nothing is shown until the registered professionals have loaded too.
  const allPhotographers = useMemo(() => (liveLoading ? [] : [...live, ...enhancedPhotographers]), [live, liveLoading])

  useEffect(() => {
    if (initialSearch) {
      setSearchTerm(initialSearch)
      onSearchChange?.(initialSearch)
      setShouldAutoStart(true)
    }
  }, [initialSearch, onSearchChange])

  const handleSearchChange = (newSearchTerm: string) => {
    setSearchTerm(newSearchTerm)
    onSearchChange?.(newSearchTerm)
  }

  const handleFilterUpdate = (filters: Partial<FilterState>) => {
    onFilterUpdate?.(filters)
  }

  const filteredPhotographers = useMemo(() => {
    let professionals = allPhotographers

    if (searchTerm.trim()) {
      professionals = smartSearch(searchTerm, professionals)
    }

    const allFilters = { ...urlFilters, ...appliedFilters }

    if (allFilters.categories && allFilters.categories.length > 0) {
      professionals = professionals.filter((prof) =>
        allFilters.categories.some((category: string) => prof.category === category),
      )
    }

    if (allFilters.priceRange) {
      const [minPrice, maxPrice] = allFilters.priceRange
      professionals = professionals.filter((prof) => {
        const price = Number.parseInt(prof.price.replace("€", ""))
        return price >= minPrice && price <= maxPrice
      })
    }

    if (allFilters.city && allFilters.city.trim()) {
      professionals = professionals.filter((prof) =>
        prof.location.toLowerCase().includes(allFilters.city.toLowerCase()),
      )
    }

    if (allFilters.eventTypes && allFilters.eventTypes.length > 0) {
      professionals = professionals.filter((prof) =>
        allFilters.eventTypes.some((eventType: string) =>
          prof.eventTypes?.some((type) => type.toLowerCase().includes(eventType.toLowerCase())),
        ),
      )
    }

    if (allFilters.selectedDate) {
      professionals = professionals.filter((prof) => {
        if (prof.unavailableDates?.includes(allFilters.selectedDate)) {
          return false
        }
        if (prof.availableDates?.includes(allFilters.selectedDate)) {
          return true
        }
        return prof.available
      })
    }

    return professionals
  }, [allPhotographers, searchTerm, appliedFilters, urlFilters])

  const sortedProfessionals = useMemo(() => {
    const professionals = [...filteredPhotographers]

    switch (sortBy) {
      case "price-low":
        return professionals.sort(
          (a, b) => Number.parseInt(a.price.replace("€", "")) - Number.parseInt(b.price.replace("€", "")),
        )
      case "price-high":
        return professionals.sort(
          (a, b) => Number.parseInt(b.price.replace("€", "")) - Number.parseInt(a.price.replace("€", "")),
        )
      case "rating":
        return professionals.sort((a, b) => b.rating - a.rating)
      case "popularity":
        return professionals.sort((a, b) => b.reviews - a.reviews)
      case "availability":
        return professionals.sort((a, b) => (b.available ? 1 : 0) - (a.available ? 1 : 0))
      default:
        return professionals
    }
  }, [filteredPhotographers, sortBy])

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
    <div className="flex-1 p-4 md:p-6 bg-background">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">{t.bookYourPhotographer}</h1>
        </div>

        <div className="mb-4 flex flex-col items-stretch justify-between gap-3 rounded-lg border border-border bg-card p-3 sm:flex-row sm:items-start">
          <div className="flex-1">
            <SmartSearchInput
              value={searchTerm}
              onChange={handleSearchChange}
              onFilterUpdate={handleFilterUpdate}
              placeholder={
                nl
                  ? "Beschrijf je evenement of wat je zoekt in een fotograaf of videograaf..."
                  : "Describe your event or what you need from a photographer or videographer..."
              }
              autoStart={shouldAutoStart}
              onAutoStartComplete={() => setShouldAutoStart(false)}
              resultsId="photo-video-results"
            />
          </div>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="h-12 w-full sm:w-44" aria-label={t.sortBy}>
              <SelectValue placeholder={t.sortBy} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">{t.relevance}</SelectItem>
              <SelectItem value="price-low">{t.priceLow}</SelectItem>
              <SelectItem value="price-high">{t.priceHigh}</SelectItem>
              <SelectItem value="rating">{t.rating}</SelectItem>
              <SelectItem value="popularity">{t.popularity}</SelectItem>
              <SelectItem value="availability">{t.availability}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {searchTerm && (
          <div
            className="mb-4 rounded-lg border border-border bg-card p-3"
          >
            <div className="flex items-center gap-2 text-sm">
              <Sparkles className="h-4 w-4 text-red-500" aria-hidden />
              <span className="font-medium text-foreground">
                {sortedProfessionals.length} {t.artistsFound} "{searchTerm}"
              </span>
              {sortedProfessionals.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {t.aiMatchingActive}
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>

      {failed && <LiveListError onRetry={retry} retrying={isRetrying} />}
      {liveLoading && <ListSkeleton />}

      <div id="photo-video-results" className="scroll-mt-24 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5">
        {sortedProfessionals.map((professional) => (
          <PhotoVideoCard
            key={professional.id}
            professional={professional}
            onClick={() => handleProfessionalClick(professional)}
            isVisited={visitedIds.has(professional.id)}
          />
        ))}
      </div>

      {!liveLoading && sortedProfessionals.length === 0 && searchTerm && (
        <div className="text-center text-muted-foreground py-12">
          <Sparkles className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
          <p className="text-lg font-medium mb-2 text-foreground">
            {t.noPerfectMatch}
          </p>
          <p className="text-sm mb-4">
            {t.tryOtherSearchTermsAI}
          </p>
<div className="flex flex-wrap justify-center gap-2">
            {(nl ? ["bruiloft fotograaf", "event videograaf", "zakelijk evenement", "drone opnames"] : ["wedding photographer", "event videographer", "corporate events", "drone photography"]).map(
              (suggestion) => (
                <Button
                  key={suggestion}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSearchChange(suggestion)}
                  className="text-xs"
                >
                  {suggestion}
                </Button>
              ),
            )}
          </div>
        </div>
      )}

      {!liveLoading && sortedProfessionals.length === 0 && !searchTerm && (
        <div className="text-center text-muted-foreground py-12">
          <p className="text-lg text-foreground">No professionals available</p>
          <p className="text-sm mt-2">Start searching or use filters to find the perfect professional</p>
        </div>
      )}

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
