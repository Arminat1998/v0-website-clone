"use client"

import { useBookGuard } from "@/hooks/use-book-guard"
import { useState } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight, MapPin } from "lucide-react"
import { bookingHref, useWebsite } from "@/components/artist-website/website-context"

const UPCOMING = [
  { title: "Private Party", date: "Dec 21, 2025", city: "Eindhoven" },
  { title: "Private Party", date: "Dec 31, 2025", city: "Zwolle" },
  { title: "Private Wedding", date: "May 8, 2026", city: "Baarn" },
  { title: "Private Wedding", date: "May 9, 2026", city: "Amsterdam" },
]

export function AvailabilitySection() {
  const bookGuard = useBookGuard()
  const { artist, t, edit } = useWebsite()
  const today = new Date()
  const [month, setMonth] = useState(today.getMonth())
  const [year, setYear] = useState(today.getFullYear())
  const [selected, setSelected] = useState<number | null>(null)

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDay = (new Date(year, month, 1).getDay() + 6) % 7
  const monthLabel = new Date(year, month, 1).toLocaleDateString(t.locale, { month: "long", year: "numeric" })
  const dateKey = (day: number) => `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())

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
          <span className="size-4 rounded bg-green-600" aria-hidden="true" />
          {t.selected}
        </li>
        <li className="flex items-center gap-2">
          <span className="size-4 rounded bg-red-600" aria-hidden="true" />
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
              aria-label="Previous month"
              className="rounded-lg bg-secondary p-2 text-foreground transition-colors hover:bg-accent"
            >
              <ChevronLeft className="size-5" aria-hidden="true" />
            </button>
            <span className="text-lg font-semibold capitalize text-foreground">{monthLabel}</span>
            <button
              type="button"
              onClick={() => shift(1)}
              aria-label="Next month"
              className="rounded-lg bg-secondary p-2 text-foreground transition-colors hover:bg-accent"
            >
              <ChevronRight className="size-5" aria-hidden="true" />
            </button>
          </div>

          <div className="mb-1 grid grid-cols-7 gap-1">
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
              const isPast = new Date(year, month, day) < startOfToday
              const isUnavailable = artist.unavailableDates?.includes(dateKey(day))
              const isSelected = selected === day
              const state = isPast
                ? "cursor-not-allowed bg-muted/40 text-muted-foreground/60 line-through"
                : isUnavailable
                  ? "cursor-not-allowed bg-red-600 font-medium text-white"
                  : isSelected
                    ? "bg-green-600 font-medium text-white ring-2 ring-green-400"
                    : "bg-muted text-foreground hover:bg-accent"
              return (
                <button
                  key={day}
                  type="button"
                  disabled={isPast || isUnavailable}
                  aria-pressed={isSelected}
                  onClick={() => setSelected(isSelected ? null : day)}
                  className={`flex aspect-square items-center justify-center rounded-md text-sm transition-colors ${state}`}
                >
                  {day}
                </button>
              )
            })}
          </div>

          {!edit && (
            <Link
              href={selected ? bookingHref(artist, `${selected}-${month + 1}-${year}`) : "#"}
              aria-disabled={!selected}
              onClick={(event) => {
                if (!selected) event.preventDefault()
                else bookGuard(bookingHref(artist, `${selected}-${month + 1}-${year}`), event)
              }}
              className={`mt-4 block w-full rounded-lg py-3 text-center text-sm font-medium transition-colors ${
                selected ? "bg-red-700 text-white hover:bg-red-600" : "pointer-events-none bg-secondary text-muted-foreground"
              }`}
            >
              {selected ? t.book : t.selectDate}
            </Link>
          )}
        </div>

        <div>
          <h3 className="mb-3 text-lg font-semibold text-red-600">{t.upcoming}</h3>
          <ul className="space-y-3">
            {UPCOMING.map((item) => (
              <li key={`${item.title}-${item.date}`} className="rounded-r-lg border-l-4 border-red-500 bg-muted p-4">
                <p className="text-sm font-semibold text-foreground">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.date}</p>
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="size-3 text-red-500" aria-hidden="true" />
                  {item.city}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
