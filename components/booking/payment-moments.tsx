"use client"

import { DEPOSIT_PERCENT } from "@/lib/bookings/payments"
import { useLanguage } from "@/contexts/language-context"
import { cn } from "@/lib/utils"

/** The three payment moments, same wording as step 4 of the booking flow ("Zo betaal je"). */
export function paymentMoments(nl: boolean) {
  const tr = (n: string, e: string) => (nl ? n : e)
  return [
    { title: tr("Nu", "Now"), text: tr("Je verstuurt je aanvraag en betaalt nog niets.", "You send your request and pay nothing yet.") },
    {
      title: tr("Na goedkeuring", "After approval"),
      text: tr(`Je krijgt een offerte en betaalt ${DEPOSIT_PERCENT}% aan. Daarmee is je boeking definitief.`, `You receive a quote and pay a ${DEPOSIT_PERCENT}% deposit. That makes your booking final.`),
    },
    {
      title: tr("Na het evenement", "After the event"),
      text: tr("Je betaalt het restant met de eindfactuur. Extra kosten, zoals een extra uur of parkeren, staan daar apart op.", "You pay the rest with the final invoice. Extra costs, such as an extra hour or parking, are listed there separately."),
    },
  ]
}

/** Short version for before booking: one line per moment, no amounts. */
export function PaymentMoments({ className }: { className?: string }) {
  const nl = useLanguage().language !== "en"
  return (
    <div className={cn("text-left", className)}>
      <h3 className="text-sm font-semibold text-foreground">{nl ? "Zo betaal je" : "How you pay"}</h3>
      <ol className="mt-2 space-y-1.5 text-xs text-muted-foreground">
        {paymentMoments(nl).map(({ title, text }, index) => (
          <li key={title} className="flex gap-2">
            <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border border-border text-[11px] font-medium" aria-hidden="true">{index + 1}</span>
            <span><span className="font-medium text-foreground">{title}:</span> {text}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}
