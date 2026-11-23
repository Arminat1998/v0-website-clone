"use client"

import { useState } from "react"
import { useLanguage } from "@/contexts/language-context"
import { AudioLines, Camera, Disc3, Globe, Music2, Play, type LucideIcon } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import {
  SOCIAL_KEYS,
  getVideoEmbed,
  mediaUrl,
  type ArtistPageContent,
  type SocialKey,
} from "@/lib/artist-page-types"

export const SOCIAL_META: Record<SocialKey, { label: string; icon: LucideIcon; placeholder: string }> = {
  instagram: { label: "Instagram", icon: Camera, placeholder: "https://instagram.com/jouwnaam" },
  youtube: { label: "YouTube", icon: Play, placeholder: "https://youtube.com/@jouwkanaal" },
  spotify: { label: "Spotify", icon: Music2, placeholder: "https://open.spotify.com/artist/..." },
  soundcloud: { label: "SoundCloud", icon: AudioLines, placeholder: "https://soundcloud.com/jouwnaam" },
  deezer: { label: "Deezer", icon: Disc3, placeholder: "https://deezer.com/artist/..." },
  website: { label: "Website", icon: Globe, placeholder: "https://jouwwebsite.nl" },
}

interface ArtistPortfolioProps {
  content: ArtistPageContent
  artistName: string
}

export function ArtistPortfolio({ content, artistName }: ArtistPortfolioProps) {
  const nl = useLanguage().language !== "en"
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const socials = SOCIAL_KEYS.filter((key) => content.socials[key])
  const videos = content.videos.filter((video) => getVideoEmbed(video.url))
  const activePath = openIndex !== null ? content.gallery[openIndex] : null

  return (
    <div className="space-y-6 sm:space-y-8">
      <section>
        <h3 className="text-lg sm:text-2xl font-bold mb-3 sm:mb-4 text-foreground">{nl ? "Foto's" : "Photos"}</h3>
        {content.gallery.length === 0 ? (
          <p className="text-xs sm:text-base text-muted-foreground text-center py-6 sm:py-8">{nl ? "Nog geen foto's." : "No photos yet."}</p>
        ) : (
          <ul className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
            {content.gallery.map((path, index) => (
              <li key={path}>
                <button
                  type="button"
                  onClick={() => setOpenIndex(index)}
                  className="group block aspect-[4/3] w-full overflow-hidden rounded-lg border border-border bg-muted focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={nl ? `Foto ${index + 1} van ${artistName} openen` : `Open photo ${index + 1} of ${artistName}`}
                >
                  <img
                    src={mediaUrl(path)}
                    alt={`${artistName}, ${nl ? "foto" : "photo"} ${index + 1}`}
                    loading="lazy"
                    className="h-full w-full object-cover object-[50%_25%] transition-transform duration-300 group-hover:scale-105"
                  />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3 className="text-lg sm:text-2xl font-bold mb-3 sm:mb-4 text-foreground">{nl ? "Video's" : "Videos"}</h3>
        {videos.length === 0 ? (
          <p className="text-xs sm:text-base text-muted-foreground text-center py-6 sm:py-8">{nl ? "Nog geen video's." : "No videos yet."}</p>
        ) : (
          <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
            {videos.map((video) => {
              const embed = getVideoEmbed(video.url)
              if (!embed) return null
              return (
                <figure key={video.id} className="overflow-hidden rounded-lg border border-border bg-card">
                  <div className="aspect-video bg-black">
                    <iframe
                      src={embed.embedUrl}
                      title={video.title || `${artistName} video`}
                      loading="lazy"
                      allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                      allowFullScreen
                      className="h-full w-full border-0"
                    />
                  </div>
                  {video.title && (
                    <figcaption className="px-3 py-2 text-xs sm:text-sm text-foreground">{video.title}</figcaption>
                  )}
                </figure>
              )
            })}
          </div>
        )}
      </section>

      {socials.length > 0 && (
        <section>
          <h3 className="text-lg sm:text-2xl font-bold mb-3 sm:mb-4 text-foreground">Online</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
            {socials.map((key) => {
              const { label, icon: Icon } = SOCIAL_META[key]
              return (
                <a
                  key={key}
                  href={content.socials[key]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border-2 border-border rounded-lg p-3 sm:p-6 flex items-center gap-2 sm:gap-3 hover:border-muted-foreground transition-colors bg-card"
                >
                  <Icon className="w-5 h-5 text-red-600 shrink-0" aria-hidden="true" />
                  <span className="font-medium text-xs sm:text-base text-foreground">{label}</span>
                </a>
              )
            })}
          </div>
        </section>
      )}

      <Dialog open={activePath !== null} onOpenChange={(open) => !open && setOpenIndex(null)}>
        <DialogContent className="max-w-5xl border-0 bg-transparent p-0 shadow-none sm:max-w-5xl">
          <DialogTitle className="sr-only">{artistName} photo</DialogTitle>
          <DialogDescription className="sr-only">Enlarged event photo</DialogDescription>
          {activePath && (
            <img
              src={mediaUrl(activePath)}
              alt={`${artistName} photo`}
              className="max-h-[85vh] w-full rounded-lg object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
