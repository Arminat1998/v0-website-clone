"use client"

import { Inbox } from "lucide-react"
import { useBookingT } from "@/lib/booking-i18n"
import type { BookingListItem } from "@/app/actions/bookings"
import { BookingCard } from "./booking-card"
import { EarningsSummary } from "./earnings-summary"

type Variant = "requests" | "accepted" | "completed"

export function BookingList({ variant, bookings }: { variant: Variant; bookings: BookingListItem[] }) {
  const { t } = useBookingT()
  const copy = variant === "requests" ? t.requests : variant === "accepted" ? t.accepted : t.completed

  return (
    <div className="min-h-screen bg-background p-6 md:p-8 lg:p-10">
      <header className="mb-6 md:mb-8">
        <h1 className="text-2xl font-bold text-foreground md:text-3xl lg:text-4xl">{copy.title}</h1>
        <p className="mt-2 max-w-2xl text-pretty text-muted-foreground">{copy.subtitle}</p>
      </header>

      {variant === "completed" && bookings.length > 0 && <EarningsSummary bookings={bookings} />}

      {variant === "accepted" && bookings.length > 0 && (
        <p className="mb-4 text-sm text-muted-foreground">{t.calendar.blockedNote}</p>
      )}

      {bookings.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-card p-10 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Inbox className="h-6 w-6" aria-hidden />
          </span>
          <p className="max-w-sm text-pretty text-muted-foreground">{copy.empty}</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {bookings.map((booking) => (
            <li key={booking.id}>
              <BookingCard booking={booking} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
