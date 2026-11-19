"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Sparkles, X } from "lucide-react"
import type { FilterSuggestions } from "@/lib/adaptive-filters"
import { MultiSelectDropdown } from "@/components/ui/multi-select-dropdown"
import { useLanguage } from "@/contexts/language-context"
import { lettersOnly, rangeChars } from "@/lib/input-filters"

interface PhotoVideoFiltersProps {
  searchQuery?: string
  filterSuggestions?: FilterSuggestions
  onFiltersChange?: (filters: any) => void
  isMobileOpen?: boolean
  onMobileClose?: () => void
}

export function PhotoVideoFilters({
  searchQuery,
  filterSuggestions,
  onFiltersChange,
  isMobileOpen,
  onMobileClose,
}: PhotoVideoFiltersProps) {
  const [currentMonth, setCurrentMonth] = useState("September")
  const [currentYear, setCurrentYear] = useState("2025")
  const [priceRange, setPriceRange] = useState([0, 5000])
  const [selectedCity, setSelectedCity] = useState("")
  const [selectedDuration, setSelectedDuration] = useState("")
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedDate, setSelectedDate] = useState<string>("")

  const { t } = useLanguage()

  useEffect(() => {
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
      if (filterSuggestions.eventTypes && filterSuggestions.eventTypes.length > 0) {
        setSelectedEventTypes(filterSuggestions.eventTypes)
      }
      if (filterSuggestions.selectedDate) {
        setSelectedDate(filterSuggestions.selectedDate)
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
        eventTypes: selectedEventTypes,
        categories: selectedCategories,
        month: currentMonth,
        year: currentYear,
        selectedDate: selectedDate,
      }
      onFiltersChange(filters)
    }
  }, [
    priceRange,
    selectedCity,
    selectedDuration,
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

  const years = ["2024", "2025", "2026"]

  const serviceTypes = ["Photographer", "Videographer", "Photographer & Videographer"]

  const eventTypes = [
    "Wedding",
    "Birthday",
    "Corporate",
    "Conference",
    "Concert",
    "Product Launch",
    "Music Video",
    "Documentary",
  ]

  const getDaysInMonth = (month: string, year: string) => {
    const monthIndex = months.indexOf(month)
    return new Date(Number.parseInt(year), monthIndex + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (month: string, year: string) => {
    const monthIndex = months.indexOf(month)
    return new Date(Number.parseInt(year), monthIndex, 1).getDay()
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

      days.push(
        <button
          key={day}
          className={`w-8 h-8 text-sm rounded flex items-center justify-center transition-colors text-foreground ${
            isSelected ? "bg-red-500 text-white" : "hover:bg-accent"
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

  const toggleEventType = (eventType: string) => {
    setSelectedEventTypes((prev) =>
      prev.includes(eventType) ? prev.filter((e) => e !== eventType) : [...prev, eventType],
    )
  }

  return (
    <div
      className={`${
        isMobileOpen ? "fixed inset-y-0 left-0 z-50" : "hidden md:block"
      } w-80 bg-card p-6 border-r border-border overflow-y-auto transition-transform`}
    >
      {isMobileOpen && (
        <button onClick={onMobileClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
          <X className="w-6 h-6" />
        </button>
      )}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-foreground">{t.filters}</h2>
        {filterSuggestions && Object.keys(filterSuggestions).length > 0 && (
          <Badge variant="secondary" className="text-xs">
            <Sparkles className="w-3 h-3 mr-1" />
            {t.smartSuggestion}
          </Badge>
        )}
      </div>

      <div className="mb-6">
        <h3 className="font-semibold mb-3 text-foreground">{t.photographerTypeLabel}</h3>
        <MultiSelectDropdown
          options={serviceTypes}
          selectedValues={selectedCategories}
          onSelectionChange={setSelectedCategories}
          placeholder="Select service type"
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
        <Input placeholder={t.searchCity} value={selectedCity} onChange={(e) => setSelectedCity(lettersOnly(e.target.value))} />
      </div>

      <div className="mb-6">
        <h3 className="font-medium mb-3 text-foreground">{t.durationInHours}</h3>
        <Input placeholder="1 - 8" value={selectedDuration} onChange={(e) => setSelectedDuration(rangeChars(e.target.value))} />
      </div>

      <div className="mb-6">
        <h3 className="font-medium mb-3 text-foreground">{t.priceRange}</h3>
        <div className="flex gap-2 mb-3">
          <div>
            <label className="text-sm text-muted-foreground">{t.minPrice}</label>
            <Input
              type="number"
              value={priceRange[0]}
              onChange={(e) => setPriceRange([Number.parseInt(e.target.value) || 0, priceRange[1]])}
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">{t.maxPrice}</label>
            <Input
              type="number"
              value={priceRange[1]}
              onChange={(e) => setPriceRange([priceRange[0], Number.parseInt(e.target.value) || 5000])}
            />
          </div>
        </div>
        <Slider value={priceRange} onValueChange={setPriceRange} max={5000} min={100} step={50} className="w-full" />
      </div>

      <div className="mb-6">
        <h3 className="font-medium mb-3 text-foreground">{t.eventTypes}</h3>
        <MultiSelectDropdown
          options={eventTypes}
          selectedValues={selectedEventTypes}
          onSelectionChange={setSelectedEventTypes}
          placeholder={t.selectEventTypes}
          searchPlaceholder={t.searchCity}
        />
        {selectedEventTypes.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {selectedEventTypes.map((eventType) => (
              <Badge key={eventType} variant="default" className="text-xs">
                {eventType}
                <button onClick={() => toggleEventType(eventType)} className="ml-1 hover:text-red-200">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
