"use client"

import { useBookingT } from "@/lib/booking-i18n"
import type { Booking } from "@/lib/db/schema"
import { bookingVatCents } from "@/lib/bookings/pricing"

export function BookingPricingCard({ booking }: { booking: Booking }) {
  const { t, locale } = useBookingT()
  const performanceCents = Math.round(Number(booking.hours) * booking.hourlyRateCents)
  const vatCents = bookingVatCents(booking)
  const nl = locale.startsWith("nl")
  const isEstimate = booking.status === "pending"
  // Always two decimals in this card, so the amounts line up in one column
  const euro = (cents: number) =>
    new Intl.NumberFormat(locale, { style: "currency", currency: "EUR", minimumFractionDigits: 2 }).format(cents / 100)
  const amount = "shrink-0 whitespace-nowrap text-right tabular-nums"

  return (
    <section aria-labelledby="pricing-heading" className="rounded-xl border border-border bg-card p-5 shadow-sm md:p-6">
      <h2 id="pricing-heading" className="text-base font-semibold text-foreground">
        {isEstimate ? t.detail.priceTitle : t.common.receipt}
      </h2>
      <dl className="mt-4 flex flex-col gap-2 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">
            {t.detail.performance} ({Number(booking.hours)} {t.common.hours} x {euro(booking.hourlyRateCents)})
          </dt>
          <dd className={`${amount} font-medium text-foreground`}>{euro(performanceCents)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">{t.detail.equipmentLine}</dt>
          <dd className={`${amount} font-medium text-foreground`}>{euro(booking.equipmentCents)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">
            {t.detail.travelLine} ({booking.distanceKm * 2} {t.common.km} {t.detail.travelDetail})
          </dt>
          <dd className={`${amount} font-medium text-foreground`}>{euro(booking.travelCents)}</dd>
        </div>
        {vatCents > 0 && (
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">{nl ? "Btw" : "VAT"}</dt>
            <dd className={`${amount} font-medium text-foreground`}>{euro(vatCents)}</dd>
          </div>
        )}
        <div className="mt-2 flex justify-between gap-4 border-t border-border pt-3">
          <dt className="font-medium text-foreground">{vatCents > 0 ? (nl ? "Totaal incl. btw" : "Total incl. VAT") : t.detail.total}</dt>
          <dd className={`${amount} font-semibold text-foreground`}>{euro(booking.totalCents)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">{t.detail.platformFee}</dt>
          <dd className={`${amount} text-muted-foreground`}>− {euro(booking.platformFeeCents)}</dd>
        </div>
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t border-border pt-3">
          <dt className="font-semibold text-foreground">{t.detail.payout}</dt>
          <dd className={`${amount} text-xl font-bold text-green-800 dark:text-green-500`}>{euro(booking.payoutCents)}</dd>
        </div>
      </dl>
      {isEstimate && <p className="mt-4 text-xs leading-relaxed text-muted-foreground">{t.detail.priceNote}</p>}
    </section>
  )
}
