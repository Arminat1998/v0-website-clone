"use client"

import Link from "next/link"
import { useEffect } from "react"
import useSWR from "swr"
import { trackUserTest } from "@/lib/usertest"
import { X, ExternalLink } from "lucide-react"
import { Dialog, DialogContent, DialogClose, DialogTitle } from "@/components/ui/dialog"
import { useLanguage } from "@/contexts/language-context"
import { ArtistProfileView } from "@/components/artist-profile-view"
import { getArtistPath } from "@/lib/artist-slug"
import type { Artist } from "@/lib/smart-search"
import { isDemoProfessional } from "@/lib/demo-professionals"
import { withPageContent } from "@/lib/artist-page-types"
import { getPublicArtistPageContent } from "@/app/actions/artist-page"

interface ArtiestProfileModalProps {
  artist: Artist | null
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The professional's own page; defaults to the artist page. Null hides the link. */
  fullPageHref?: string | null
}

export function ArtiestProfileModal({ artist, open, onOpenChange, fullPageHref }: ArtiestProfileModalProps) {
  const nl = useLanguage().language !== "en"
  // The page content (cover photo, avatar, texts) of a real professional, so the modal matches their page.
  const pageId = artist && open && !isDemoProfessional(artist.id) ? String(artist.id) : null
  const { data: content } = useSWR(pageId ? ["artist-page", pageId] : null, ([, id]) => getPublicArtistPageContent(id), {
    revalidateOnFocus: false,
  })
  const openedType = artist && open ? (isDemoProfessional(artist.id) ? "sample" : "real") : null
  useEffect(() => {
    if (openedType) trackUserTest("profile_opened", { type: openedType })
  }, [openedType])
  if (!artist) return null
  const pageHref = fullPageHref === undefined ? getArtistPath(artist) : fullPageHref

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined} showCloseButton={false} className="w-[98vw] max-w-[98vw] sm:max-w-[600px] md:max-w-[900px] lg:max-w-[1200px] xl:max-w-[1400px] max-h-[95vh] sm:max-h-[90vh] overflow-y-auto p-0 bg-background">
        <DialogTitle className="sr-only">{artist.name}</DialogTitle>
        <ArtistProfileView
          artist={withPageContent(artist, content)}
          content={content}
          onNavigate={() => onOpenChange(false)}
          stickyBookBar
          heroAction={
            <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
              {pageHref && (
              <Link
                href={pageHref}
                className="flex h-11 items-center gap-1.5 rounded-full bg-black/60 px-4 text-sm font-medium text-white backdrop-blur transition-colors hover:bg-black/80"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                {nl ? "Volledige pagina" : "Full page"}
              </Link>
              )}
              <DialogClose className="flex h-11 w-11 items-center justify-center rounded-full bg-red-700 text-white transition-colors hover:bg-red-600">
                <X className="h-5 w-5" aria-hidden />
                <span className="sr-only">{nl ? "Sluiten" : "Close"}</span>
              </DialogClose>
            </div>
          }
        />
      </DialogContent>
    </Dialog>
  )
}
