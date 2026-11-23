"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight, Calendar, Loader2, MapPin, Clock } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { useBookingT } from "@/lib/booking-i18n"
import { saveMyAvailability, type SaveAvailabilityResult } from "@/app/actions/availability"
import type { CalendarBooking } from "@/app/actions/bookings"
import { formatEventDate, maxDateIso, todayIso } from "@/lib/bookings/format"

type SaveError = Extract<SaveAvailabilityResult, { ok: false }>["error"]

export function CalendarView({ bookings, unavailableDates }: { bookings: CalendarBooking[]; unavailableDates: string[] }) {
  const { t, language } = useLanguage()
  const { t: bt, locale } = useBookingT()
  const tr = (nl: string, en: string) => (language === "en" ? en : nl)
  const today = todayIso()
  const maxDate = maxDateIso()
  const [todayYear, todayMonth] = today.split("-").map(Number)
  const [currentMonth, setCurrentMonth] = useState(todayMonth - 1)
  const [currentYear, setCurrentYear] = useState(todayYear)
  // Dates blocked by hand, as stored; bookings block their date by themselves.
  const [markedUnavailable, setMarkedUnavailable] = useState(unavailableDates)
  const [selectedDates, setSelectedDates] = useState<string[]>([])
  const [lastSelectedDay, setLastSelectedDay] = useState<number | null>(null)
  const [isSaving, startSaving] = useTransition()
  const [error, setError] = useState<SaveError | null>(null)
  const [savedMessage, setSavedMessage] = useState("")

  // A selection holds only free or only blocked dates; the first date decides which.
  const selectionMode = selectedDates.length === 0 ? null : markedUnavailable.includes(selectedDates[0]) ? "unavailable" : "available"

  const errorText: Record<SaveError, string> = {
    UNAUTHORIZED: tr("Je bent niet meer ingelogd. Log opnieuw in; je wijziging is niet opgeslagen.", "You are no longer logged in. Log in again; your change was not saved."),
    INVALID: tr("Deze datums kunnen niet worden aangepast. Ververs de pagina en probeer het opnieuw.", "These dates cannot be changed. Refresh the page and try again."),
    TOO_MANY: tr("Je hebt te veel wijzigingen achter elkaar gedaan. Probeer het over een paar minuten opnieuw.", "Too many changes in a row. Try again in a few minutes."),
    FAILED: tr("Opslaan is niet gelukt. Je selectie staat er nog; probeer het opnieuw.", "Saving failed. Your selection is still there; try again."),
  }

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

  const isDateTooFar = (day: number) => getDateString(day) > maxDate

  const toggleDateSelection = (day: number, shiftKey = false) => {
    const date = getDateString(day)
    const isUnavailable = isDateUnavailable(day)
    setError(null)
    setSavedMessage("")

    if (shiftKey && lastSelectedDay !== null && lastSelectedDay !== day) {
      const range: string[] = []
      for (let d = Math.min(lastSelectedDay, day); d <= Math.max(lastSelectedDay, day); d++) {
        if (!isDateInPast(d) && !isDateTooFar(d) && !isDateBooked(d) && isDateUnavailable(d) === isUnavailable) range.push(getDateString(d))
      }
      setSelectedDates((prev) =>
        range.every((d) => prev.includes(d)) ? prev.filter((d) => !range.includes(d)) : [...new Set([...prev, ...range])],
      )
    } else {
      setSelectedDates((prev) => (prev.includes(date) ? prev.filter((d) => d !== date) : [...prev, date]))
    }
    setLastSelectedDay(day)
  }

  const handleAction = () => {
    if (!selectionMode || isSaving) return
    const available = selectionMode === "unavailable"
    const dates = selectedDates
    setError(null)
    setSavedMessage("")
    startSaving(async () => {
      let result: SaveAvailabilityResult
      try {
        result = await saveMyAvailability({ dates, available })
      } catch {
        // The request itself failed, e.g. no connection.
        result = { ok: false, error: "FAILED" }
      }
      if (!result.ok) {
        setError(result.error)
        return
      }
      setMarkedUnavailable(result.unavailableDates)
      resetSelection()
      setSavedMessage(
        available
          ? tr(`Opgeslagen: ${dates.length} datum(s) weer beschikbaar.`, `Saved: ${dates.length} date(s) available again.`)
          : tr(`Opgeslagen: ${dates.length} datum(s) niet beschikbaar.`, `Saved: ${dates.length} date(s) unavailable.`),
      )
    })
  }

  const resetSelection = () => {
    setSelectedDates([])
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
      const isSelected = selectedDates.includes(dateStr)
      const isPast = isDateInPast(day)
      const isTooFar = isDateTooFar(day)
      const isDisabledByMode =
        (selectionMode === "available" && unavailable) || (selectionMode === "unavailable" && !unavailable)

      let classes = "aspect-square w-full text-sm rounded-md flex items-center justify-center transition-colors relative "

      if (booked) {
        classes += isPast
          ? "bg-blue-600/40 text-white/70 font-medium"
          : "bg-blue-600 text-white font-medium hover:bg-blue-700"
      } else if (isPast || isTooFar) {
        classes += "cursor-not-allowed bg-muted/40 text-muted-foreground/60 line-through"
      } else if (isDisabledByMode) {
        classes += unavailable ? "bg-red-600/50 text-white/50 font-medium cursor-not-allowed" : "text-zinc-700/50 dark:text-zinc-400/50 bg-zinc-200/50 dark:bg-zinc-700/50 cursor-not-allowed"
      } else if (unavailable && isSelected) {
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
          aria-label={[
            formatEventDate(dateStr, locale),
            isPast || isTooFar ? "" : unavailable ? tr("niet beschikbaar", "unavailable") : tr("beschikbaar", "available"),
            pending ? `${bt.calendar.pendingRequest}: ${pending.eventName}` : "",
          ].filter(Boolean).join(", ")}
          aria-pressed={isSelected}
          onClick={(e) => toggleDateSelection(day, e.shiftKey)}
          disabled={isPast || isTooFar || isDisabledByMode || isSaving}
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
    { swatch: "bg-red-600", label: tr("Niet beschikbaar", "Unavailable") },
    { swatch: "bg-green-600", label: tr("Geselecteerd", "Selected") },
    { swatch: "bg-zinc-200 dark:bg-zinc-700", label: tr("Beschikbaar", "Available") },
    { swatch: "border border-border bg-muted/40", label: tr("Voorbij", "Past") },
  ]

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 md:p-8 lg:p-10">
      <h1 className="mb-2 text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{t.calendarTitle}</h1>
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
              <button type="button" onClick={goToPreviousMonth} disabled={isSaving} aria-label={tr("Vorige maand", "Previous month")} className="touch-manipulation rounded-lg bg-accent p-1.5 text-foreground transition-colors hover:bg-muted sm:p-2">
                <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
              <span className="text-sm font-semibold text-foreground sm:text-base md:text-lg">
                {months[currentMonth]} {currentYear}
              </span>
              <button type="button" onClick={goToNextMonth} disabled={isSaving} aria-label={tr("Volgende maand", "Next month")} className="touch-manipulation rounded-lg bg-accent p-1.5 text-foreground transition-colors hover:bg-muted sm:p-2">
                <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>

            <div className="mb-2 grid grid-cols-7 gap-0.5 sm:gap-1">
              {tr("ma di wo do vr za zo", "Mo Tu We Th Fr Sa Su").split(" ").map((day, index) => (
                <div key={index} className="flex h-6 items-center justify-center text-center text-xs font-semibold text-muted-foreground sm:h-8">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-0.5 sm:gap-1">{renderCalendar()}</div>

            <button
              type="button"
              onClick={handleAction}
              aria-busy={isSaving}
              className={`mt-3 flex w-full touch-manipulation items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-medium transition-colors disabled:cursor-not-allowed sm:mt-4 sm:py-3 sm:text-sm ${
                selectionMode === "available"
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : selectionMode === "unavailable"
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : "bg-muted text-muted-foreground"
              }`}
              disabled={selectionMode === null || isSaving}
            >
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              {isSaving
                ? tr("Opslaan…", "Saving…")
                : selectionMode === "available"
                  ? `${t.markAsUnavailable} (${selectedDates.length})`
                  : selectionMode === "unavailable"
                    ? `${t.markAsAvailable} (${selectedDates.length})`
                    : t.selectDates}
            </button>
            {error && (
              <p role="alert" className="mt-2 text-sm text-red-600">
                {errorText[error]}
              </p>
            )}
            <p role="status" className="mt-2 text-sm text-muted-foreground empty:hidden">
              {savedMessage}
            </p>
          </div>

          <div>
            <h2 className="mb-3 text-lg font-semibold text-foreground sm:mb-4">{bt.overview.upcoming}</h2>
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
                        <span className="block truncate first-letter:uppercase">{formatEventDate(event.eventDate, locale)}</span>
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
