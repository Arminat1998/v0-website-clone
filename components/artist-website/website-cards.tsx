"use client"

import { useBookGuard } from "@/hooks/use-book-guard"
import type { ReactNode } from "react"
import Link from "next/link"
import { Car, Clock, MapPin, Pencil, Plus, Target, Wallet, Music2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SOCIAL_META } from "@/components/artist-portfolio"
import { SOCIAL_KEYS, getVideoEmbed, mediaUrl } from "@/lib/artist-page-types"
import { bookingHref, experienceLabel, professionLabel, useWebsite } from "@/components/artist-website/website-context"
import { hoursLabel, rangeLabel } from "@/lib/artist-facts"
import { eventLabel, styleLabel, tagLabels } from "@/lib/list-filters"
import { isDemoProfessional } from "@/lib/demo-professionals"

export function EditPencil({ label, onClick, href }: { label: string; onClick?: () => void; href?: string }) {
  const className =
    "flex size-11 shrink-0 items-center justify-center rounded-full bg-muted text-foreground transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
  if (href) {
    return (
      <Link href={href} aria-label={label} title={label} className={className}>
        <Pencil className="size-4" aria-hidden="true" />
      </Link>
    )
  }
  return (
    <button type="button" onClick={onClick} aria-label={label} title={label} className={className}>
      <Pencil className="size-4" aria-hidden="true" />
    </button>
  )
}

function AddPrompt({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border px-4 py-6 text-sm font-medium text-muted-foreground transition-colors hover:border-muted-foreground hover:text-foreground"
    >
      <Plus className="size-4" aria-hidden="true" />
      {label}
    </button>
  )
}

