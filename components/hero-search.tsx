"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Search, Sparkles, Music, Loader2 } from "lucide-react"
import { SmartSearchInput } from "@/components/smart-search-input"
import type { FilterState } from "@/lib/conversational-ai"
import { useLanguage } from "@/contexts/language-context"
import { useToast } from "@/hooks/use-toast"
import { analyzeAudioFile } from "@/lib/audio-analyzer"

export function HeroSearch() {
  const [query, setQuery] = useState("")
  const [showSmartSearch, setShowSmartSearch] = useState(false)
  const [accumulatedFilters, setAccumulatedFilters] = useState<Partial<FilterState>>({})
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const { t } = useLanguage()
  const { toast } = useToast()

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

      toast({
        title: "Muziek geanalyseerd!",
        description: `Gedetecteerde genres: ${analysis.genres.join(", ")} | ${analysis.tempo} | Energie: ${analysis.energy}`,
      })

      // Navigate to artiesten page with detected genres
      const params = new URLSearchParams()
      params.set("genres", analysis.genres.join(","))
      params.set("q", `DJ voor ${analysis.mood.toLowerCase()} ${analysis.genres[0]} muziek`)

      router.push(`/artiesten?${params.toString()}`)
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      await handleMp3Upload(file)
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleAnalyzeSong = () => {
    fileInputRef.current?.click()
  }

  useState(() => {
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
        <SmartSearchInput
          value={query}
          onChange={setQuery}
          onFilterUpdate={handleFilterUpdate}
          onMusicUpload={handleMp3Upload}
        />
      </div>
    )
  }

  return (
    <div className="w-full max-w-2xl mx-auto relative px-4 sm:px-0">
      <input ref={fileInputRef} type="file" accept="audio/*" onChange={handleFileChange} className="hidden" />
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
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isAnalyzing}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
                aria-label={t.analyzeSong}
              >
                {isAnalyzing ? (
                  <Loader2 className="w-4 h-4 text-red-500 animate-spin" />
                ) : (
                  <Music className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                )}
              </button>
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
