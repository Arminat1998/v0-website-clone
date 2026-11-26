"use client"

import { Route } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

/** Marks a request from further away than the professional's own travel range, so they can decide knowingly. */
export function OutsideRange({ distanceKm, rangeKm, detailed = false }: { distanceKm: number | null; rangeKm?: number | null; detailed?: boolean }) {
  const nl = useLanguage().language !== "en"
  if (!distanceKm || typeof rangeKm !== "number" || distanceKm <= rangeKm) return null
  const extra = distanceKm - rangeKm
  return (
    <p className="mt-2 flex items-start gap-2 rounded-md border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-sm text-foreground">
      <Route className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
      <span>
        <span className="font-semibold">{nl ? "Buiten je werkgebied" : "Outside your travel range"}</span>
        {nl ? `: ${distanceKm} km, ${extra} km verder dan jouw ${rangeKm} km.` : `: ${distanceKm} km, ${extra} km further than your ${rangeKm} km.`}
        {detailed &&
          (nl
            ? " De klant weet dit en heeft de aanvraag toch verstuurd. De reiskosten gelden voor de hele afstand; je beslist zelf of je gaat."
            : " The customer knows this and sent the request anyway. Travel costs apply to the full distance; you decide whether to go.")}
      </span>
    </p>
  )
}
