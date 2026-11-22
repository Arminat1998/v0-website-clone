"use client"

import { useState, useMemo, useEffect } from "react"
import { tagKey } from "@/lib/profile-options"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SmartSearchInput } from "@/components/smart-search-input"
import { ArtiestCard } from "@/components/artiest-card"
import { ArtiestProfileModal } from "@/components/artiest-profile-modal"
import { smartSearch, enhancedArtists } from "@/lib/smart-search"
import type { Artist } from "@/lib/smart-search"
import type { FilterState } from "@/lib/conversational-ai"
import { LiveListError, ListSkeleton } from "@/components/list-status"
import { useLiveProfessionals } from "@/hooks/use-live-professionals"
import { useLanguage } from "@/contexts/language-context"
import { updateListState, getViewedArtistIds, markArtistViewed, type ArtiestListState } from "@/lib/artiest-list-state"

interface ArtiestGridProps {
  restoredState?: ArtiestListState | null
  initialSearch?: string
  initialFilters?: any
  onSearchChange?: (query: string) => void
  appliedFilters?: any
  searchInsights?: string[]
  onFilterUpdate?: (filters: Partial<FilterState>) => void
}

export function ArtiestGrid({
  restoredState,
  initialSearch,
  initialFilters,
  onSearchChange,
  appliedFilters,
  searchInsights,
  onFilterUpdate,
}: ArtiestGridProps) {
  const [searchTerm, setSearchTerm] = useState(restoredState?.searchQuery ?? initialSearch ?? "")
  const [sortBy, setSortBy] = useState(restoredState?.sortBy ?? "")
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [urlFilters] = useState(initialFilters || {})
  const [shouldAutoStart, setShouldAutoStart] = useState(false)
  const [visitedArtistIds, setVisitedArtistIds] = useState<Set<number>>(new Set())
  const { t, language } = useLanguage()

  useEffect(() => {
    updateListState({ sortBy })
  }, [sortBy])

  useEffect(() => {
    setVisitedArtistIds((prev) => new Set([...prev, ...getViewedArtistIds()]))
  }, [])

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

  const handleConversationFilterUpdate = (filters: Partial<FilterState>) => {
    onFilterUpdate?.(filters)
  }

  const { professionals: liveArtists, isLoading: liveLoading, failed, isRetrying, retry } = useLiveProfessionals("artist")
  // The list appears in one go: nothing is shown until the registered artists have loaded too.
  const allArtists = useMemo(
    () => (liveLoading ? [] : [...liveArtists, ...enhancedArtists]),
    [liveArtists, liveLoading],
  )

  const filteredArtists = useMemo(() => {
    let artists = allArtists

    if (searchTerm.trim()) {
      artists = smartSearch(searchTerm, artists)
    }

    const allFilters = { ...urlFilters, ...appliedFilters }

    if (allFilters.categories && allFilters.categories.length > 0) {
      artists = artists.filter((artist) =>
        allFilters.categories.some((category: string) => artist.category === category),
      )
    }

    if (allFilters.priceRange) {
      const [minPrice, maxPrice] = allFilters.priceRange
      artists = artists.filter((artist) => {
        const price = Number.parseInt(artist.price.replace("€", ""))
        return price >= minPrice && price <= maxPrice
      })
    }

    if (allFilters.city && allFilters.city.trim()) {
      artists = artists.filter((artist) => artist.location.toLowerCase().includes(allFilters.city.toLowerCase()))
    }

    if (
      (allFilters.genres && allFilters.genres.length > 0) ||
      (allFilters.musicGenres && allFilters.musicGenres.length > 0)
    ) {
      const genresToFilter = allFilters.genres || allFilters.musicGenres

      artists = artists.filter((artist) => {
        const artistStyles = (artist.musicStyles || []).map((s) => tagKey(s)).filter(Boolean)
        const artistSpecialty = artist.specialty.toLowerCase()

        return genresToFilter.some((genre: string) => {
          const genreLower = genre.toLowerCase()
          const genreKey = tagKey(genre)

          // "Hip-Hop", "hiphop" and "hip hop" are the same genre; a style also matches when one contains the other.
          const styleMatch = artistStyles.some((style) => style.includes(genreKey) || genreKey.includes(style))

          // Check if specialty contains the genre
          const specialtyMatch = artistSpecialty.includes(genreLower)


          return styleMatch || specialtyMatch
        })
      })

    }

    if (allFilters.eventTypes && allFilters.eventTypes.length > 0) {
      artists = artists.filter((artist) =>
        allFilters.eventTypes.some((eventType: string) =>
          artist.eventTypes?.some((type) => {
            const typeKey = tagKey(type)
            const filterKey = tagKey(eventType)
            return typeKey.includes(filterKey) || filterKey.includes(typeKey)
          }),
        ),
      )
    }

    if (allFilters.selectedDate) {
      artists = artists.filter((artist) => {
        if (artist.unavailableDates?.includes(allFilters.selectedDate)) {
          return false
        }
        if (artist.availableDates?.includes(allFilters.selectedDate)) {
          return true
        }
        return artist.available
      })
    }

    return artists
  }, [searchTerm, appliedFilters, urlFilters, allArtists])

  const sortedArtists = useMemo(() => {
    const artists = [...filteredArtists]

    switch (sortBy) {
      case "price-low":
        return artists.sort(
          (a, b) => Number.parseInt(a.price.replace("€", "")) - Number.parseInt(b.price.replace("€", "")),
        )
      case "price-high":
        return artists.sort(
          (a, b) => Number.parseInt(b.price.replace("€", "")) - Number.parseInt(a.price.replace("€", "")),
        )
      case "rating":
        return artists.sort((a, b) => b.rating - a.rating)
      case "popularity":
        return artists.sort((a, b) => b.reviews - a.reviews)
      case "availability":
        return artists.sort((a, b) => (b.available ? 1 : 0) - (a.available ? 1 : 0))
      default:
        return artists
    }
  }, [filteredArtists, sortBy])

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
    <div className="flex-1 p-4 md:p-6 bg-background">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">{t.bookYourArtist}</h1>
        </div>

        <div className="mb-4 flex flex-col items-stretch justify-between gap-3 rounded-lg border border-border bg-card p-3 sm:flex-row sm:items-start">
          <div className="flex-1">
            <SmartSearchInput
              value={searchTerm}
              onChange={handleSearchChange}
              onFilterUpdate={handleConversationFilterUpdate}
              placeholder={t.searchDescription}
              autoStart={shouldAutoStart}
              onAutoStartComplete={() => setShouldAutoStart(false)}
              resultsId="artist-results"
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
                {sortedArtists.length} {t.artistsFound} "{searchTerm}"
              </span>
              {sortedArtists.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {t.aiMatchingActive}
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>

      {failed && <LiveListError onRetry={retry} retrying={isRetrying} />}

      <div id="artist-results" className="scroll-mt-24 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5">
        {sortedArtists.map((artist) => (
          <ArtiestCard
            key={artist.id}
            artist={artist}
            onClick={() => handleArtistClick(artist)}
            isVisited={visitedArtistIds.has(artist.id)}
          />
        ))}
      </div>

      {!liveLoading && sortedArtists.length === 0 && searchTerm && (
        <div className="text-center text-muted-foreground py-12">
          <Sparkles className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
          <p className="text-lg font-medium mb-2 text-foreground">
            {t.noPerfectMatch}
          </p>
          <p className="text-sm mb-4">
            {t.tryOtherSearchTermsAI}
          </p>
<div className="flex flex-wrap justify-center gap-2">
            {(language === "nl" ? ["bruiloft DJ", "house party", "zakelijk evenement", "verjaardagsfeest"] : ["wedding DJ", "house party", "corporate event", "birthday party"]).map((suggestion) => (
              <Button
                key={suggestion}
                variant="outline"
                size="sm"
                onClick={() => handleSearchChange(suggestion)}
                className="text-xs"
              >
                {suggestion}
              </Button>
            ))}
          </div>
        </div>
      )}

      {liveLoading && <ListSkeleton />}

      {!liveLoading && sortedArtists.length === 0 && !searchTerm && (
        <div className="text-center text-muted-foreground py-12">
          <p className="text-lg text-foreground">{t.noResults}</p>
          <p className="text-sm mt-2">{t.noResultsSubtext}</p>
        </div>
      )}

      <ArtiestProfileModal artist={selectedArtist} open={isModalOpen} onOpenChange={handleModalClose} />
    </div>
  )
}
