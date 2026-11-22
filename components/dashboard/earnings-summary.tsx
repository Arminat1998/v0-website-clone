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
    { label: t.completed.paidOut, value: formatEuro(paidOut, locale), icon: Banknote, tone: "text-green-700 dark:text-green-500" },
    { label: t.completed.awaitingPayout, value: formatEuro(awaiting, locale), icon: Hourglass, tone: "text-amber-800 dark:text-amber-500" },
    { label: `${t.completed.eventsCount} ${t.completed.thisYear}`, value: thisYear.toString(), icon: CalendarCheck, tone: "text-foreground" },
  ]

  return (
    <dl className="grid grid-cols-2 gap-4 xl:grid-cols-4">
      {stats.map(({ label, value, icon: Icon, tone }) => (
        <div key={label} className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:gap-4 sm:p-6">
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-700 dark:text-red-400">
            <Icon className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <dd className={`text-xl font-semibold tabular-nums sm:text-2xl ${tone}`}>{value}</dd>
            <dt className="text-sm text-muted-foreground">{label}</dt>
          </div>
        </div>
      ))}
    </dl>
  )
}
