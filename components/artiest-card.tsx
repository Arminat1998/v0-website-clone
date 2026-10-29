"use client"

import { MapPin, Clock, CheckCircle, Speaker, Wallet } from "lucide-react"
import { getArtistTypeLabels } from "@/lib/artist-types"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Artist } from "@/lib/smart-search"
import { useLanguage } from "@/contexts/language-context"

interface ArtiestCardProps {
  artist: Artist
  onClick: () => void
  isVisited?: boolean
}

export function ArtiestCard({ artist, onClick, isVisited = false }: ArtiestCardProps) {
  const router = useRouter()
  const { t, language } = useLanguage()
  const typeLabels = getArtistTypeLabels(artist.artistTypes, artist.category, language)

  const displayedGenres = artist.musicStyles?.slice(0, 2) || []
  const remainingGenres = (artist.musicStyles?.length || 0) - 2

  const displayedEvents = artist.eventTypes?.slice(0, 2) || []
  const remainingEvents = (artist.eventTypes?.length || 0) - 2

  return (
    <Card
      className="relative overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer p-0 group bg-card border-border"
      onClick={onClick}
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src={artist.image || `/placeholder.svg?height=200&width=400&query=${artist.category} performance`}
          alt={artist.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />

        {isVisited && (
          <div className="absolute top-3 left-3 z-10">
            <div
              className="flex items-center gap-1 px-2.5 py-1 rounded-full shadow-lg"
              style={{ backgroundColor: "rgba(59, 130, 246, 0.5)" }}
            >
              <CheckCircle className="w-3.5 h-3.5 text-white" />
              <span className="text-xs font-semibold text-white">{t.viewed}</span>
            </div>
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <div className="flex items-start gap-3 mb-3 -mt-16">
          <div className="relative flex-shrink-0">
            <div className="w-24 h-24 rounded-full border-4 border-card overflow-hidden bg-card shadow-lg">
              <img
                src={artist.image || `/placeholder.svg?height=96&width=96&query=${artist.name} profile`}
                alt={artist.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-2 mt-12">
            <div className="flex flex-col gap-1">
              <h3 className="font-bold text-lg leading-tight text-foreground text-balance">{artist.name}</h3>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span className="truncate">{artist.location}</span>
              </div>
            </div>
            {typeLabels.length > 0 && (
              <ul className="flex flex-wrap gap-1.5" aria-label="Artiesttypes">
                {typeLabels.map(({ key, label, icon: Icon }) => (
                  <li
                    key={key}
                    className="inline-flex items-center gap-1 rounded-md border border-border bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground"
                  >
                    <Icon className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                    <span>{label}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4 mb-4 mt-4">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="w-3.5 h-3.5" aria-hidden="true" />
            <span>
              {t.playDuration}: <span className="font-medium text-foreground">{t.hoursRange}</span>
            </span>
          </div>

          <dl className="flex flex-col divide-y divide-border rounded-lg border border-border bg-background/40 text-sm">
            <div className="flex items-center justify-between gap-3 px-3 py-2">
              <dt className="flex items-center gap-1.5 text-muted-foreground">
                <Wallet className="w-3.5 h-3.5" aria-hidden="true" />
                {t.performanceFee}
              </dt>
              <dd className="text-right font-bold text-base text-foreground">
                {artist.price.replace("€", "€ ")} <span className="text-sm font-normal text-muted-foreground">{t.perHour}</span>
              </dd>
            </div>
            {artist.equipmentPrice && (
              <div className="flex items-center justify-between gap-3 px-3 py-2">
                <dt className="flex items-center gap-1.5 text-muted-foreground">
                  <Speaker className="w-3.5 h-3.5" aria-hidden="true" />
                  {t.equipmentPrice}
                </dt>
                <dd className="text-right font-semibold text-foreground">
                  {artist.equipmentPrice.replace("€", "€ ")} <span className="text-sm font-normal text-muted-foreground">{t.perDay}</span>
                </dd>
              </div>
            )}
          </dl>

          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">{t.musicGenresLabel}</p>
            <div className="flex flex-wrap gap-1.5">
              {displayedGenres.map((genre) => (
                <Badge
                  key={genre}
                  variant="secondary"
                  className="text-xs capitalize px-2.5 py-0.5 bg-secondary text-secondary-foreground hover:bg-secondary/80"
                >
                  {genre}
                </Badge>
              ))}
              {remainingGenres > 0 && (
                <Badge variant="secondary" className="text-xs px-2.5 py-0.5 bg-secondary text-secondary-foreground">
                  +{remainingGenres}
                </Badge>
              )}
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">{t.eventTypesLabel}</p>
            <div className="flex flex-wrap gap-1.5">
              {displayedEvents.map((event) => (
                <Badge
                  key={event}
                  variant="secondary"
                  className="text-xs capitalize px-2.5 py-0.5 bg-secondary text-secondary-foreground hover:bg-secondary/80"
                >
                  {event}
                </Badge>
              ))}
              {remainingEvents > 0 && (
                <Badge variant="secondary" className="text-xs px-2.5 py-0.5 bg-secondary text-secondary-foreground">
                  +{remainingEvents}
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1 text-blue-600 border-blue-600 bg-transparent hover:bg-blue-50 hover:text-blue-700 dark:text-blue-400 dark:border-blue-400 dark:hover:bg-blue-950/20 dark:hover:text-white font-medium h-10"
            onClick={(e) => {
              e.stopPropagation()
              onClick()
            }}
          >
            {t.viewProfile}
          </Button>
          <Button
            className="flex-1 bg-red-700 hover:bg-red-800 text-white font-medium h-10"
            onClick={(e) => {
              e.stopPropagation()
              router.push(`/booking?artistId=${artist.id}&type=artist`)
            }}
          >
            {t.bookNow}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
