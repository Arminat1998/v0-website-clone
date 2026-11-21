"use client"

import { useState, useEffect, useRef } from "react"
import { updateListState } from "@/lib/artiest-list-state"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Sparkles, X } from "lucide-react"
import type { FilterSuggestions } from "@/lib/adaptive-filters"
import { calendarStart, calendarYears, isPastDate, mondayOffset, upcomingDate } from "@/lib/filter-calendar"
import { MultiSelectDropdown } from "@/components/ui/multi-select-dropdown"
import { ComboSelect } from "@/components/combo-select"
import { EVENT_TYPE_GROUPS, GENRE_GROUPS, genreLabel } from "@/lib/profile-options"
import { useLanguage } from "@/contexts/language-context"
import { lettersOnly, rangeChars } from "@/lib/input-filters"
import { FilterPanel } from "@/components/filter-panel"

interface ArtiestFiltersProps {
  initialState?: Record<string, any> | null
  searchQuery?: string
  filterSuggestions?: FilterSuggestions
  onFiltersChange?: (filters: any) => void
  isMobileOpen?: boolean
  onMobileClose?: () => void
}

export function ArtiestFilters({
  initialState,
  searchQuery,
  filterSuggestions,
  onFiltersChange,
  isMobileOpen,
  onMobileClose,
}: ArtiestFiltersProps) {
  const [currentMonth, setCurrentMonth] = useState<string>(() => calendarStart(initialState?.month, initialState?.year).month)
  const [currentYear, setCurrentYear] = useState<string>(() => calendarStart(initialState?.month, initialState?.year).year)
  const [priceRange, setPriceRange] = useState<number[]>(initialState?.priceRange ?? [0, 5000])
  const [selectedCity, setSelectedCity] = useState<string>(initialState?.city ?? "")
  const [selectedDuration, setSelectedDuration] = useState<string>(initialState?.duration ?? "")
  const [selectedGenres, setSelectedGenres] = useState<string[]>(initialState?.genres ?? [])
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>(initialState?.eventTypes ?? [])
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialState?.categories ?? [])
  const [selectedDate, setSelectedDate] = useState<string>(() => upcomingDate(initialState?.selectedDate))

  const { t, language } = useLanguage()

  // When restoring a saved state, ignore the suggestions that were derived on mount so they don't overwrite it.
  const restoredSuggestionsRef = useRef<string | null>(initialState ? JSON.stringify(filterSuggestions ?? null) : null)

  useEffect(() => {
    if (restoredSuggestionsRef.current !== null && JSON.stringify(filterSuggestions ?? null) === restoredSuggestionsRef.current) {
      return
    }
    if (filterSuggestions) {
      if (filterSuggestions.categories && filterSuggestions.categories.length > 0) {
        setSelectedCategories(filterSuggestions.categories)
      }
      if (filterSuggestions.priceRange) {
        setPriceRange(filterSuggestions.priceRange)
      }
      if (filterSuggestions.city) {
        setSelectedCity(filterSuggestions.city)
      }
      if (filterSuggestions.duration) {
        setSelectedDuration(filterSuggestions.duration)
      }
      if (filterSuggestions.musicGenres && filterSuggestions.musicGenres.length > 0) {
        setSelectedGenres(filterSuggestions.musicGenres)
      } else if (filterSuggestions.genres && filterSuggestions.genres.length > 0) {
        setSelectedGenres(filterSuggestions.genres)
      }
      if (filterSuggestions.eventTypes && filterSuggestions.eventTypes.length > 0) {
        setSelectedEventTypes(filterSuggestions.eventTypes)
      }
      if (filterSuggestions.selectedDate) {
        const dateStr = filterSuggestions.selectedDate
        setSelectedDate(dateStr)

        const dateParts = dateStr.match(/(\d+)\s+(\w+)\s+(\d{4})/)
        if (dateParts) {
          const monthName = dateParts[2]
          const year = dateParts[3]
          const monthMap: Record<string, string> = {
            januari: "January",
            februari: "February",
            maart: "March",
            april: "April",
            mei: "May",
            juni: "June",
            juli: "July",
            augustus: "August",
            september: "September",
            oktober: "October",
            november: "November",
            december: "December",
          }
          const englishMonth = monthMap[monthName.toLowerCase()]
          if (englishMonth) {
            setCurrentMonth(englishMonth)
            setCurrentYear(year)
          }
        }
      }
      if (filterSuggestions.month) {
        setCurrentMonth(filterSuggestions.month)
      }
      if (filterSuggestions.year) {
        setCurrentYear(filterSuggestions.year)
      }
    }
  }, [filterSuggestions])

  useEffect(() => {
    if (onFiltersChange) {
      const filters = {
        priceRange,
        city: selectedCity,
        duration: selectedDuration,
        genres: selectedGenres,
        eventTypes: selectedEventTypes,
        categories: selectedCategories,
        month: currentMonth,
        year: currentYear,
        selectedDate: selectedDate,
      }
      onFiltersChange(filters)
      updateListState({ filters })
    }
  }, [
    priceRange,
    selectedCity,
    selectedDuration,
    selectedGenres,
    selectedEventTypes,
    selectedCategories,
    currentMonth,
    currentYear,
    selectedDate,
    onFiltersChange,
  ])

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  const years = calendarYears()

  const musicGenres = [
    "Pop",
    "House",
    "Techno",
    "Hip-Hop",
    "Electronic",
    "Jazz",
    "Classical",
    "Rock",
    "R&B",
    "Disco",
    "Funk",
    "Ambient",
    "Wedding Mix",
    "Party Mix",
    "Top 40",
    "Oldies",
    "Latin",
  ]

  const eventTypes = [
    "Wedding",
    "Birthday",
    "Corporate",
    "Club",
    "Festival",
    "Private Party",
    "Kids Party",
    "Anniversary",
    "Cocktail Party",
    "Business Event",
    "Cultural Event",
    "Outdoor Event",
  ]

  const artistTypes = ["DJ", "Saxophonist", "Band", "Singer", "Pianist", "Guitarist", "Violinist", "Live Music"]

  const getDaysInMonth = (month: string, year: string) => {
    const monthIndex = months.indexOf(month)
    return new Date(Number.parseInt(year), monthIndex + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (month: string, year: string) => {
    const monthIndex = months.indexOf(month)
    return mondayOffset(monthIndex, Number.parseInt(year))
  }

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear)
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear)
    const days = []

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="w-8 h-8"></div>)
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentYear}-${(months.indexOf(currentMonth) + 1).toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`
      const isSelected = selectedDate === dateStr
      const isPast = isPastDate(dateStr)

      days.push(
        <button
          key={day}
          type="button"
          disabled={isPast}
          className={`w-8 h-8 text-sm rounded flex items-center justify-center transition-colors text-foreground ${
            isSelected ? "bg-red-500 text-white" : isPast ? "cursor-not-allowed opacity-40" : "hover:bg-accent"
          }`}
          onClick={() => setSelectedDate(isSelected ? "" : dateStr)}
        >
          {day}
        </button>,
      )
    }

    return days
  }

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category],
    )
  }

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) => (prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]))
  }

  const toggleEventType = (eventType: string) => {
    setSelectedEventTypes((prev) =>
      prev.includes(eventType) ? prev.filter((e) => e !== eventType) : [...prev, eventType],
    )
  }

  const resetFilters = () => {
    const start = calendarStart()
    setCurrentMonth(start.month)
    setCurrentYear(start.year)
    setPriceRange([0, 5000])
    setSelectedCity("")
    setSelectedDuration("")
    setSelectedGenres([])
    setSelectedEventTypes([])
    setSelectedCategories([])
    setSelectedDate("")
  }

  return (
    <FilterPanel
      title={t.filters}
      isMobileOpen={isMobileOpen}
      onMobileClose={onMobileClose}
      onReset={resetFilters}
      badge={filterSuggestions && Object.keys(filterSuggestions).length > 0 ? (
          <Badge variant="secondary" className="text-xs">
            <Sparkles className="w-3 h-3 mr-1" />
            {t.smartSuggestion}
          </Badge>
        ) : null}
    >

      <div className="mb-6">
        <h3 className="font-semibold mb-3 text-foreground">{t.artistTypeLabel}</h3>
        <MultiSelectDropdown
          options={artistTypes}
          selectedValues={selectedCategories}
          onSelectionChange={setSelectedCategories}
          placeholder={t.selectType}
          searchPlaceholder={t.searchCity}
        />
        {selectedCategories.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {selectedCategories.map((category) => (
              <Badge key={category} variant="default" className="text-xs">
                {category}
                <button onClick={() => toggleCategory(category)} className="ml-1 hover:text-red-200">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="mb-6">
        <h3 className="font-medium mb-3 text-foreground">{t.availability}</h3>

        {selectedDate && (
          <div className="mb-3 p-2 bg-red-50 dark:bg-red-950/40 rounded border border-red-200 dark:border-red-800">
            <div className="text-sm text-red-700 dark:text-red-300">
              {t.selectedDate}{" "}
              {new Date(selectedDate).toLocaleDateString("nl-NL", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
              <button
                onClick={() => setSelectedDate("")}
                className="ml-2 text-red-500 hover:text-red-700 dark:hover:text-red-300"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const currentIndex = months.indexOf(currentMonth)
              if (currentIndex > 0) {
                setCurrentMonth(months[currentIndex - 1])
              }
            }}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <div className="flex gap-2">
            <Select value={currentMonth} onValueChange={setCurrentMonth}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((month) => (
                  <SelectItem key={month} value={month}>
                    {month.slice(0, 3)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={currentYear} onValueChange={setCurrentYear}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const currentIndex = months.indexOf(currentMonth)
              if (currentIndex < months.length - 1) {
                setCurrentMonth(months[currentIndex + 1])
              }
            }}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-xs">
          <div className="text-center font-medium p-1 text-foreground">{t.monday}</div>
          <div className="text-center font-medium p-1 text-foreground">{t.tuesday}</div>
          <div className="text-center font-medium p-1 text-foreground">{t.wednesday}</div>
          <div className="text-center font-medium p-1 text-foreground">{t.thursday}</div>
          <div className="text-center font-medium p-1 text-foreground">{t.friday}</div>
          <div className="text-center font-medium p-1 text-foreground">{t.saturday}</div>
          <div className="text-center font-medium p-1 text-foreground">{t.sunday}</div>
          {renderCalendar()}
        </div>
      </div>

      <div className="mb-6">
        <h3 className="font-medium mb-3 text-foreground">{t.city}</h3>
        <Input aria-label={t.city} autoComplete="address-level2" placeholder={t.searchCity} value={selectedCity} onChange={(e) => setSelectedCity(lettersOnly(e.target.value))} />
      </div>

      <div className="mb-6">
        <h3 className="font-medium mb-3 text-foreground">{t.durationInHours}</h3>
        <Input aria-label={t.durationInHours} inputMode="numeric" placeholder="1 - 8" value={selectedDuration} onChange={(e) => setSelectedDuration(rangeChars(e.target.value))} />
      </div>

      <div className="mb-6">
        <h3 className="font-medium mb-3 text-foreground">{t.priceRange}</h3>
        <div className="flex gap-2 mb-3">
          <div>
            <label htmlFor="filter-min-price" className="text-sm text-muted-foreground">{t.minPrice}</label>
            <Input
              id="filter-min-price"
              type="number"
              value={priceRange[0]}
              onChange={(e) => setPriceRange([Number.parseInt(e.target.value) || 0, priceRange[1]])}
            />
          </div>
          <div>
            <label htmlFor="filter-max-price" className="text-sm text-muted-foreground">{t.maxPrice}</label>
            <Input
              id="filter-max-price"
              type="number"
              value={priceRange[1]}
              onChange={(e) => setPriceRange([priceRange[0], Number.parseInt(e.target.value) || 5000])}
            />
          </div>
        </div>
        <Slider aria-label={t.priceRange} value={priceRange} onValueChange={setPriceRange} max={5000} min={0} step={50} className="w-full" />
      </div>

      <div className="mb-6">
        <h3 className="font-medium mb-3 text-foreground">{t.musicGenres}</h3>
        <ComboSelect
          id="filter-genres"
          multiple
          nl={language === "nl"}
          value={selectedGenres}
          onChange={setSelectedGenres}
          placeholder={t.selectGenres}
          searchPlaceholder={language === "nl" ? "Zoek een genre..." : "Search a genre..."}
          labelFor={(value) => genreLabel(value, language === "nl")}
          groups={GENRE_GROUPS.map((group) => ({
            label: language === "nl" ? group.nl : group.en,
            options: group.options.map((option) => ({ value: option.value, label: language === "nl" ? option.nl : option.en })),
          }))}
        />
      </div>

      <div className="mb-6">
        <h3 className="font-medium mb-3 text-foreground">{t.eventTypes}</h3>
        <ComboSelect
          id="filter-event-types"
          multiple
          nl={language === "nl"}
          value={selectedEventTypes}
          onChange={setSelectedEventTypes}
          placeholder={t.selectEventTypes}
          searchPlaceholder={language === "nl" ? "Zoek een evenement type..." : "Search an event type..."}
          groups={EVENT_TYPE_GROUPS.map((group) => ({
            label: language === "nl" ? group.nl : group.en,
            options: group.options.map((option) => ({ value: option.value, label: language === "nl" ? option.nl : option.en })),
          }))}
        />
      </div>
    </FilterPanel>
  )
}
