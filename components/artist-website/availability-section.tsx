"use client"

import { useBookGuard } from "@/hooks/use-book-guard"
import { useState } from "react"
import Link from "next/link"
import { CalendarX, ChevronLeft, ChevronRight, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { bookingHref, useWebsite } from "@/components/artist-website/website-context"
import { isDemoProfessional } from "@/lib/demo-professionals"
import { DemoBookButton } from "@/components/demo-book-button"

/** Example bookings, only ever shown on sample profiles. */
const SAMPLE_BOOKINGS = [
  { nl: "Privéfeest", en: "Private party", date: "2025-12-21", city: "Eindhoven" },
  { nl: "Privéfeest", en: "Private party", date: "2025-12-31", city: "Zwolle" },
  { nl: "Bruiloft", en: "Private wedding", date: "2026-05-08", city: "Baarn" },
  { nl: "Bruiloft", en: "Private wedding", date: "2026-05-09", city: "Amsterdam" },
]

const MAX_LISTED_DATES = 6

export function AvailabilitySection() {
  const bookGuard = useBookGuard()
  const { artist, t, edit } = useWebsite()
  const nl = t.locale.startsWith("nl")
  const demo = isDemoProfessional(artist.id)
  const today = new Date()
  const [month, setMonth] = useState(today.getMonth())
  const [year, setYear] = useState(today.getFullYear())
  const [selected, setSelected] = useState<number | null>(null)

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDay = (new Date(year, month, 1).getDay() + 6) % 7
  const monthLabel = new Date(year, month, 1).toLocaleDateString(t.locale, { month: "long", year: "numeric" })
  const keyOf = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
  const longDate = (key: string) =>
    new Date(`${key}T12:00:00`).toLocaleDateString(t.locale, { weekday: "long", day: "numeric", month: "long", year: "numeric" })
  const todayKey = keyOf(today)
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth()
  const upcomingUnavailable = (artist.unavailableDates ?? []).filter((key) => key >= todayKey).sort()
  const selectedHref = selected ? bookingHref(artist, `${selected}-${month + 1}-${year}`) : null

  function shift(direction: 1 | -1) {
    const next = new Date(year, month + direction, 1)
    setMonth(next.getMonth())
    setYear(next.getFullYear())
    setSelected(null)
  }

  return (
    <section className="rounded-xl border border-border bg-card p-4 sm:p-6">
      <h2 className="mb-4 text-xl font-bold text-foreground">{t.availabilityTitle}</h2>

      <ul className="mb-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
        <li className="flex items-center gap-2">
          <span className="size-4 rounded bg-green-700" aria-hidden="true" />
          {t.selected}
        </li>
        <li className="flex items-center gap-2">
          <span className="flex size-5 items-center justify-center rounded bg-red-600 text-[10px] text-white line-through" aria-hidden="true">
            31
          </span>
          {t.unavailable}
        </li>
        <li className="flex items-center gap-2">
          <span className="size-4 rounded bg-muted ring-1 ring-border" aria-hidden="true" />
          {t.available}
        </li>
        <li className="flex items-center gap-2">
          <span className="size-4 rounded bg-muted/40 ring-1 ring-border" aria-hidden="true" />
          {t.past}
        </li>
      </ul>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,460px)_minmax(0,1fr)]">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => shift(-1)}
              disabled={isCurrentMonth}
              aria-label={nl ? "Vorige maand" : "Previous month"}
              className="flex size-11 items-center justify-center rounded-lg bg-secondary text-foreground transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-40"
            >
              <ChevronLeft className="size-5" aria-hidden="true" />
            </button>
            <span className="text-lg font-semibold text-foreground first-letter:uppercase" aria-live="polite">
              {monthLabel}
            </span>
            <button
              type="button"
              onClick={() => shift(1)}
              aria-label={nl ? "Volgende maand" : "Next month"}
              className="flex size-11 items-center justify-center rounded-lg bg-secondary text-foreground transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"
            >
              <ChevronRight className="size-5" aria-hidden="true" />
            </button>
          </div>

          <div className="mb-1 grid grid-cols-7 gap-1" aria-hidden="true">
            {t.weekdays.map((day, index) => (
              <div key={index} className="flex h-8 items-center justify-center text-xs font-semibold text-muted-foreground">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }, (_, index) => (
              <div key={`empty-${index}`} />
            ))}
            {Array.from({ length: daysInMonth }, (_, index) => {
              const day = index + 1
              const key = keyOf(new Date(year, month, day))
              const isPast = key < todayKey
              const isUnavailable = artist.unavailableDates?.includes(key)
              const isSelected = selected === day
              // Not by color alone: taken and past days are also struck through, the chosen day is bold with a ring.
              const state = isPast
                ? "cursor-not-allowed bg-muted/40 text-muted-foreground/60 line-through"
                : isUnavailable
                  ? "cursor-not-allowed bg-red-600 font-medium text-white line-through"
                  : isSelected
                    ? "bg-green-700 font-bold text-white ring-2 ring-green-700 ring-offset-2 ring-offset-card"
                    : "bg-muted text-foreground hover:bg-accent"
              const status = isPast ? t.past : isUnavailable ? t.unavailable : t.available
              return (
                <button
                  key={day}
                  type="button"
                  disabled={isPast || isUnavailable}
                  aria-pressed={isSelected}
                  aria-label={`${longDate(key)}, ${status.toLowerCase()}`}
                  onClick={() => setSelected(isSelected ? null : day)}
                  className={`flex aspect-square items-center justify-center rounded-md text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${state}`}
                >
                  {day}
                </button>
              )
            })}
          </div>

          {!edit && demo && <DemoBookButton className="mt-4 h-11 w-full" />}
          {!edit &&
            !demo &&
            (selectedHref ? (
              <Button asChild className="mt-4 h-11 w-full bg-red-700 text-white hover:bg-red-600">
                <Link href={selectedHref} onClick={(event) => bookGuard(selectedHref, event)}>
                  {t.book}
                </Link>
              </Button>
            ) : (
              <p className="mt-4 rounded-lg bg-secondary py-3 text-center text-sm text-muted-foreground">{t.selectDate}</p>
            ))}
        </div>

        {demo ? (
          <div>
            <h3 className="mb-3 text-lg font-semibold text-foreground">
              {t.upcoming} ({nl ? "voorbeeld" : "sample"})
            </h3>
            <ul className="space-y-3">
              {SAMPLE_BOOKINGS.map((item) => (
                <li key={item.date} className="rounded-r-lg border-l-4 border-red-500 bg-muted p-4">
                  <p className="text-sm font-semibold text-foreground">{nl ? item.nl : item.en}</p>
                  <p className="text-xs text-muted-foreground">{longDate(item.date)}</p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="size-3 text-red-500" aria-hidden="true" />
                    {item.city}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div>
            <h3 className="mb-3 text-lg font-semibold text-foreground">{nl ? "Niet beschikbaar op" : "Not available on"}</h3>
            {upcomingUnavailable.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {nl ? "Er zijn geen bezette datums bekend." : "No taken dates are known."}
              </p>
            ) : (
              <>
                <ul className="space-y-2">
                  {upcomingUnavailable.slice(0, MAX_LISTED_DATES).map((key) => (
                    <li key={key} className="flex items-center gap-2 text-sm text-foreground">
                      <CalendarX className="size-4 shrink-0 text-red-600" aria-hidden="true" />
                      {longDate(key)}
                    </li>
                  ))}
                </ul>
                {upcomingUnavailable.length > MAX_LISTED_DATES && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {nl ? "Blader in de kalender voor meer datums." : "Browse the calendar for more dates."}
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
