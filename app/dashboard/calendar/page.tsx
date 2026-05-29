"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ChevronLeft, ChevronRight, Calendar, MapPin } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

// Mock upcoming events data
const upcomingEvents = [
  {
    id: 1,
    name: "Leslie Alexander",
    date: "Friday, January 10, 2025",
    location: "Glasgow, UK",
    avatar: null,
  },
  {
    id: 2,
    name: "Michael Foster",
    date: "Sunday, January 12, 2025",
    location: "Glasgow, UK",
    avatar: null,
  },
  {
    id: 3,
    name: "Dries Vincent",
    date: "Sunday, January 12, 2025",
    location: "Glasgow, UK",
    avatar: null,
  },
  {
    id: 4,
    name: "Lindsay Walton",
    date: "Tuesday, January 14, 2025",
    location: "Glasgow, UK",
    avatar: null,
  },
  {
    id: 5,
    name: "Courtney Henry",
    date: "Tuesday, January 14, 2025",
    location: "Glasgow, UK",
    avatar: null,
  },
]

// Unavailable dates (dates marked as unavailable by the professional)
const unavailableDates = ["2026-01-25", "2026-01-26", "2026-02-14", "2026-02-15"]

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
]

const years = [2024, 2025, 2026, 2027, 2028]

export default function CalendarPage() {
  const { t } = useLanguage()
  const [currentMonth, setCurrentMonth] = useState(0) // January
  const [currentYear, setCurrentYear] = useState(2026)
  const [selectedDates, setSelectedDates] = useState<number[]>([])
  const [selectedUnavailableDates, setSelectedUnavailableDates] = useState<number[]>([])
  const [markedUnavailable, setMarkedUnavailable] = useState<string[]>(unavailableDates)
  const [selectionMode, setSelectionMode] = useState<"available" | "unavailable" | null>(null)
  const [lastSelectedDay, setLastSelectedDay] = useState<number | null>(null)

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (month: number, year: number) => {
    const day = new Date(year, month, 1).getDay()
    // Convert Sunday (0) to 7 for Monday-first calendar
    return day === 0 ? 6 : day - 1
  }

  const getDateString = (day: number) => {
    return `${currentYear}-${(currentMonth + 1).toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`
  }

  const isDateUnavailable = (day: number) => {
    return markedUnavailable.includes(getDateString(day))
  }

  const isDateInPast = (day: number) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const checkDate = new Date(currentYear, currentMonth, day)
    return checkDate < today
  }

  const toggleDateSelection = (day: number, shiftKey: boolean = false) => {
    const isUnavailable = isDateUnavailable(day)
    
    // Handle shift+click for range selection
    if (shiftKey && lastSelectedDay !== null && lastSelectedDay !== day) {
      const start = Math.min(lastSelectedDay, day)
      const end = Math.max(lastSelectedDay, day)
      const range = []
      
      for (let d = start; d <= end; d++) {
        // Skip past dates
        if (!isDateInPast(d)) {
          // Only add dates that match the current selection mode
          const dateIsUnavailable = isDateUnavailable(d)
          if (isUnavailable === dateIsUnavailable) {
            range.push(d)
          }
        }
      }
      
      if (isUnavailable) {
        // Set mode to unavailable if not already set
        if (selectionMode === null) {
          setSelectionMode("unavailable")
        }
        if (selectionMode === "unavailable" || selectionMode === null) {
          setSelectedUnavailableDates((prev) => {
            // Check if all dates in range are already selected
            const allSelected = range.every(d => prev.includes(d))
            
            if (allSelected) {
              // Deselect all dates in the range
              return prev.filter(d => !range.includes(d))
            } else {
              // Select all dates in the range
              const newSelection = [...prev]
              for (const d of range) {
                if (!newSelection.includes(d)) {
                  newSelection.push(d)
                }
              }
              return newSelection
            }
          })
        }
      } else {
        // Set mode to available if not already set
        if (selectionMode === null) {
          setSelectionMode("available")
        }
        if (selectionMode === "available" || selectionMode === null) {
          setSelectedDates((prev) => {
            // Check if all dates in range are already selected
            const allSelected = range.every(d => prev.includes(d))
            
            if (allSelected) {
              // Deselect all dates in the range
              return prev.filter(d => !range.includes(d))
            } else {
              // Select all dates in the range
              const newSelection = [...prev]
              for (const d of range) {
                if (!newSelection.includes(d)) {
                  newSelection.push(d)
                }
              }
              return newSelection
            }
          })
        }
      }
      setLastSelectedDay(day)
      return
    }
    
    // Normal single click selection
    if (isUnavailable) {
      // Set mode to unavailable if not already set
      if (selectionMode === null) {
        setSelectionMode("unavailable")
      }
      // Only allow selection if in unavailable mode
      if (selectionMode === "unavailable" || selectionMode === null) {
        setSelectedUnavailableDates((prev) =>
          prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
        )
        setLastSelectedDay(day)
      }
    } else {
      // Set mode to available if not already set
      if (selectionMode === null) {
        setSelectionMode("available")
      }
      // Only allow selection if in available mode
      if (selectionMode === "available" || selectionMode === null) {
        setSelectedDates((prev) =>
          prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
        )
        setLastSelectedDay(day)
      }
    }
  }

  const handleAction = () => {
    if (selectionMode === "available") {
      // Mark selected available dates as unavailable
      const newUnavailableDates = selectedDates.map((day) => getDateString(day))
      setMarkedUnavailable((prev) => [...prev, ...newUnavailableDates])
      setSelectedDates([])
    } else if (selectionMode === "unavailable") {
      // Mark selected unavailable dates as available
      const datesToMakeAvailable = selectedUnavailableDates.map((day) => getDateString(day))
      setMarkedUnavailable((prev) => prev.filter((date) => !datesToMakeAvailable.includes(date)))
      setSelectedUnavailableDates([])
    }
    setSelectionMode(null)
  }

  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
    setSelectedDates([])
    setSelectedUnavailableDates([])
    setSelectionMode(null)
    setLastSelectedDay(null)
  }

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
    setSelectedDates([])
    setSelectedUnavailableDates([])
    setSelectionMode(null)
    setLastSelectedDay(null)
  }

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear)
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear)
    const days = []

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="aspect-square" />)
    }

    // Calendar days
    for (let day = 1; day <= daysInMonth; day++) {
      const unavailable = isDateUnavailable(day)
      const isSelected = selectedDates.includes(day)
      const isUnavailableSelected = selectedUnavailableDates.includes(day)
      const isPast = isDateInPast(day)
      
      // Disable dates based on selection mode
      const isDisabledByMode = 
        (selectionMode === "available" && unavailable) || 
        (selectionMode === "unavailable" && !unavailable)

      let dayClasses = "aspect-square w-full text-sm rounded-md flex items-center justify-center transition-colors "

      if (isPast) {
        dayClasses += "bg-zinc-500 text-zinc-300 cursor-not-allowed line-through"
      } else if (isDisabledByMode) {
        // Dates that are disabled due to selection mode
        dayClasses += unavailable 
          ? "bg-red-600/50 text-white/50 font-medium cursor-not-allowed" 
          : "text-zinc-700/50 bg-zinc-200/50 cursor-not-allowed"
      } else if (unavailable && isUnavailableSelected) {
        dayClasses += "bg-red-600 text-white font-medium cursor-pointer ring-2 ring-green-400"
      } else if (unavailable) {
        dayClasses += "bg-red-600 text-white font-medium cursor-pointer hover:bg-red-700"
      } else if (isSelected) {
        dayClasses += "bg-green-600 text-white font-medium ring-2 ring-green-400"
      } else {
        dayClasses += "text-zinc-700 hover:bg-zinc-300 cursor-pointer bg-zinc-200"
      }

      days.push(
        <button
          type="button"
          key={day}
          onClick={(e) => !isPast && !isDisabledByMode && toggleDateSelection(day, e.shiftKey)}
          disabled={isPast || isDisabledByMode}
          className={dayClasses}
        >
          {day}
        </button>
      )
    }

    return days
  }

  const handleMarkUnavailable = () => {
    handleAction()
  }

  const handleMarkAvailable = () => {
    handleAction()
  }

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 md:p-8 lg:p-10 bg-background min-h-screen">
        {/* Header */}
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-1 sm:mb-2">{t.calendarTitle}</h1>
        <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 md:mb-8">
          {t.selectDates}
        </p>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-4 sm:mb-6 p-2 sm:p-3 bg-card border border-border rounded-lg">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 rounded border-2 border-green-600 bg-green-600 flex-shrink-0" />
            <span className="text-[11px] sm:text-xs md:text-sm text-foreground whitespace-nowrap">Selected</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 rounded border-2 border-red-600 bg-red-600 flex-shrink-0" />
            <span className="text-[11px] sm:text-xs md:text-sm text-foreground whitespace-nowrap">Unavailable</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 rounded bg-zinc-200 dark:bg-zinc-700 flex-shrink-0" />
            <span className="text-[11px] sm:text-xs md:text-sm text-muted-foreground whitespace-nowrap">Available</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 rounded bg-zinc-500 dark:bg-zinc-600 flex items-center justify-center flex-shrink-0">
              <span className="text-zinc-300 text-[9px] sm:text-xs line-through">31</span>
            </div>
            <span className="text-[11px] sm:text-xs md:text-sm text-muted-foreground whitespace-nowrap">Past</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-card rounded-lg border border-border p-3 sm:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-4 sm:gap-6">
            {/* Calendar Section */}
            <div className="max-w-md mx-auto w-full lg:mx-0">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <button
                  type="button"
                  onClick={goToPreviousMonth}
                  className="p-1.5 sm:p-2 rounded-lg bg-accent hover:bg-muted text-foreground transition-colors touch-manipulation"
                >
                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <span className="text-sm sm:text-base md:text-lg font-semibold text-foreground">
                  {months[currentMonth]} {currentYear}
                </span>
                <button
                  type="button"
                  onClick={goToNextMonth}
                  className="p-1.5 sm:p-2 rounded-lg bg-accent hover:bg-muted text-foreground transition-colors touch-manipulation"
                >
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-2">
                {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => (
                  <div
                    key={index}
                    className="text-center text-[10px] sm:text-xs font-semibold text-muted-foreground h-6 sm:h-8 flex items-center justify-center"
                  >
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-0.5 sm:gap-1">{renderCalendar()}</div>

              <button
                type="button"
                onClick={handleAction}
                className={`w-full mt-3 sm:mt-4 py-2.5 sm:py-3 rounded-lg font-medium text-xs sm:text-sm transition-colors touch-manipulation ${
                  selectionMode === "available" && selectedDates.length > 0
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : selectionMode === "unavailable" && selectedUnavailableDates.length > 0
                      ? "bg-green-600 hover:bg-green-700 text-white"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
                disabled={
                  (selectionMode === "available" && selectedDates.length === 0) ||
                  (selectionMode === "unavailable" && selectedUnavailableDates.length === 0) ||
                  selectionMode === null
                }
              >
                {selectionMode === "available" && selectedDates.length > 0
                  ? `${t.markAsUnavailable} (${selectedDates.length})`
                  : selectionMode === "unavailable" && selectedUnavailableDates.length > 0
                    ? `${t.markAsAvailable} (${selectedUnavailableDates.length})`
                    : selectionMode === "available"
                      ? t.selectAvailableDates
                      : selectionMode === "unavailable"
                        ? t.selectUnavailableDates
                        : t.selectDates}
              </button>
            </div>

            {/* Upcoming Events Section */}
            <div>
              <h3 className="text-base sm:text-lg md:text-xl font-semibold text-red-500 mb-3 sm:mb-4">Upcoming Events</h3>
              <div className="space-y-2 sm:space-y-3 max-h-[280px] sm:max-h-[350px] overflow-y-auto pr-1 sm:pr-2">
                {upcomingEvents.map((event) => (
                  <div key={event.id} className="border-l-4 border-red-500 bg-accent rounded-r-lg p-2.5 sm:p-3 md:p-4">
                    <h4 className="font-semibold text-foreground text-xs sm:text-sm mb-0.5 sm:mb-1">{event.name}</h4>
                    <div className="flex items-center gap-1 text-[11px] sm:text-xs text-muted-foreground mb-0.5 sm:mb-1">
                      <Calendar className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" />
                      <span className="truncate">{event.date}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] sm:text-xs text-muted-foreground">
                      <MapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-red-500 flex-shrink-0" />
                      <span className="truncate">{event.location}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
