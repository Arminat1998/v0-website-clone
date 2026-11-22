"use client"

import { CalendarCheck, CheckCircle2, Inbox } from "lucide-react"
import { AccountEmpty, AccountHeading } from "@/components/account/account-common"
import { Card, CardContent } from "@/components/ui/card"
import { useBookingT } from "@/lib/booking-i18n"
import type { BookingListItem } from "@/app/actions/bookings"
import { BookingCard } from "./booking-card"
import { EarningsSummary } from "./earnings-summary"

type Variant = "requests" | "accepted" | "completed"

export function BookingList({ variant, bookings }: { variant: Variant; bookings: BookingListItem[] }) {
  const { t, locale } = useBookingT()
  const nl = locale.startsWith("nl")
  const copy = variant === "requests" ? t.requests : variant === "accepted" ? t.accepted : t.completed

  const empty =
    variant === "requests"
      ? {
          icon: Inbox,
          title: nl ? "Geen openstaande aanvragen" : "No open requests",
          description: nl ? "Nieuwe aanvragen verschijnen hier automatisch." : "New requests show up here automatically.",
        }
      : variant === "accepted"
        ? {
            icon: CalendarCheck,
            title: nl ? "Nog geen geaccepteerde boekingen" : "No accepted bookings yet",
            description: nl ? "Accepteer je een aanvraag, dan staat het optreden hier." : "Accept a request and the gig appears here.",
          }
        : {
            icon: CheckCircle2,
            title: nl ? "Nog geen afgeronde boekingen" : "No completed bookings yet",
            description: nl ? "Rond je een optreden af, dan vind je hier je verdiensten." : "Complete a gig and your earnings appear here.",
          }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-8 lg:p-10">
      <AccountHeading title={copy.title} description={copy.subtitle} />

      {variant === "completed" && bookings.length > 0 && <EarningsSummary bookings={bookings} />}

      {variant === "accepted" && bookings.length > 0 && (
        <p className="text-sm text-muted-foreground">{t.calendar.blockedNote}</p>
      )}

      {bookings.length === 0 ? (
        <Card>
          <CardContent>
            <AccountEmpty icon={empty.icon} title={empty.title} description={empty.description} />
          </CardContent>
        </Card>
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
