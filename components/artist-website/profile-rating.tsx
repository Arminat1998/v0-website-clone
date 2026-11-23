"use client"

import { Star } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/contexts/language-context"
import { isDemoProfessional } from "@/lib/demo-professionals"
import type { Artist } from "@/lib/smart-search"

/** Short score on a card, e.g. "4,5 (2)"; nothing on sample profiles or without reviews. */
export function CardRating({ professional }: { professional: Pick<Artist, "id" | "rating" | "reviews"> }) {
  const nl = useLanguage().language === "nl"
  if (isDemoProfessional(professional.id) || !professional.reviews) return null
  return (
    <span className="ml-auto flex shrink-0 items-center gap-1 pl-2 pt-0.5 text-sm leading-tight text-muted-foreground">
      <Star className="size-3.5 fill-yellow-400 text-yellow-400" aria-hidden="true" />
      <span className="font-semibold text-foreground">
        {professional.rating.toLocaleString(nl ? "nl-NL" : "en-GB", { maximumFractionDigits: 1 })}
        <span className="sr-only">{nl ? " van 5 sterren" : " out of 5 stars"}</span>
      </span>
      <span>
        ({professional.reviews}
        <span className="sr-only"> {professional.reviews === 1 ? "review" : "reviews"}</span>)
      </span>
    </span>
  )
}

/** Rating on the profile modal and page: never stars without reviews, and no made-up rating on sample profiles. */
export function ProfileRating({ artist }: { artist: Artist }) {
  const nl = useLanguage().language === "nl"
  if (isDemoProfessional(artist.id)) return <Badge variant="secondary">{nl ? "Voorbeeldprofiel" : "Sample profile"}</Badge>
  if (!artist.reviews) return <Badge variant="secondary">{nl ? "Nieuw op ARSI" : "New on ARSI"}</Badge>
  return (
    <span className="flex items-center gap-2 text-sm text-muted-foreground">
      <span className="flex" aria-hidden="true">
        {Array.from({ length: 5 }, (_, index) => (
          <Star
            key={index}
            className={`size-4 ${index < Math.round(artist.rating) ? "fill-yellow-400 text-yellow-400" : "fill-muted text-muted"}`}
          />
        ))}
      </span>
      <span className="font-semibold text-foreground">
        {artist.rating.toLocaleString(nl ? "nl-NL" : "en-GB", { maximumFractionDigits: 1 })}
        <span className="sr-only">{nl ? " van 5 sterren" : " out of 5 stars"}</span>
      </span>
      <span>
        ({artist.reviews} {artist.reviews === 1 ? "review" : "reviews"})
      </span>
    </span>
  )
}
