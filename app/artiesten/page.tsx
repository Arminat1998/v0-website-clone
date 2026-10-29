"use client"
import { useState, useMemo, useEffect } from "react"
import { Header } from "@/components/header"
import { ArtiestFilters } from "@/components/artiest-filters"
import { ArtiestGrid } from "@/components/artiest-grid"
import { smartSearch, enhancedArtists } from "@/lib/smart-search"
import { generateFilterSuggestions, generateSearchInsights } from "@/lib/adaptive-filters"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
import type { FilterState } from "@/lib/conversational-ai"
import { useLanguage } from "@/contexts/language-context"
import { consumeListStateForReturn, updateListState, type ArtiestListState } from "@/lib/artiest-list-state"

export default function ArtiestenPage() {
  const { t } = useLanguage()

  const [searchQuery, setSearchQuery] = useState("")
  const [filters, setFilters] = useState<any>({})
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)
  const [urlParams, setUrlParams] = useState<any>({})
  const [conversationalFilters, setConversationalFilters] = useState<Partial<FilterState>>({})
  const [restored, setRestored] = useState<ArtiestListState | null | undefined>(undefined)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlSearchParams = new URLSearchParams(window.location.search)
      const saved = window.location.search ? null : consumeListStateForReturn()
      const params = {
        search: urlSearchParams.get("q") || urlSearchParams.get("search") || "",
        artistTypes: urlSearchParams.get("artistTypes")?.split(",").filter(Boolean) || [],
        genres: urlSearchParams.get("genres")?.split(",").filter(Boolean) || [],
        eventTypes: urlSearchParams.get("eventTypes")?.split(",").filter(Boolean) || [],
        date: urlSearchParams.get("date") || "",
        location: urlSearchParams.get("location") || "",
        mood: urlSearchParams.get("mood")?.split(",").filter(Boolean) || [],
        minPrice: urlSearchParams.get("minPrice") ? Number.parseInt(urlSearchParams.get("minPrice")!) : undefined,
        maxPrice: urlSearchParams.get("maxPrice") ? Number.parseInt(urlSearchParams.get("maxPrice")!) : undefined,
      }

      setUrlParams(params)
      if (saved) {
        setSearchQuery(saved.searchQuery ?? "")
      } else if (params.search) {
        setSearchQuery(params.search)
      }
      setRestored(saved)
    }
  }, [])

  useEffect(() => {
    if (restored === undefined) return
    updateListState({ searchQuery })
  }, [searchQuery, restored])

  useEffect(() => {
    if (restored === undefined) return

    const savedScrollY = restored?.scrollY
    const timers: ReturnType<typeof setTimeout>[] = []
    if (savedScrollY) {
      const apply = () => window.scrollTo(0, savedScrollY)
      apply()
      timers.push(setTimeout(apply, 50), setTimeout(apply, 200))
    }

    let frame = 0
    const onScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        updateListState({ scrollY: window.scrollY })
      })
    }
    window.addEventListener("scroll", onScroll, { passive: true })

    return () => {
      timers.forEach(clearTimeout)
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener("scroll", onScroll)
    }
  }, [restored])

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return enhancedArtists
    return smartSearch(searchQuery, enhancedArtists)
  }, [searchQuery])

  const filterSuggestions = useMemo(() => {
    const aiSuggestions = generateFilterSuggestions(searchQuery, enhancedArtists)

    console.log("[v0] Generated AI suggestions:", aiSuggestions)

    const priceRange =
      aiSuggestions.priceRange ||
      (urlParams.minPrice && urlParams.maxPrice ? [urlParams.minPrice, urlParams.maxPrice] : undefined)

    return {
      ...aiSuggestions,
      categories: conversationalFilters.categories || aiSuggestions.categories || urlParams.artistTypes || [],
      genres: conversationalFilters.genres || aiSuggestions.genres || urlParams.genres || [],
      eventTypes: conversationalFilters.eventTypes || aiSuggestions.eventTypes || urlParams.eventTypes || [],
      selectedDate: conversationalFilters.selectedDate || aiSuggestions.selectedDate || urlParams.date || "",
      city: conversationalFilters.city || aiSuggestions.city || urlParams.location || "",
      priceRange: conversationalFilters.priceRange || priceRange,
      duration: conversationalFilters.duration || aiSuggestions.duration,
    }
  }, [searchQuery, urlParams, conversationalFilters])

  const searchInsights = useMemo(() => {
    return generateSearchInsights(searchQuery, filterSuggestions)
  }, [searchQuery, filterSuggestions])

  const handleConversationalFilterUpdate = (newFilters: Partial<FilterState>) => {
    console.log("[v0] Conversational AI filter update:", newFilters)
    setConversationalFilters((prev) => ({ ...prev, ...newFilters }))
  }

  return (
    <div className="min-h-screen bg-background transition-colors">
      <Header />

      <div className="md:hidden bg-card border-b border-border px-4 py-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsMobileFilterOpen(true)}
          className="flex items-center gap-2"
        >
          <Menu className="w-4 h-4" />
          {t.filters}
        </Button>
      </div>

      {isMobileFilterOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsMobileFilterOpen(false)} />
      )}

      {restored !== undefined && (
      <div className="flex">
        <ArtiestFilters
          initialState={restored?.filters}
          searchQuery={searchQuery}
          filterSuggestions={filterSuggestions}
          onFiltersChange={setFilters}
          isMobileOpen={isMobileFilterOpen}
          onMobileClose={() => setIsMobileFilterOpen(false)}
        />
        <ArtiestGrid
          restoredState={restored}
          initialSearch={urlParams.search}
          initialFilters={{
            categories: urlParams.artistTypes,
            genres: urlParams.genres,
            eventTypes: urlParams.eventTypes,
            selectedDate: urlParams.date,
            city: urlParams.location,
            mood: urlParams.mood,
            priceRange: urlParams.minPrice && urlParams.maxPrice ? [urlParams.minPrice, urlParams.maxPrice] : undefined,
          }}
          onSearchChange={setSearchQuery}
          appliedFilters={filters}
          searchInsights={searchInsights}
          onFilterUpdate={handleConversationalFilterUpdate}
        />
      </div>
      )}
    </div>
  )
}
