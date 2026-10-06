"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight, Calendar, MapPin, Clock } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { useBookingT } from "@/lib/booking-i18n"
import type { CalendarBooking } from "@/app/actions/bookings"
import { formatEventDate, todayIso } from "@/lib/bookings/format"

// Dates the professional has blocked by hand (separate from bookings, which block automatically).
const initialUnavailableDates = ["2026-12-24", "2026-12-25", "2026-12-31"]

export function CalendarView({ bookings }: { bookings: CalendarBooking[] }) {
  const { t } = useLanguage()
  const { t: bt, locale } = useBookingT()
  const today = todayIso()
  const [todayYear, todayMonth] = today.split("-").map(Number)
  const [currentMonth, setCurrentMonth] = useState(todayMonth - 1)
  const [currentYear, setCurrentYear] = useState(todayYear)
  const [selectedDates, setSelectedDates] = useState<number[]>([])
  const [selectedUnavailableDates, setSelectedUnavailableDates] = useState<number[]>([])
  const [markedUnavailable, setMarkedUnavailable] = useState<string[]>(initialUnavailableDates)
  const [selectionMode, setSelectionMode] = useState<"available" | "unavailable" | null>(null)
  const [lastSelectedDay, setLastSelectedDay] = useState<number | null>(null)

  const months = [t.january, t.february, t.march, t.april, t.may, t.june, t.july, t.august, t.september, t.october, t.november, t.december]

  const bookedDates = new Map<string, CalendarBooking>()
  const pendingDates = new Map<string, CalendarBooking>()
  for (const booking of bookings) {
    if (booking.status === "pending") pendingDates.set(booking.eventDate, booking)
    else bookedDates.set(booking.eventDate, booking)
  }

  const upcoming = bookings.filter((b) => b.status === "accepted" && b.eventDate >= today).slice(0, 6)

  const getDaysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate()
  const getFirstDayOfMonth = (month: number, year: number) => {
    const day = new Date(year, month, 1).getDay()
    return day === 0 ? 6 : day - 1
  }
  const getDateString = (day: number) =>
    `${currentYear}-${(currentMonth + 1).toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`

  const isDateUnavailable = (day: number) => markedUnavailable.includes(getDateString(day))
  const isDateBooked = (day: number) => bookedDates.has(getDateString(day))
  const isDatePending = (day: number) => pendingDates.has(getDateString(day))
  const isDateInPast = (day: number) => getDateString(day) < today

  const toggleDateSelection = (day: number, shiftKey = false) => {
    const isUnavailable = isDateUnavailable(day)

    if (shiftKey && lastSelectedDay !== null && lastSelectedDay !== day) {
      const start = Math.min(lastSelectedDay, day)
      const end = Math.max(lastSelectedDay, day)
      const range: number[] = []
      for (let d = start; d <= end; d++) {
        if (!isDateInPast(d) && !isDateBooked(d) && isDateUnavailable(d) === isUnavailable) range.push(d)
      }
      const setter = isUnavailable ? setSelectedUnavailableDates : setSelectedDates
      if (selectionMode === null) setSelectionMode(isUnavailable ? "unavailable" : "available")
      setter((prev) => {
        const allSelected = range.every((d) => prev.includes(d))
        if (allSelected) return prev.filter((d) => !range.includes(d))
        const next = [...prev]
        for (const d of range) if (!next.includes(d)) next.push(d)
        return next
      })
      setLastSelectedDay(day)
      return
    }

    const mode = isUnavailable ? "unavailable" : "available"
    if (selectionMode === null) setSelectionMode(mode)
    if (selectionMode === mode || selectionMode === null) {
      const setter = isUnavailable ? setSelectedUnavailableDates : setSelectedDates
      setter((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]))
      setLastSelectedDay(day)
    }
  }

  const handleAction = () => {
    if (selectionMode === "available") {
      setMarkedUnavailable((prev) => [...prev, ...selectedDates.map(getDateString)])
      setSelectedDates([])
    } else if (selectionMode === "unavailable") {
      const toFree = selectedUnavailableDates.map(getDateString)
      setMarkedUnavailable((prev) => prev.filter((date) => !toFree.includes(date)))
      setSelectedUnavailableDates([])
    }
    setSelectionMode(null)
  }

  const resetSelection = () => {
    setSelectedDates([])
    setSelectedUnavailableDates([])
    setSelectionMode(null)
    setLastSelectedDay(null)
  }

  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else setCurrentMonth(currentMonth - 1)
    resetSelection()
  }

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear + 1)
    } else setCurrentMonth(currentMonth + 1)
    resetSelection()
  }

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear)
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear)
    const cells = []

    for (let i = 0; i < firstDay; i++) cells.push(<div key={`empty-${i}`} className="aspect-square" />)

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = getDateString(day)
      const booked = bookedDates.get(dateStr)
      const pending = pendingDates.get(dateStr)
      const unavailable = isDateUnavailable(day)
      const isSelected = selectedDates.includes(day)
      const isUnavailableSelected = selectedUnavailableDates.includes(day)
      const isPast = isDateInPast(day)
      const isDisabledByMode =
        (selectionMode === "available" && unavailable) || (selectionMode === "unavailable" && !unavailable)

      let classes = "aspect-square w-full text-sm rounded-md flex items-center justify-center transition-colors relative "

      if (booked) {
        classes += isPast
          ? "bg-blue-600/40 text-white/70 font-medium"
          : "bg-blue-600 text-white font-medium hover:bg-blue-700"
      } else if (isPast) {
        classes += "bg-zinc-500 dark:bg-zinc-800 text-zinc-300 dark:text-zinc-500 cursor-not-allowed line-through"
      } else if (isDisabledByMode) {
        classes += unavailable ? "bg-red-600/50 text-white/50 font-medium cursor-not-allowed" : "text-zinc-700/50 dark:text-zinc-400/50 bg-zinc-200/50 dark:bg-zinc-700/50 cursor-not-allowed"
      } else if (unavailable && isUnavailableSelected) {
        classes += "bg-red-600 text-white font-medium cursor-pointer ring-2 ring-green-400"
      } else if (unavailable) {
        classes += "bg-red-600 text-white font-medium cursor-pointer hover:bg-red-700"
      } else if (isSelected) {
        classes += "bg-green-600 text-white font-medium ring-2 ring-green-400"
      } else if (pending) {
        classes += "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600 cursor-pointer bg-zinc-200 dark:bg-zinc-700 ring-2 ring-inset ring-amber-500"
      } else {
        classes += "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600 cursor-pointer bg-zinc-200 dark:bg-zinc-700"
      }

      if (booked) {
        cells.push(
          <Link
            key={day}
            href={`/dashboard/bookings/${booked.id}`}
            title={`${bt.calendar.booked}: ${booked.eventName}`}
            className={classes}
          >
            {day}
            <span className="sr-only">{booked.eventName}</span>
          </Link>,
        )
        continue
      }

      cells.push(
        <button
          type="button"
          key={day}
          title={pending ? `${bt.calendar.pendingRequest}: ${pending.eventName}` : undefined}
          onClick={(e) => !isPast && !isDisabledByMode && toggleDateSelection(day, e.shiftKey)}
          disabled={isPast || isDisabledByMode}
          className={classes}
        >
          {day}
        </button>,
      )
    }

    return cells
  }

  const legend = [
    { swatch: "bg-blue-600", label: bt.calendar.booked },
    { swatch: "bg-zinc-200 dark:bg-zinc-700 ring-2 ring-inset ring-amber-500", label: bt.calendar.pendingRequest },
    { swatch: "bg-red-600", label: "Unavailable" },
    { swatch: "bg-green-600", label: "Selected" },
    { swatch: "bg-zinc-200 dark:bg-zinc-700", label: "Available" },
  ]

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 md:p-8 lg:p-10">
      <h1 className="mb-1 text-xl font-bold text-foreground sm:mb-2 sm:text-2xl md:text-3xl">{t.calendarTitle}</h1>
      <p className="mb-4 text-sm text-muted-foreground sm:mb-6 sm:text-base md:mb-8">
        {t.selectDates}. {bt.calendar.blockedNote}
      </p>

      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-3 sm:mb-6 sm:gap-4">
        {legend.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <div className={`h-4 w-4 flex-shrink-0 rounded ${item.swatch}`} />
            <span className="whitespace-nowrap text-xs text-foreground sm:text-sm">{item.label}</span>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-card p-3 sm:p-6">
        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-[1fr_350px]">
          <div className="mx-auto w-full max-w-md lg:mx-0">
            <div className="mb-3 flex items-center justify-between sm:mb-4">
              <button type="button" onClick={goToPreviousMonth} aria-label="Previous month" className="touch-manipulation rounded-lg bg-accent p-1.5 text-foreground transition-colors hover:bg-muted sm:p-2">
                <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
              <span className="text-sm font-semibold text-foreground sm:text-base md:text-lg">
                {months[currentMonth]} {currentYear}
              </span>
              <button type="button" onClick={goToNextMonth} aria-label="Next month" className="touch-manipulation rounded-lg bg-accent p-1.5 text-foreground transition-colors hover:bg-muted sm:p-2">
                <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>

            <div className="mb-2 grid grid-cols-7 gap-0.5 sm:gap-1">
              {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => (
                <div key={index} className="flex h-6 items-center justify-center text-center text-[10px] font-semibold text-muted-foreground sm:h-8 sm:text-xs">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-0.5 sm:gap-1">{renderCalendar()}</div>

            <button
              type="button"
              onClick={handleAction}
              className={`mt-3 w-full touch-manipulation rounded-lg py-2.5 text-xs font-medium transition-colors sm:mt-4 sm:py-3 sm:text-sm ${
                selectionMode === "available" && selectedDates.length > 0
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : selectionMode === "unavailable" && selectedUnavailableDates.length > 0
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : "cursor-not-allowed bg-muted text-muted-foreground"
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

          <div>
            <h2 className="mb-3 text-base font-semibold text-red-500 sm:mb-4 sm:text-lg md:text-xl">{bt.overview.upcoming}</h2>
            {upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground">{bt.overview.noNextEvent}</p>
            ) : (
              <ul className="flex max-h-[420px] flex-col gap-2 overflow-y-auto pr-1 sm:gap-3 sm:pr-2">
                {upcoming.map((event) => (
                  <li key={event.id}>
                    <Link
                      href={`/dashboard/bookings/${event.id}`}
                      className="block rounded-lg border border-border bg-accent p-3 transition-colors hover:border-red-500 sm:p-4"
                    >
                      <h3 className="mb-1 text-sm font-semibold text-foreground">{event.eventName}</h3>
                      <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3 flex-shrink-0" aria-hidden />
                        <span className="truncate capitalize">{formatEventDate(event.eventDate, locale)}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3 flex-shrink-0" aria-hidden />
                          {event.startTime} – {event.endTime}
                        </span>
                        <span className="flex items-center gap-1.5 truncate">
                          <MapPin className="h-3 w-3 flex-shrink-0 text-red-500" aria-hidden />
                          {event.city}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
