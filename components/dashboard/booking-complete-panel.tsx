"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, Loader2 } from "lucide-react"
import { completeBooking } from "@/app/actions/bookings"
import { useBookingT } from "@/lib/booking-i18n"
import type { Booking } from "@/lib/db/schema"
import { isTodayOrPast } from "@/lib/bookings/format"
import { Button } from "@/components/ui/button"
import { PaymentStatusBadge } from "./booking-status-badge"

export function BookingCompletePanel({ booking }: { booking: Booking }) {
  const { t, locale } = useBookingT()
  const nl = locale.startsWith("nl")
  const [error, setError] = useState("")
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const canComplete = isTodayOrPast(booking.eventDate)

  return (
    <section aria-labelledby="complete-heading" className="rounded-xl border border-border bg-card p-5 shadow-sm md:p-6">
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
          variant="brand"
          disabled={!canComplete || isPending}
          onClick={() =>
            startTransition(async () => {
              setError("")
              const result = await completeBooking(booking.id).catch(() => null)
              if (!result?.ok) {
                setError(
                  result?.error === "TOO_EARLY"
                    ? nl
                      ? "Je kunt dit optreden pas op de dag zelf afronden."
                      : "You can only complete this gig on the day itself."
                    : result
                      ? nl
                        ? "Deze boeking is niet meer open. Ververs de pagina."
                        : "This booking is no longer open. Refresh the page."
                      : nl
                        ? "Afronden is niet gelukt. Probeer het opnieuw."
                        : "Completing failed. Please try again.",
                )
                return
              }
              // Invoicing is the natural next step, so land the DJ straight in that flow.
              router.push(`/dashboard/bookings/${booking.id}/invoice`)
            })
          }
          className="mt-4 w-full bg-red-700 text-white hover:bg-red-600 disabled:bg-muted disabled:text-muted-foreground"
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
        {error && (
          <p role="alert" className="mt-3 text-sm text-red-700 dark:text-red-400">
            {error}
          </p>
        )}
      </div>
    </section>
  )
}
