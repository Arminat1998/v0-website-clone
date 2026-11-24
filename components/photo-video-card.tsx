"use client"

import type { ReactNode } from "react"
import { MapPin, Clock, CheckCircle, Wallet } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Photographer } from "@/lib/smart-search"
import { eventLabel, styleLabel, tagLabels } from "@/lib/list-filters"
import { hoursLabel } from "@/lib/artist-facts"
import { useLanguage } from "@/contexts/language-context"
import { FavoriteButton } from "@/components/account/favorite-button"
import { useRouter } from "next/navigation"
import { useBookGuard } from "@/hooks/use-book-guard"
import { isDemoProfessional } from "@/lib/demo-professionals"
import { DemoBookButton } from "@/components/demo-book-button"
import { CardRating } from "@/components/artist-website/profile-rating"

interface PhotoVideoCardProps {
  professional: Photographer
  onClick: () => void
  isVisited?: boolean
  /** Distance to the searched city. */
  distanceKm?: number | null
  /** Replaces the default buttons, e.g. to book with carried-over wishes. */
  footer?: ReactNode
  /** A badge on the photo, top left. */
  badge?: ReactNode
}

export function PhotoVideoCard({ professional, onClick, isVisited = false, distanceKm, footer, badge }: PhotoVideoCardProps) {
  const { t, language } = useLanguage()
  const router = useRouter()
  const bookGuard = useBookGuard()

  const nl = language === "nl"
  const services = tagLabels(professional.serviceTypes, styleLabel, nl)
  const displayedServices = services.slice(0, 2)
  const remainingServices = services.length - 2

  const events = tagLabels(professional.eventTypes, eventLabel, nl)
  const displayedEvents = events.slice(0, 2)
  const remainingEvents = events.length - 2

  return (
    <Card
      className="relative h-full overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer p-0 group bg-card border-border"
      onClick={onClick}
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src={professional.banner || professional.image || `/placeholder.svg?height=200&width=400&query=${professional.category}`}
          alt={professional.name}
          className="w-full h-full object-cover object-[50%_25%] group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />

        <div className="absolute top-3 right-3 z-10">
          <FavoriteButton
            variant="icon"
            professionalId={String(professional.id)}
            professionalType="photographer"
            name={professional.name}
          />
        </div>

        {badge && <div className="absolute top-3 left-3 z-10">{badge}</div>}

        {!badge && isVisited && (
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

      <CardContent className="flex flex-1 flex-col p-4">
        <div className="flex items-start gap-3 mb-3 -mt-16">
          <div className="relative flex-shrink-0">
            <div className="w-24 h-24 rounded-full border-4 border-card overflow-hidden bg-card shadow-lg">
              <img
                src={professional.avatar || professional.image || `/placeholder.svg?height=96&width=96&query=${professional.name}`}
                alt={professional.name}
                className="w-full h-full object-cover object-[50%_25%]"
              />
            </div>
          </div>

          <div className="min-w-0 flex-1 mt-12">
            <div className="mb-1 flex items-start">
              <h3 className="min-w-0 font-bold text-lg leading-tight text-foreground">{professional.name}</h3>
              <CardRating professional={professional} />
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="w-3.5 h-3.5 shrink-0" aria-hidden />
              <span>
                {professional.location}
                {distanceKm ? ` · ± ${distanceKm} km` : ""}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 mb-4 mt-4">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="w-3.5 h-3.5" aria-hidden />
            <span>
              {nl ? "Duur" : "Duration"}: <span className="font-medium text-foreground">{hoursLabel(professional, nl)}</span>
            </span>
          </div>

          <dl className="rounded-lg border border-border bg-background/40 text-sm">
            <div className="flex items-center justify-between gap-3 px-3 py-2">
              <dt className="flex items-center gap-1.5 text-muted-foreground">
                <Wallet className="w-3.5 h-3.5" aria-hidden />
                {nl ? "Tarief" : "Rate"}
              </dt>
              <dd className="text-right font-bold text-base text-foreground">
                {professional.price.replace("€", "€ ")} <span className="text-sm font-normal text-muted-foreground">{t.perHour}</span>
                <span className="block text-xs font-normal text-muted-foreground">{t.exVat}</span>
              </dd>
            </div>
          </dl>

          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">{nl ? "Specialisaties" : "Specialities"}</p>
            <div className="flex flex-wrap gap-1.5">
              {displayedServices.map((service) => (
                <Badge
                  key={service}
                  variant="secondary"
                  className="text-xs px-2.5 py-0.5 bg-secondary text-secondary-foreground hover:bg-secondary/80"
                >
                  {service}
                </Badge>
              ))}
              {remainingServices > 0 && (
                <Badge variant="secondary" className="text-xs px-2.5 py-0.5 bg-secondary text-secondary-foreground">
                  +{remainingServices}
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
                  className="text-xs px-2.5 py-0.5 bg-secondary text-secondary-foreground hover:bg-secondary/80"
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

        {/* mt-auto: the buttons of cards next to each other stand on one line. */}
        {footer ? (
          <div className="mt-auto">{footer}</div>
        ) : (
        <div className="mt-auto flex gap-2">
          <Button
            variant="outline"
            className="flex-1 text-blue-600 dark:text-blue-500 border-blue-600 dark:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/40 dark:hover:text-blue-300 bg-transparent font-medium h-11"
            onClick={(e) => {
              e.stopPropagation()
              onClick()
            }}
          >
            {t.viewProfile}
          </Button>
          {isDemoProfessional(professional.id) ? (
            <DemoBookButton short className="flex-1 h-11" />
          ) : (
            <Button
              className="flex-1 bg-red-700 hover:bg-red-600 text-white font-medium h-11"
              onClick={(e) => {
                e.stopPropagation()
                const href = `/booking?professionalId=${encodeURIComponent(String(professional.id))}&type=photographer`
                if (bookGuard(href)) router.push(href)
              }}
            >
              {t.bookNow}
            </Button>
          )}
        </div>
        )}
      </CardContent>
    </Card>
  )
}
