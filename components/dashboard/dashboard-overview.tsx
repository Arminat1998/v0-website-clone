"use client"

import Link from "next/link"
import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, Banknote, Bell, CalendarCheck, Clock, FileText, Hourglass, Inbox, MapPin, Wallet } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { useBookingT } from "@/lib/booking-i18n"
import type { DashboardSummary } from "@/app/actions/bookings"
import { markAllNotificationsRead } from "@/app/actions/bookings"
import type { Notification } from "@/lib/db/schema"
import { formatEuro } from "@/lib/bookings/pricing"
import { clientName, daysUntil, formatDateTime, formatEventDate } from "@/lib/bookings/format"
import { BookingCard } from "./booking-card"

const notificationIcon: Record<Notification["type"], typeof Bell> = {
  new_request: Inbox,
  payment: Banknote,
  payout: Wallet,
  reminder: Clock,
}

export function DashboardOverview({ summary }: { summary: DashboardSummary }) {
  const { t } = useLanguage()
  const { t: bt, locale } = useBookingT()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const stats = [
    {
      label: bt.overview.newRequests,
      value: summary.pendingCount.toString(),
      icon: Inbox,
      tone: "bg-green-500/10 text-green-500",
      href: "/dashboard/booking-requests",
    },
    {
      label: bt.overview.upcoming,
      value: summary.upcomingCount.toString(),
      icon: CalendarCheck,
      tone: "bg-blue-500/10 text-blue-500",
      href: "/dashboard/accepted-bookings",
    },
    {
      label: bt.overview.awaitingPayout,
      value: formatEuro(summary.awaitingPayoutCents, locale),
      icon: Hourglass,
      tone: "bg-amber-500/10 text-amber-500",
      href: "/dashboard/completed-bookings",
    },
    {
      label: bt.overview.earnedThisYear,
      value: formatEuro(summary.earnedThisYearCents, locale),
      icon: Wallet,
      tone: "bg-red-500/10 text-red-500",
      href: "/dashboard/completed-bookings",
    },
  ]

  const next = summary.nextBooking
  const nextDays = next ? daysUntil(next.eventDate) : null

  return (
    <div className="min-h-screen bg-background p-6 md:p-8 lg:p-10">
      <h1 className="mb-6 text-2xl font-bold text-foreground md:mb-8 md:text-3xl lg:text-4xl">{t.welcomeToDashboard}</h1>

      <dl className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:mb-8 md:gap-6">
        {stats.map(({ label, value, icon: Icon, tone, href }) => (
          <Link key={label} href={href} className="flex items-center gap-4 rounded-lg border border-border bg-card p-5 transition-colors hover:bg-accent md:p-6">
            <span className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg md:h-12 md:w-12 ${tone}`}>
              <Icon className="h-5 w-5 md:h-6 md:w-6" aria-hidden />
            </span>
            <div className="min-w-0">
              <dd className="truncate text-2xl font-bold text-foreground md:text-3xl">{value}</dd>
              <dt className="text-sm text-muted-foreground md:text-base">{label}</dt>
            </div>
          </Link>
        ))}
      </dl>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <section aria-labelledby="next-heading" className="rounded-lg border border-border bg-card p-5 md:p-6">
            <h2 id="next-heading" className="text-base font-semibold text-foreground">
              {bt.overview.nextEvent}
            </h2>
            {next ? (
              <Link href={`/dashboard/bookings/${next.id}`} className="group mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 flex-shrink-0 flex-col items-center justify-center rounded-lg bg-red-600 text-white">
                    <span className="text-2xl font-bold leading-none">{next.eventDate.slice(8, 10)}</span>
                    <span className="text-xs uppercase">{formatEventDate(next.eventDate, locale, "short").split(" ")[1]}</span>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-foreground group-hover:underline">{next.eventName}</div>
                    <div className="text-sm text-muted-foreground">{clientName(next)}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4" aria-hidden />
                        {next.startTime} – {next.endTime}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-4 w-4 text-red-500" aria-hidden />
                        {next.city}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                  <span className="rounded-md bg-blue-500/10 px-3 py-1 text-sm font-medium text-blue-500">
                    {nextDays === 0 ? bt.accepted.today : bt.accepted.daysLeft(nextDays ?? 0)}
                  </span>
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-red-500">
                    {bt.common.openRunSheet}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                  </span>
                </div>
              </Link>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">{bt.overview.noNextEvent}</p>
            )}
          </section>

          <section aria-labelledby="recent-heading">
            <div className="mb-3 flex items-center justify-between">
              <h2 id="recent-heading" className="text-base font-semibold text-foreground">
                {bt.overview.recentRequests}
              </h2>
              <Link href="/dashboard/booking-requests" className="inline-flex items-center gap-1 text-sm font-medium text-red-500 hover:underline">
                {bt.overview.viewAll}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
            {summary.recentRequests.length === 0 ? (
              <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">{bt.requests.empty}</div>
            ) : (
              <ul className="flex flex-col gap-4">
                {summary.recentRequests.map((booking) => (
                  <li key={booking.id}>
                    <BookingCard booking={booking} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="flex flex-col gap-6">
          <section aria-labelledby="notifications-heading" className="rounded-lg border border-border bg-card p-5 md:p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 id="notifications-heading" className="flex items-center gap-2 text-base font-semibold text-foreground">
                <Bell className="h-4 w-4 text-red-500" aria-hidden />
                {bt.overview.notifications}
                {summary.unreadCount > 0 && (
                  <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">{summary.unreadCount}</span>
                )}
              </h2>
              {summary.unreadCount > 0 && (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() =>
                    startTransition(async () => {
                      await markAllNotificationsRead()
                      router.refresh()
                    })
                  }
                  className="text-xs font-medium text-muted-foreground hover:text-foreground disabled:opacity-50"
                >
                  {bt.overview.markAllRead}
                </button>
              )}
            </div>
            {summary.notifications.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">{bt.overview.noNotifications}</p>
            ) : (
              <ul className="mt-4 flex flex-col gap-3">
                {summary.notifications.map((notification) => {
                  const Icon = notificationIcon[notification.type] ?? Bell
                  const content = (
                    <>
                      <span className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md ${notification.read ? "bg-muted text-muted-foreground" : "bg-red-500/10 text-red-500"}`}>
                        <Icon className="h-4 w-4" aria-hidden />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className={`text-sm ${notification.read ? "text-muted-foreground" : "font-semibold text-foreground"}`}>{notification.title}</div>
                        <p className="text-pretty text-sm leading-relaxed text-muted-foreground">{notification.body}</p>
                        <div className="mt-1 text-xs text-muted-foreground">{formatDateTime(notification.createdAt, locale)}</div>
                      </div>
                      {!notification.read && <span className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-red-600" aria-hidden />}
                    </>
                  )
                  return (
                    <li key={notification.id}>
                      {notification.bookingId ? (
                        <Link href={`/dashboard/bookings/${notification.bookingId}`} className="flex items-start gap-3 rounded-md p-2 transition-colors hover:bg-accent">
                          {content}
                        </Link>
                      ) : (
                        <div className="flex items-start gap-3 p-2">{content}</div>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          <Link href="/dashboard/agreement" className="flex items-center gap-4 rounded-lg border border-red-500/20 bg-card p-5 transition-colors hover:bg-accent md:p-6">
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-red-500/10 md:h-12 md:w-12">
              <FileText className="h-5 w-5 text-red-500 md:h-6 md:w-6" aria-hidden />
            </span>
            <div>
              <div className="text-lg font-semibold text-red-500">{t.actionNeeded}</div>
              <div className="text-sm text-muted-foreground">{t.agreementNotAccepted}</div>
            </div>
          </Link>
        </aside>
      </div>
    </div>
  )
}
