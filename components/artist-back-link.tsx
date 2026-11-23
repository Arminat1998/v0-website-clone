"use client"

import { useEffect } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { markArtistViewed, markListReturnPending } from "@/lib/artiest-list-state"

export function ArtistBackLink({ artistId, photo = false }: { artistId: number; photo?: boolean }) {
  const nl = useLanguage().language !== "en"
  useEffect(() => {
    // Only the artist list keeps its place and the seen profiles.
    if (photo) return
    markListReturnPending()
    markArtistViewed(artistId)
  }, [artistId, photo])

  return (
    <Link
      href={photo ? "/photo-video" : "/artiesten"}
      className="mb-1 ml-3 inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring sm:ml-0"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden />
      {photo ? (nl ? "Alle fotografen en videografen" : "All photographers and videographers") : nl ? "Alle artiesten" : "All artists"}
    </Link>
  )
}
