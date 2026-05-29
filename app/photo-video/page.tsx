"use client"
import { useState, useMemo, useEffect } from "react"
import { Header } from "@/components/header"
import { PhotoVideoFilters } from "@/components/photo-video-filters"
import { PhotoVideoGrid } from "@/components/photo-video-grid"
import { smartSearch, enhancedPhotographers } from "@/lib/smart-search"
import { generateFilterSuggestions, generateSearchInsights } from "@/lib/adaptive-filters"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
import type { FilterState } from "@/lib/conversational-ai"
import { useLanguage } from "@/contexts/language-context"

export default function PhotoVideoPage() {
  const { t } = useLanguage()

  const [searchQuery, setSearchQuery] = useState("")
  const [filters, setFilters] = useState<any>({})
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)
  const [urlParams, setUrlParams] = useState<any>({})
  const [conversationalFilters, setConversationalFilters] = useState<Partial<FilterState>>({})

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlSearchParams = new URLSearchParams(window.location.search)
      const params = {
        search: urlSearchParams.get("q") || urlSearchParams.get("search") || "",
        serviceTypes: urlSearchParams.get("serviceTypes")?.split(",").filter(Boolean) || [],
        eventTypes: urlSearchParams.get("eventTypes")?.split(",").filter(Boolean) || [],
        date: urlSearchParams.get("date") || "",
        location: urlSearchParams.get("location") || "",
        minPrice: urlSearchParams.get("minPrice") ? Number.parseInt(urlSearchParams.get("minPrice")!) : undefined,
        maxPrice: urlSearchParams.get("maxPrice") ? Number.parseInt(urlSearchParams.get("maxPrice")!) : undefined,
      }

      setUrlParams(params)
      if (params.search) {
        setSearchQuery(params.search)
      }
    }
  }, [])

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return enhancedPhotographers
    return smartSearch(searchQuery, enhancedPhotographers)
  }, [searchQuery])

  const filterSuggestions = useMemo(() => {
    const aiSuggestions = generateFilterSuggestions(searchQuery, enhancedPhotographers)

    const priceRange =
      aiSuggestions.priceRange ||
      (urlParams.minPrice && urlParams.maxPrice ? [urlParams.minPrice, urlParams.maxPrice] : undefined)

    return {
      ...aiSuggestions,
      categories: conversationalFilters.categories || aiSuggestions.categories || urlParams.serviceTypes || [],
      eventTypes: conversationalFilters.eventTypes || aiSuggestions.eventTypes || urlParams.eventTypes || [],
      selectedDate: conversationalFilters.selectedDate || aiSuggestions.selectedDate || urlParams.date || "",
      city: conversationalFilters.city || aiSuggestions.city || urlParams.location || "",
      priceRange: conversationalFilters.priceRange || priceRange,
    }
  }, [searchQuery, urlParams, conversationalFilters])

  const searchInsights = useMemo(() => {
    return generateSearchInsights(searchQuery, filterSuggestions)
  }, [searchQuery, filterSuggestions])

  const handleConversationalFilterUpdate = (newFilters: Partial<FilterState>) => {
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

      <div className="flex">
        <PhotoVideoFilters
          searchQuery={searchQuery}
          filterSuggestions={filterSuggestions}
          onFiltersChange={setFilters}
          isMobileOpen={isMobileFilterOpen}
          onMobileClose={() => setIsMobileFilterOpen(false)}
        />
        <PhotoVideoGrid
          initialSearch={urlParams.search}
          initialFilters={{
            categories: urlParams.serviceTypes,
            eventTypes: urlParams.eventTypes,
            selectedDate: urlParams.date,
            city: urlParams.location,
            priceRange: urlParams.minPrice && urlParams.maxPrice ? [urlParams.minPrice, urlParams.maxPrice] : undefined,
          }}
          onSearchChange={setSearchQuery}
          appliedFilters={filters}
          searchInsights={searchInsights}
          onFilterUpdate={handleConversationalFilterUpdate}
        />
      </div>
    </div>
  )
}
