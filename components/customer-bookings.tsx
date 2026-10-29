"use client"

import Link from "next/link"
import { CalendarDays, Clock, MapPin } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/contexts/language-context"
import { formatEuro } from "@/lib/bookings/pricing"
import type { CustomerBooking } from "@/app/actions/bookings"

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  accepted: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  completed: "bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-500/30",
  rejected: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30",
}

const STATUS_LABELS: Record<string, { nl: string; en: string }> = {
  pending: { nl: "In afwachting", en: "Pending" },
  accepted: { nl: "Geaccepteerd", en: "Accepted" },
  completed: { nl: "Afgerond", en: "Completed" },
  rejected: { nl: "Afgewezen", en: "Declined" },
}

function formatDate(iso: string, locale: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(locale, {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export function CustomerBookings({ bookings }: { bookings: CustomerBooking[] }) {
  const lang = useLanguage().language === "nl" ? "nl" : "en"

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold text-foreground text-balance">
        {lang === "nl" ? "Mijn boekingen" : "My bookings"}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {lang === "nl" ? "Volg hier de status van je aanvragen." : "Track the status of your requests here."}
      </p>

      {bookings.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-border p-8 text-center">
          <p className="text-muted-foreground">
            {lang === "nl" ? "Je hebt nog geen boekingen." : "You have no bookings yet."}
          </p>
          <Button asChild className="mt-4 bg-red-700 hover:bg-red-600 text-white">
            <Link href="/artiesten">{lang === "nl" ? "Bekijk artiesten" : "Browse artists"}</Link>
          </Button>
        </div>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {bookings.map((booking) => (
            <li key={booking.id} className="rounded-xl border border-border bg-card p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="font-semibold text-foreground truncate">{booking.eventName}</h2>
                  <p className="text-sm text-muted-foreground">{booking.professionalName}</p>
                </div>
                <Badge variant="outline" className={STATUS_STYLES[booking.status]}>
                  {STATUS_LABELS[booking.status]?.[lang] ?? booking.status}
                </Badge>
              </div>
              <dl className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 shrink-0" />
                  <dd>{formatDate(booking.eventDate, lang === "nl" ? "nl-NL" : "en-GB")}</dd>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 shrink-0" />
                  <dd>
                    {booking.startTime} - {booking.endTime}
                  </dd>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <dd className="truncate">{booking.city}</dd>
                </div>
              </dl>
              <p className="mt-3 text-sm font-medium text-foreground">{formatEuro(booking.totalCents)}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
