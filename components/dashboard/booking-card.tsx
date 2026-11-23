"use client"

import Link from "next/link"
import { ArrowRight, Calendar, Clock, MapPin, Users } from "lucide-react"
import { useBookingT } from "@/lib/booking-i18n"
import type { Booking } from "@/lib/db/schema"
import type { InvoiceSummary } from "@/app/actions/bookings"
import { displayStatus } from "@/lib/bookings/display-status"
import { canonicalEventType, eventTypeLabel } from "@/lib/profile-options"
import { formatEuro } from "@/lib/bookings/pricing"
import { clientName, daysUntil, formatEventDate, formatShortDate } from "@/lib/bookings/format"
import { BookingStatusBadge, InvoiceStatusBadge, PayoutStatusBadge } from "./booking-status-badge"

/** `headingLevel`: 2 in a list right below the page title, 3 inside a section with its own heading. */
export function BookingCard({
  booking,
  headingLevel = 2,
}: {
  booking: Booking & { invoice?: InvoiceSummary | null }
  headingLevel?: 2 | 3
}) {
  const Heading = headingLevel === 2 ? "h2" : "h3"
  const { t, locale } = useBookingT()
  const needsInvoice = booking.status === "completed" && booking.invoice === null
  const days = daysUntil(booking.eventDate)
  const status = displayStatus(booking)
  const isNew = status === "pending" && Date.now() - new Date(booking.createdAt).getTime() < 48 * 3600 * 1000

  const countdown =
    booking.status !== "accepted"
      ? null
      : days === 0
        ? t.accepted.today
        : days > 0
          ? t.accepted.daysLeft(days)
          : t.accepted.pastDue

  return (
    <Link
      href={booking.status === "completed" ? `/dashboard/bookings/${booking.id}/invoice` : `/dashboard/bookings/${booking.id}`}
      className={`group block rounded-xl border bg-card p-5 shadow-sm transition-colors hover:border-brand/40 focus-visible:outline-2 focus-visible:outline-ring md:p-6 ${needsInvoice ? "border-amber-500/40" : "border-border"}`}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <BookingStatusBadge status={status} />
            {isNew && (
              <span className="inline-flex items-center rounded-md bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-700 dark:text-red-400">
                {t.requests.newBadge}
              </span>
            )}
            {countdown && <span className="text-xs font-medium text-muted-foreground">{countdown}</span>}
            {booking.status === "completed" && booking.invoice !== undefined && <InvoiceStatusBadge status={booking.invoice?.status ?? null} />}
            {booking.status === "completed" && !needsInvoice && <PayoutStatusBadge status={booking.payoutStatus} />}
          </div>

          <Heading className="mt-3 text-lg font-semibold text-foreground md:text-xl">{booking.eventName}</Heading>
          <p className="text-sm text-muted-foreground">
            {clientName(booking)}
            {booking.companyName ? ` · ${booking.companyName}` : ""}
          </p>

          <dl className="mt-4 grid grid-cols-1 gap-2 text-sm text-muted-foreground sm:grid-cols-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 flex-shrink-0" aria-hidden />
              <dd className="first-letter:uppercase">{formatEventDate(booking.eventDate, locale)}</dd>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 flex-shrink-0" aria-hidden />
              <dd>
                {booking.startTime} – {booking.endTime} ({Number(booking.hours)} {t.common.hours})
              </dd>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 flex-shrink-0" aria-hidden />
              <dd>
                {booking.city}
                {booking.distanceKm ? ` · ${booking.distanceKm} ${t.common.km}` : ""}
              </dd>
            </div>
            {booking.capacity && (
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 flex-shrink-0" aria-hidden />
                <dd>
                  {booking.capacity} {t.common.guests}
                </dd>
              </div>
            )}
          </dl>

          {booking.eventTypes.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {booking.eventTypes.map((type) => (
                <span key={type} className="rounded-md border border-border px-2 py-0.5 text-xs text-foreground">
                  {eventTypeLabel(canonicalEventType(type), locale.startsWith("nl"))}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-row flex-wrap items-end justify-between gap-4 md:flex-col md:flex-nowrap md:items-end md:text-right">
          <div>
            <div className="text-xs font-medium text-muted-foreground">
              {t.requests.yourEarnings}
              {booking.status === "pending" ? ` (${t.requests.indicative})` : ""}
            </div>
            <div className="text-2xl font-bold tabular-nums text-foreground">{formatEuro(booking.payoutCents, locale)}</div>
            {booking.status === "completed" && booking.paidOutAt && (
              <div className="text-xs text-muted-foreground">
                {t.completed.paidOutOn} {formatShortDate(booking.paidOutAt, locale)}
              </div>
            )}
            {booking.status === "pending" && (
              <div className="text-xs text-muted-foreground">
                {t.common.requestedOn} {formatShortDate(booking.createdAt, locale)}
              </div>
            )}
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-sm font-medium text-red-700 dark:text-red-400 group-hover:underline">
            {booking.status === "completed"
              ? needsInvoice
                ? (locale.startsWith("nl") ? "Factuur uploaden / indienen" : "Upload / submit invoice")
                : (locale.startsWith("nl") ? "Factuur bekijken" : "View invoice")
              : booking.status === "accepted" ? t.common.openRunSheet : t.common.viewDetails}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </span>
        </div>
      </div>
    </Link>
  )
}
