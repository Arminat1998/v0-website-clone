"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, Loader2 } from "lucide-react"
import { completeBooking } from "@/app/actions/bookings"
import { useBookingT } from "@/lib/booking-i18n"
import type { Booking } from "@/lib/db/schema"
import { isTodayOrPast } from "@/lib/bookings/format"
import { Button } from "@/components/ui/button"
import { PaymentStatusBadge } from "./booking-status-badge"

export function BookingCompletePanel({ booking }: { booking: Booking }) {
  const { t } = useBookingT()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const canComplete = isTodayOrPast(booking.eventDate)

  return (
    <section aria-labelledby="complete-heading" className="rounded-lg border border-border bg-card p-5 md:p-6">
      <h2 id="complete-heading" className="text-base font-semibold text-foreground">
        {t.accepted.paymentTitle}
      </h2>
      <div className="mt-3 flex items-center justify-between gap-3 text-sm">
        <span className="text-muted-foreground">{t.paymentMethod[booking.paymentMethod]}</span>
        <PaymentStatusBadge status={booking.paymentStatus} />
      </div>

      <div className="mt-5 border-t border-border pt-5">
        <h3 className="text-base font-semibold text-foreground">{t.accepted.completeTitle}</h3>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          {canComplete ? t.accepted.completeNote : t.accepted.completeNotYet}
        </p>
        <Button
          disabled={!canComplete || isPending}
          onClick={() =>
            startTransition(async () => {
              await completeBooking(booking.id)
              // Invoicing is the natural next step, so land the DJ straight in that flow.
              router.push(`/dashboard/bookings/${booking.id}/invoice`)
            })
          }
          className="mt-4 w-full bg-red-600 text-white hover:bg-red-700 disabled:bg-muted disabled:text-muted-foreground"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
              {t.accepted.completing}
            </>
          ) : (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" aria-hidden />
              {t.accepted.markCompleted}
            </>
          )}
        </Button>
      </div>
    </section>
  )
}
