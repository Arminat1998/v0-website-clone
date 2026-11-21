"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Search, Sparkles } from "lucide-react"
import { SmartSearchInput } from "@/components/smart-search-input"
import type { FilterState } from "@/lib/conversational-ai"
import { useLanguage } from "@/contexts/language-context"

export function HeroSearch() {
  const [query, setQuery] = useState("")
  const [showSmartSearch, setShowSmartSearch] = useState(false)
  const [accumulatedFilters, setAccumulatedFilters] = useState<Partial<FilterState>>({})
  const router = useRouter()
  const { t } = useLanguage()

  const handleFilterUpdate = (filters: Partial<FilterState>) => {
    setAccumulatedFilters((prev) => ({ ...prev, ...filters }))
  }

  const navigateWithFilters = () => {
    const params = new URLSearchParams()

    if (accumulatedFilters.categories && accumulatedFilters.categories.length > 0) {
      params.set("artistTypes", accumulatedFilters.categories.join(","))
    }
    if (accumulatedFilters.genres && accumulatedFilters.genres.length > 0) {
      params.set("genres", accumulatedFilters.genres.join(","))
    }
    if (accumulatedFilters.eventTypes && accumulatedFilters.eventTypes.length > 0) {
      params.set("eventTypes", accumulatedFilters.eventTypes.join(","))
    }
    if (accumulatedFilters.selectedDate) {
      params.set("date", accumulatedFilters.selectedDate)
    }
    if (accumulatedFilters.city) {
      params.set("location", accumulatedFilters.city)
    }
    if (accumulatedFilters.priceRange) {
      params.set("minPrice", accumulatedFilters.priceRange[0].toString())
      params.set("maxPrice", accumulatedFilters.priceRange[1].toString())
    }
    if (accumulatedFilters.duration) {
      params.set("duration", accumulatedFilters.duration)
    }

    router.push(`/artiesten?${params.toString()}`)
  }

  const handleSearch = () => {
    if (query.trim()) {
      window.location.href = `/artiesten?q=${encodeURIComponent(query.trim())}`
    }
  }

  useEffect(() => {
    if (showSmartSearch && accumulatedFilters.city && accumulatedFilters.selectedDate) {
      const hasAllFilters =
        accumulatedFilters.categories &&
        accumulatedFilters.genres &&
        accumulatedFilters.eventTypes &&
        accumulatedFilters.duration &&
        accumulatedFilters.priceRange

      if (hasAllFilters) {
        setTimeout(() => {
          navigateWithFilters()
        }, 2000)
      }
    }
  }, [accumulatedFilters, showSmartSearch])

  if (showSmartSearch) {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 sm:px-0">
        <SmartSearchInput value={query} onChange={setQuery} onFilterUpdate={handleFilterUpdate} />
      </div>
    )
  }

  return (
    <div className="w-full max-w-2xl mx-auto relative px-4 sm:px-0">
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-xl sm:rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300" />
        <div className="relative bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-2xl border border-white/20 dark:border-zinc-700/20 overflow-hidden">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-0 p-3 sm:px-6 sm:py-4">
            <div className="flex items-center flex-1">
              <Search className="w-5 h-5 sm:w-6 sm:h-6 text-red-500 mr-3 sm:mr-4 flex-shrink-0" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSearch()
                  }
                }}
                placeholder={t.searchYourArtist}
                className="flex-1 text-base sm:text-lg text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 bg-transparent border-none outline-none"
              />
            </div>
            <button
              onClick={handleSearch}
              className="bg-red-700 hover:bg-red-600 text-white px-4 sm:px-6 py-2.5 sm:py-2 rounded-lg sm:rounded-xl transition-all duration-200 font-medium shadow-lg hover:shadow-xl flex items-center justify-center gap-2 w-full sm:w-auto sm:ml-4"
            >
              <Sparkles className="w-4 h-4" />
              <span className="sm:inline">{t.searchButtonText}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
