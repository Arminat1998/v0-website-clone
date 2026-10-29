"use client"

import { useEffect } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { markArtistViewed, markListReturnPending } from "@/lib/artiest-list-state"

export function ArtistBackLink({ artistId }: { artistId: number }) {
  useEffect(() => {
    markListReturnPending()
    markArtistViewed(artistId)
  }, [artistId])

  return (
    <Link
      href="/artiesten"
      className="mb-3 ml-3 sm:ml-0 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" />
      Alle artiesten
    </Link>
  )
}
