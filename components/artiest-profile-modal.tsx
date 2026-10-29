"use client"

import Link from "next/link"
import { X, ExternalLink } from "lucide-react"
import { Dialog, DialogContent, DialogClose, DialogTitle } from "@/components/ui/dialog"
import { ArtistProfileView } from "@/components/artist-profile-view"
import { getArtistPath } from "@/lib/artist-slug"
import type { Artist } from "@/lib/smart-search"

interface ArtiestProfileModalProps {
  artist: Artist | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ArtiestProfileModal({ artist, open, onOpenChange }: ArtiestProfileModalProps) {
  if (!artist) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[98vw] max-w-[98vw] sm:max-w-[600px] md:max-w-[900px] lg:max-w-[1200px] xl:max-w-[1400px] max-h-[95vh] sm:max-h-[90vh] overflow-y-auto p-0 bg-background">
        <DialogTitle className="sr-only">{artist.name}</DialogTitle>
        <ArtistProfileView
          artist={artist}
          onNavigate={() => onOpenChange(false)}
          heroAction={
            <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
              <Link
                href={getArtistPath(artist)}
                className="flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-2 text-xs font-medium text-white backdrop-blur transition-colors hover:bg-black/80"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Volledige pagina
              </Link>
              <DialogClose className="rounded-full bg-red-700 p-2 text-white transition-colors hover:bg-red-600">
                <X className="h-4 w-4" />
                <span className="sr-only">Sluiten</span>
              </DialogClose>
            </div>
          }
        />
      </DialogContent>
    </Dialog>
  )
}
