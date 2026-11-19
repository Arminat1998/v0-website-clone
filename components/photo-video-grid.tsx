"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sparkles, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SmartSearchInput } from "@/components/smart-search-input"
import { PhotoVideoCard } from "@/components/photo-video-card"
import { PhotoVideoProfileModal } from "@/components/photo-video-profile-modal"
import { smartSearch, enhancedPhotographers } from "@/lib/smart-search"
import type { Photographer } from "@/lib/smart-search"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import type { FilterState } from "@/lib/conversational-ai"
import { useLanguage } from "@/contexts/language-context"
import { useToast } from "@/hooks/use-toast"

interface PhotoVideoGridProps {
  initialSearch?: string
  initialFilters?: any
  onSearchChange?: (query: string) => void
  appliedFilters?: any
  searchInsights?: string[]
  onFilterUpdate?: (filters: Partial<FilterState>) => void
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
  const [useAISearch, setUseAISearch] = useState(true)
  const [selectedProfessional, setSelectedProfessional] = useState<Photographer | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [urlFilters] = useState(initialFilters || {})
  const [shouldAutoStart, setShouldAutoStart] = useState(false)
  const [visitedIds, setVisitedIds] = useState<Set<number>>(new Set())
  const { t } = useLanguage()
  const { toast } = useToast()
  const router = useRouter()

  // Approved photographers and videographers who registered themselves, shown before the example profiles.
  const { data: liveData } = useSWR<{ photographers: Photographer[] }>(
    "/api/photographers/live",
    (url: string) => fetch(url).then((response) => response.json()),
    { revalidateOnFocus: true },
  )
  // The example profiles show right away; registered ones are added on top once they have loaded.
  const allPhotographers = useMemo(
    () => [...(liveData?.photographers ?? []), ...enhancedPhotographers],
    [liveData],
  )

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
      if (useAISearch) {
        professionals = smartSearch(searchTerm, professionals)
      } else {
        professionals = professionals.filter((prof) => {
          const searchLower = searchTerm.toLowerCase()
          return (
            prof.name.toLowerCase().includes(searchLower) ||
            prof.specialty.toLowerCase().includes(searchLower) ||
            prof.location.toLowerCase().includes(searchLower) ||
            prof.description?.toLowerCase().includes(searchLower)
          )
        })
      }
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
  }, [allPhotographers, searchTerm, appliedFilters, urlFilters, useAISearch])

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
    // Registered professionals have their own page; the example profiles open in a window.
    if (professional.href) {
      router.push(professional.href)
      return
    }
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

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-4 p-3 bg-card rounded-lg border border-border">
          <div className="flex-1">
            <SmartSearchInput
              value={searchTerm}
              onChange={handleSearchChange}
              onFilterUpdate={handleFilterUpdate}
              placeholder={
                useAISearch
                  ? "Search for photographers, videographers, or services..."
                  : "Search by name, location, or specialty..."
              }
              autoStart={shouldAutoStart}
              onAutoStartComplete={() => setShouldAutoStart(false)}
            />
          </div>
        </div>

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
                {sortedProfessionals.length} professionals found for "{searchTerm}"
              </span>
              {useAISearch && sortedProfessionals.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  AI Matching Active
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
        {sortedProfessionals.map((professional) => (
          <PhotoVideoCard
            key={professional.id}
            professional={professional}
            onClick={() => handleProfessionalClick(professional)}
            isVisited={visitedIds.has(professional.id)}
          />
        ))}
      </div>

      {sortedProfessionals.length === 0 && searchTerm && (
        <div className="text-center text-muted-foreground py-12">
          <Sparkles className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
          <p className="text-lg font-medium mb-2 text-foreground">
            {useAISearch ? "No perfect match found" : "No results found"}
          </p>
          <p className="text-sm mb-4">
            {useAISearch
              ? "Try other search terms or enable AI Smart Search for better results"
              : "Try other search terms or enable AI Smart Search for better results"}
          </p>
          {useAISearch && (
            <div className="flex flex-wrap justify-center gap-2">
              {["wedding photographer", "event videographer", "corporate events", "drone photography"].map(
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
          )}
        </div>
      )}

      {sortedProfessionals.length === 0 && !searchTerm && (
        <div className="text-center text-muted-foreground py-12">
          <p className="text-lg text-foreground">No professionals available</p>
          <p className="text-sm mt-2">Start searching or use filters to find the perfect professional</p>
        </div>
      )}

      <PhotoVideoProfileModal professional={selectedProfessional} open={isModalOpen} onOpenChange={handleModalClose} />
    </div>
  )
}