export function Card({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

export function BookingCard() {
  const bookGuard = useBookGuard()
  const { artist, t, goToTab } = useWebsite()
  // A sample profile cannot be booked: the header says so, here only the calendar is left.
  const demo = isDemoProfessional(artist.id)
  return (
    <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <h2 className="text-xl font-bold text-foreground">{demo ? t.tabs.availability : t.bookTitle}</h2>
      {!demo && <p className="mt-1 text-sm text-muted-foreground text-pretty">{t.bookText}</p>}
      <div className="mt-4 flex flex-col gap-2">
        {!demo && (
          <Button asChild className="min-h-11 bg-red-700 text-white hover:bg-red-600">
            <Link href={bookingHref(artist)} onClick={(event) => bookGuard(bookingHref(artist), event)}>{t.book}</Link>
          </Button>
        )}
        <Button type="button" variant="outline" className="min-h-11" onClick={() => goToTab("availability")}>
          {t.checkAvailability}
        </Button>
      </div>
    </section>
  )
}

export function DetailsCard() {
  const { artist, edit, t } = useWebsite()
  const nl = t.locale.startsWith("nl")
  const experience = experienceLabel(artist.experience, nl)
  const travel = rangeLabel(artist, nl)
  const rows = [
    {
      icon: Wallet,
      label: t.rate,
      value: artist.price.replace("€", "€ "),
      note: t.rateNote,
    },
    ...(artist.location ? [{ icon: MapPin, label: t.city, value: artist.location }] : []),
    ...(experience ? [{ icon: Target, label: t.experience, value: experience }] : []),
    { icon: Music2, label: t.type, value: professionLabel(artist.specialty, nl) },
    { icon: Clock, label: t.duration, value: hoursLabel(artist, nl) },
    ...(travel ? [{ icon: Car, label: t.travel, value: travel }] : []),
  ]

  return (
    <Card title={t.details} action={edit && <EditPencil label={t.editDetails} href={edit.editProfileHref} />}>
      <dl className="space-y-4">
        {rows.map((row) => (
          <div key={row.label} className="flex items-start gap-3">
            <row.icon className="mt-0.5 size-5 shrink-0 text-red-600" aria-hidden="true" />
            <div>
              <dt className="text-xs text-muted-foreground">{row.label}</dt>
              <dd className="text-sm font-semibold text-foreground">
                {row.value}
                {row.note && <span className="ml-1.5 text-xs font-normal text-muted-foreground">{row.note}</span>}
              </dd>
            </div>
          </div>
        ))}
      </dl>
    </Card>
  )
}

export function AboutCard() {
  const { artist, content, edit, t, openDialog } = useWebsite()
  const about = edit ? content.about : content.about || artist.description || ""

  return (
    <Card title={t.about} action={edit && <EditPencil label={t.editAbout} onClick={() => openDialog("about")} />}>
      {about ? (
        <p className="whitespace-pre-line text-base leading-relaxed text-muted-foreground">{about}</p>
      ) : edit ? (
        <AddPrompt label={t.aboutAdd} onClick={() => openDialog("about")} />
      ) : (
        <p className="text-sm text-muted-foreground">{t.aboutEmpty}</p>
      )}
    </Card>
  )
}

export function TagsCard() {
  const { artist, content, edit, t, openDialog } = useWebsite()
  const nl = t.locale.startsWith("nl")
  const eventTypes = tagLabels(edit || content.eventTypes.length ? content.eventTypes : artist.eventTypes, eventLabel, nl)
  const genres = tagLabels(edit || content.musicGenres.length ? content.musicGenres : artist.musicStyles, styleLabel, nl)
  const empty = eventTypes.length === 0 && genres.length === 0

  return (
    <Card title={t.eventTypes + " & " + t.genres.toLowerCase()} action={edit && <EditPencil label={t.editTags} onClick={() => openDialog("tags")} />}>
      {empty ? (
        edit ? (
          <AddPrompt label={t.tagsAdd} onClick={() => openDialog("tags")} />
        ) : (
          <p className="text-sm text-muted-foreground">{t.tagsEmpty}</p>
        )
      ) : (
        <div className="space-y-5">
          {eventTypes.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold text-foreground">{t.eventTypes}</h3>
              <ul className="flex flex-wrap gap-2">
                {eventTypes.map((tag) => (
                  <li key={tag} className="rounded-full border border-foreground/60 px-3 py-1 text-sm text-foreground">
                    {tag}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {genres.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold text-foreground">{t.genres}</h3>
              <ul className="flex flex-wrap gap-2">
                {genres.map((tag) => (
                  <li key={tag} className="rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-800 dark:bg-red-900/30 dark:text-red-300">
                    {tag}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

export function SocialsCard() {
  const { content, edit, t, openDialog } = useWebsite()
  const socials = SOCIAL_KEYS.filter((key) => content.socials[key])
  if (!edit && socials.length === 0) return null

  return (
    <Card title={t.socials} action={edit && <EditPencil label={t.editSocials} onClick={() => openDialog("socials")} />}>
      {socials.length === 0 ? (
        <AddPrompt label={t.socialsAdd} onClick={() => openDialog("socials")} />
      ) : (
        <ul className="space-y-1">
          {socials.map((key) => {
            const { label, icon: Icon } = SOCIAL_META[key]
            return (
              <li key={key}>
                <a
                  href={content.socials[key]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                >
                  <span className="flex size-9 items-center justify-center rounded-full bg-muted">
                    <Icon className="size-4 text-red-600" aria-hidden="true" />
                  </span>
                  {label}
                </a>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}

export function PhotosCard({ limit, columns = "sm:grid-cols-3" }: { limit?: number; columns?: string }) {
  const { artist, content, edit, t, openDialog, openPhoto, goToTab } = useWebsite()
  const photos = limit ? content.gallery.slice(0, limit) : content.gallery

  const action = (
    <div className="flex items-center gap-2">
      {limit && content.gallery.length > limit && (
        <Button type="button" variant="ghost" size="sm" onClick={() => goToTab("photos")} className="text-red-700 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300">
          {t.allPhotos}
        </Button>
      )}
      {edit && <EditPencil label={t.editPhotos} onClick={() => openDialog("photos")} />}
    </div>
  )

  if (!edit && photos.length === 0) return null
  return (
    <Card title={t.photos} action={action}>
      {photos.length === 0 ? (
        <AddPrompt label={t.photosAdd} onClick={() => openDialog("photos")} />
      ) : (
        <ul className={`grid grid-cols-2 gap-2 ${photos.length > 2 ? columns : ""}`}>
          {photos.map((path, index) => (
            <li key={path}>
              <button
                type="button"
                onClick={() => openPhoto(index)}
                aria-label={`${t.openPhoto} ${index + 1}`}
                className="group block aspect-[4/3] w-full overflow-hidden rounded-lg bg-muted focus-visible:ring-2 focus-visible:ring-ring"
              >
                <img
                  src={mediaUrl(path) || "/placeholder.svg"}
                  alt={`${artist.name} ${index + 1}`}
                  loading="lazy"
                  className="size-full object-cover object-[50%_25%] transition-transform duration-300 group-hover:scale-105"
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

export function VideosCard({ limit }: { limit?: number }) {
  const { artist, content, edit, t, openDialog, goToTab } = useWebsite()
  const all = content.videos.filter((video) => getVideoEmbed(video.url))
  const videos = limit ? all.slice(0, limit) : all

  const action = (
    <div className="flex items-center gap-2">
      {limit && all.length > limit && (
        <Button type="button" variant="ghost" size="sm" onClick={() => goToTab("videos")} className="text-red-700 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300">
          {t.allVideos}
        </Button>
      )}
      {edit && <EditPencil label={t.editVideos} onClick={() => openDialog("videos")} />}
    </div>
  )

  if (!edit && videos.length === 0) return null
  return (
    <Card title={t.videos} action={action}>
      {videos.length === 0 ? (
        <AddPrompt label={t.videosAdd} onClick={() => openDialog("videos")} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {videos.map((video) => {
            const embed = getVideoEmbed(video.url)
            if (!embed) return null
            return (
              <figure key={video.id} className="overflow-hidden rounded-lg border border-border bg-background">
                <div className="aspect-video bg-black">
                  <iframe
                    src={embed.embedUrl}
                    title={video.title || `${artist.name} video`}
                    loading="lazy"
                    allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                    allowFullScreen
                    className="size-full border-0"
                  />
                </div>
                {video.title && <figcaption className="px-3 py-2 text-sm text-foreground">{video.title}</figcaption>}
              </figure>
            )
          })}
        </div>
      )}
    </Card>
  )
}
