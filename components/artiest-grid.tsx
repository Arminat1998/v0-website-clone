"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import useSWR from "swr"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sparkles, Zap, Music, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SmartSearchInput } from "@/components/smart-search-input"
import { ArtiestCard } from "@/components/artiest-card"
import { ArtiestProfileModal } from "@/components/artiest-profile-modal"
import { smartSearch, enhancedArtists } from "@/lib/smart-search"
import type { Artist } from "@/lib/smart-search"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import type { FilterState } from "@/lib/conversational-ai"
import { useLanguage } from "@/contexts/language-context"
import { useToast } from "@/hooks/use-toast"
import { updateListState, getViewedArtistIds, markArtistViewed, type ArtiestListState } from "@/lib/artiest-list-state"
import { analyzeAudioFile, type AudioAnalysisResult } from "@/lib/audio-analyzer"

const fetcher = (url: string) => fetch(url).then((response) => response.json())

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
  const [useAISearch, setUseAISearch] = useState(restoredState?.useAISearch ?? true)
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [urlFilters] = useState(initialFilters || {})
  const [shouldAutoStart, setShouldAutoStart] = useState(false)
  const [visitedArtistIds, setVisitedArtistIds] = useState<Set<number>>(new Set())
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [musicAnalysis, setMusicAnalysis] = useState<AudioAnalysisResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { t, language } = useLanguage()
  const { toast } = useToast()

  useEffect(() => {
    updateListState({ sortBy, useAISearch })
  }, [sortBy, useAISearch])

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

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      const genresParam = params.get("genres")
      if (genresParam && !musicAnalysis) {
        const genres = genresParam.split(",")
        setMusicAnalysis({
          genres,
          tempo: "Unknown",
          energy: "Medium",
          mood: "Upbeat",
          confidence: 0.7,
        })
      }
    }
  }, [])

  const handleSearchChange = (newSearchTerm: string) => {
    setSearchTerm(newSearchTerm)
    onSearchChange?.(newSearchTerm)
  }

  const handleConversationFilterUpdate = (filters: Partial<FilterState>) => {
    console.log("[v0] Conversational filter update:", filters)
    onFilterUpdate?.(filters)
  }

  const handleMp3Upload = async (file: File) => {
    if (!file.type.includes("audio") && !file.type.includes("mpeg")) {
      toast({
        title: t.invalidFile || "Ongeldig bestand",
        description: t.uploadAudioFile || "Upload alsjeblieft een audio bestand (MP3, WAV, M4A, etc.)",
        variant: "destructive",
      })
      return
    }

    setIsAnalyzing(true)

    try {
      const analysis = await analyzeAudioFile(file)

      setMusicAnalysis(analysis)

      toast({
        title: "Muziek geanalyseerd!",
        description: `Gedetecteerde genres: ${analysis.genres.join(", ")} | ${analysis.tempo} | Energie: ${analysis.energy}`,
      })

      onFilterUpdate?.({ genres: analysis.genres })
      setSearchTerm(`DJ voor ${analysis.mood.toLowerCase()} ${analysis.genres[0]} muziek`)
    } catch (error) {
      console.error("[v0] MP3 analysis error:", error)
      toast({
        title: "Analyse mislukt",
        description: "Er ging iets mis bij het analyseren van de muziek. Probeer het opnieuw.",
        variant: "destructive",
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleAnalyzeSong = () => {
    fileInputRef.current?.click()
  }

  const clearMusicFilter = () => {
    setMusicAnalysis(null)
    onFilterUpdate?.({ genres: [] })
    setSearchTerm("")
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href)
      url.searchParams.delete("genres")
      url.searchParams.delete("q")
      window.history.replaceState({}, "", url.toString())
    }
  }

  const { data: liveData, isLoading: liveLoading } = useSWR<{ artists: Artist[] }>("/api/artists/live", fetcher, {
    revalidateOnFocus: true,
  })
  // The list appears in one go: nothing is shown until the registered artists have loaded too.
  const allArtists = useMemo(
    () => (liveLoading ? [] : [...(liveData?.artists ?? []), ...enhancedArtists]),
    [liveData, liveLoading],
  )

  const filteredArtists = useMemo(() => {
    let artists = allArtists

    if (searchTerm.trim()) {
      if (useAISearch) {
        artists = smartSearch(searchTerm, artists)
      } else {
        artists = artists.filter((artist) => {
          const searchLower = searchTerm.toLowerCase()
          return (
            artist.name.toLowerCase().includes(searchLower) ||
            artist.specialty.toLowerCase().includes(searchLower) ||
            artist.location.toLowerCase().includes(searchLower) ||
            artist.description?.toLowerCase().includes(searchLower)
          )
        })
      }
    }

    const allFilters = { ...urlFilters, ...appliedFilters }

    if (musicAnalysis?.genres && musicAnalysis.genres.length > 0) {
      allFilters.genres = [...(allFilters.genres || []), ...musicAnalysis.genres]
    }

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
      console.log("[v0] Filtering by genres:", genresToFilter)

      artists = artists.filter((artist) => {
        const artistStyles = (artist.musicStyles || []).map((s) => s.toLowerCase())
        const artistSpecialty = artist.specialty.toLowerCase()

        return genresToFilter.some((genre: string) => {
          const genreLower = genre.toLowerCase()

          // Check if any music style contains the genre (partial match)
          const styleMatch = artistStyles.some((style) => style.includes(genreLower) || genreLower.includes(style))

          // Check if specialty contains the genre
          const specialtyMatch = artistSpecialty.includes(genreLower)

          console.log("[v0] Genre match check:", {
            artist: artist.name,
            genre: genre,
            artistStyles,
            styleMatch,
            specialtyMatch,
          })

          return styleMatch || specialtyMatch
        })
      })

      console.log("[v0] Artists after genre filter:", artists.length)
    }

    if (allFilters.eventTypes && allFilters.eventTypes.length > 0) {
      artists = artists.filter((artist) =>
        allFilters.eventTypes.some((eventType: string) =>
          artist.eventTypes?.some((type) => type.toLowerCase().includes(eventType.toLowerCase())),
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
  }, [searchTerm, appliedFilters, urlFilters, useAISearch, musicAnalysis, allArtists])

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

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-4 p-3 bg-card rounded-lg border border-border">
          <div className="flex-1">
            <SmartSearchInput
              value={searchTerm}
              onChange={handleSearchChange}
              onFilterUpdate={handleConversationFilterUpdate}
              placeholder={useAISearch ? t.searchDescription : "Zoek op naam, locatie, of specialiteit..."}
              autoStart={shouldAutoStart}
              onAutoStartComplete={() => setShouldAutoStart(false)}
              onMusicUpload={handleMp3Upload}
            />
          </div>
        </div>

        {isAnalyzing && (
          <div className="mb-4 p-3 rounded-lg border bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin" />
              <p className="text-sm text-blue-700 dark:text-blue-300">Muziek analyseren...</p>
            </div>
          </div>
        )}

        {musicAnalysis && (
          <div className="mb-4 p-3 rounded-lg border bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/40 dark:to-pink-950/40 border-purple-200 dark:border-purple-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <Music className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="font-medium text-purple-900 dark:text-purple-100">Muziek geanalyseerd</p>
                  <p className="text-sm text-purple-700 dark:text-purple-300">
                    Genres: {musicAnalysis.genres.join(", ")} | {musicAnalysis.tempo} | Energie: {musicAnalysis.energy}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearMusicFilter}
                className="text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900"
              >
                <X className="w-4 h-4 mr-1" />
                Wissen
              </Button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 mb-4 p-3 bg-card rounded-lg border border-border">
          <div className="flex items-center gap-2">
            <Zap className={`w-4 h-4 ${useAISearch ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground"}`} />
            <Label htmlFor="ai-search" className="cursor-pointer font-medium text-foreground">
              {t.aiSearch}
            </Label>
            <Switch id="ai-search" checked={useAISearch} onCheckedChange={setUseAISearch} />
          </div>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40">
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
            className={`mb-4 p-3 rounded-lg border ${useAISearch ? "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800" : "bg-card border-border"}`}
          >
            <div className="flex items-center gap-2 text-sm">
              {useAISearch && <Sparkles className="w-4 h-4 text-blue-500 dark:text-blue-400" />}
              <span className={`font-medium ${useAISearch ? "text-blue-700 dark:text-blue-300" : "text-foreground"}`}>
                {sortedArtists.length} {t.artistsFound} "{searchTerm}"
              </span>
              {useAISearch && sortedArtists.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {t.aiMatchingActive}
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
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
            {useAISearch ? t.noPerfectMatch : "Geen resultaten gevonden"}
          </p>
          <p className="text-sm mb-4">
            {useAISearch
              ? t.tryOtherSearchTermsAI
              : "Probeer andere zoektermen of schakel AI Slimme Zoeken in voor betere resultaten"}
          </p>
          {useAISearch && (
            <div className="flex flex-wrap justify-center gap-2">
              {["bruiloft DJ", "house party", "corporate evenement", "verjaardag feest"].map((suggestion) => (
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
          )}
        </div>
      )}

      {liveLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5" aria-busy="true" aria-live="polite">
          <span className="sr-only">{language === "nl" ? "Artiesten laden" : "Loading artists"}</span>
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="h-[520px] animate-pulse rounded-xl border border-border bg-card" />
          ))}
        </div>
      )}

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
