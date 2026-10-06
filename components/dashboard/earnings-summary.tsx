"use client"

import { Banknote, CalendarCheck, Hourglass, Wallet } from "lucide-react"
import { useBookingT } from "@/lib/booking-i18n"
import type { Booking } from "@/lib/db/schema"
import { formatEuro } from "@/lib/bookings/pricing"

export function EarningsSummary({ bookings }: { bookings: Booking[] }) {
  const { t, locale } = useBookingT()
  const year = new Date().getFullYear().toString()

  const total = bookings.reduce((sum, b) => sum + b.payoutCents, 0)
  const paidOut = bookings.filter((b) => b.payoutStatus === "paid").reduce((sum, b) => sum + b.payoutCents, 0)
  const awaiting = total - paidOut
  const thisYear = bookings.filter((b) => b.eventDate.startsWith(year)).length

  const stats = [
    { label: t.completed.totalEarned, value: formatEuro(total, locale), icon: Wallet, tone: "text-foreground" },
    { label: t.completed.paidOut, value: formatEuro(paidOut, locale), icon: Banknote, tone: "text-green-500" },
    { label: t.completed.awaitingPayout, value: formatEuro(awaiting, locale), icon: Hourglass, tone: "text-amber-500" },
    { label: `${t.completed.eventsCount} ${t.completed.thisYear}`, value: thisYear.toString(), icon: CalendarCheck, tone: "text-foreground" },
  ]

  return (
    <dl className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:mb-8">
      {stats.map(({ label, value, icon: Icon, tone }) => (
        <div key={label} className="flex items-center gap-4 rounded-lg border border-border bg-card p-5">
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-500">
            <Icon className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <dd className={`truncate text-2xl font-bold ${tone}`}>{value}</dd>
            <dt className="text-sm text-muted-foreground">{label}</dt>
          </div>
        </div>
      ))}
    </dl>
  )
}
