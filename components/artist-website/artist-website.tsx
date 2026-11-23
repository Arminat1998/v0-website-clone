"use client"

import { useBookGuard } from "@/hooks/use-book-guard"
import { useRef, useState } from "react"
import Link from "next/link"
import { Camera, Loader2, MapPin, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { ArtistShareButton } from "@/components/artist-share-button"
import { useLanguage } from "@/contexts/language-context"
import { IMAGE_TYPES, getVideoEmbed, mediaUrl, type ArtistPageContent } from "@/lib/artist-page-types"
import type { Artist } from "@/lib/smart-search"
import {
  WebsiteProvider,
  bookingHref,
  professionLabel,
  profileCopy,
  type DialogKey,
  type TabKey,
  type WebsiteEditApi,
} from "@/components/artist-website/website-context"
import {
  AboutCard,
  BookingCard,
  DetailsCard,
  EditPencil,
  PhotosCard,
  SocialsCard,
  TagsCard,
  VideosCard,
} from "@/components/artist-website/website-cards"
import { EquipmentSection } from "@/components/artist-website/equipment-section"
import { AvailabilitySection } from "@/components/artist-website/availability-section"
import { EditDialogs } from "@/components/artist-website/edit-dialogs"
import { ProfileRating } from "@/components/artist-website/profile-rating"
import { isDemoProfessional } from "@/lib/demo-professionals"
import { DemoBookButton } from "@/components/demo-book-button"

const ALL_TABS: TabKey[] = ["overview", "info", "photos", "videos", "equipment", "availability"]

interface ArtistWebsiteProps {
  artist: Artist
  content: ArtistPageContent
  edit?: WebsiteEditApi
}

export function ArtistWebsite({ artist, content, edit }: ArtistWebsiteProps) {
  const bookGuard = useBookGuard()
  const { language } = useLanguage()
  const lang = language === "en" ? "en" : "nl"
  const t = profileCopy(artist, lang)
  const [tab, setTab] = useState<TabKey>("overview")
  const [dialog, setDialog] = useState<DialogKey | null>(null)
  const [photoIndex, setPhotoIndex] = useState<number | null>(null)

  const bannerInput = useRef<HTMLInputElement>(null)
  const avatarInput = useRef<HTMLInputElement>(null)

  const bannerSrc = content.bannerPath ? mediaUrl(content.bannerPath) : artist.image
  const avatarSrc = content.avatarPath ? mediaUrl(content.avatarPath) : artist.image
  const tagline = content.tagline || (edit ? "" : professionLabel(artist.specialty, lang === "nl"))
  // Visitors do not get empty photo and video sections; the owner does, to fill them.
  const tabs = ALL_TABS.filter((key) => {
    if (edit) return true
    if (key === "photos") return content.gallery.length > 0
    if (key === "videos") return content.videos.some((video) => getVideoEmbed(video.url))
    return true
  })
  const activePhoto = photoIndex !== null ? content.gallery[photoIndex] : null

  return (
    <WebsiteProvider
      value={{
        artist,
        content,
        edit: edit ?? null,
        t,
        openDialog: setDialog,
        goToTab: setTab,
        openPhoto: setPhotoIndex,
      }}
    >
      <article className="touch-targets w-full">
        <div className="relative h-56 overflow-hidden rounded-xl bg-muted sm:h-80 lg:h-[26rem]">
          {bannerSrc && <img src={bannerSrc || "/placeholder.svg"} alt="" className="size-full object-cover object-[50%_25%]" />}
          {!edit && <ArtistShareButton />}
          {edit && (
            <div className="absolute bottom-4 right-4 flex gap-2">
              {content.bannerPath && (
                <Button type="button" size="sm" variant="secondary" onClick={() => edit.update({ bannerPath: null })}>
                  <Trash2 className="size-4" aria-hidden="true" />
                  <span className="sr-only">{t.removeCover}</span>
                </Button>
              )}
              <Button type="button" size="sm" variant="secondary" disabled={edit.uploading === "banner"} onClick={() => bannerInput.current?.click()}>
                {edit.uploading === "banner" ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Camera className="size-4" aria-hidden="true" />
                )}
                {t.editCover}
              </Button>
              <input
                ref={bannerInput}
                type="file"
                accept={IMAGE_TYPES.join(",")}
                className="sr-only"
                tabIndex={-1}
                onChange={(event) => {
                  void edit.uploadSingle("banner", event.target.files?.[0])
                  event.target.value = ""
                }}
              />
            </div>
          )}
        </div>

        <header className="flex min-w-0 flex-col gap-4 px-2 sm:px-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
            <div className="relative -mt-14 size-28 shrink-0 sm:-mt-20 sm:size-44">
              <div className="size-full overflow-hidden rounded-full border-4 border-background bg-muted shadow-lg">
                {avatarSrc && <img src={avatarSrc || "/placeholder.svg"} alt={artist.name} className="size-full object-cover object-[50%_25%]" />}
              </div>
              {edit && (
                <>
                  <button
                    type="button"
                    onClick={() => avatarInput.current?.click()}
                    disabled={edit.uploading === "avatar"}
                    aria-label={t.editAvatar}
                    title={t.editAvatar}
                    className="absolute bottom-2 right-2 flex size-9 items-center justify-center rounded-full border-2 border-background bg-secondary text-foreground transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {edit.uploading === "avatar" ? (
                      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Camera className="size-4" aria-hidden="true" />
                    )}
                  </button>
                  <input
                    ref={avatarInput}
                    type="file"
                    accept={IMAGE_TYPES.join(",")}
                    className="sr-only"
                    tabIndex={-1}
                    onChange={(event) => {
                      void edit.uploadSingle("avatar", event.target.files?.[0])
                      event.target.value = ""
                    }}
                  />
                </>
              )}
            </div>

            <div className="pb-1 sm:pt-4">
              <h1 className="text-3xl font-bold text-foreground text-balance sm:text-4xl">{artist.name}</h1>
              <div className="mt-1 flex items-center gap-2">
                {tagline ? (
                  <p className="text-base text-muted-foreground">{tagline}</p>
                ) : (
                  <button type="button" onClick={() => setDialog("tagline")} className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
                    {t.addTagline}
                  </button>
                )}
                {edit && tagline && (
                  <button
                    type="button"
                    onClick={() => setDialog("tagline")}
                    aria-label={t.editTagline}
                    title={t.editTagline}
                    className="flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <Pencil className="size-3.5" aria-hidden="true" />
                  </button>
                )}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <ProfileRating artist={artist} />
                {artist.location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="size-4" aria-hidden="true" />
                    {artist.location}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pb-1">
            {edit ? (
              <Button asChild variant="secondary">
                <Link href={edit.editProfileHref}>
                  <Pencil className="size-4" aria-hidden="true" />
                  {t.editBasics}
                </Link>
              </Button>
            ) : isDemoProfessional(artist.id) ? (
              <DemoBookButton className="h-11" />
            ) : (
              <Button asChild className="h-11 bg-red-700 text-white hover:bg-red-600">
                <Link href={bookingHref(artist)} onClick={(event) => bookGuard(bookingHref(artist), event)}>{t.book}</Link>
              </Button>
            )}
          </div>
        </header>

        <nav aria-label={t.tabsLabel} className="mt-4 border-b border-border px-2 sm:px-6">
          <div role="tablist" className="-mx-2 -mb-px flex gap-0 overflow-x-auto px-2 [scrollbar-width:none] sm:mx-0 sm:gap-1 sm:px-0 [&::-webkit-scrollbar]:hidden">
            {tabs.map((key) => (
              <button
                key={key}
                type="button"
                role="tab"
                id={`profile-tab-${key}`}
                aria-selected={tab === key}
                aria-controls="profile-tabpanel"
                onClick={() => setTab(key)}
                className={`shrink-0 whitespace-nowrap border-b-[3px] px-3 py-3.5 text-sm font-semibold transition-colors sm:px-4 sm:py-4 ${
                  tab === key ? "border-red-600 text-red-700 dark:text-red-400" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.tabs[key]}
              </button>
            ))}
          </div>
        </nav>

        <div
          role="tabpanel"
          id="profile-tabpanel"
          aria-labelledby={`profile-tab-${tab}`}
          className="pt-4"
        >
          {tab === "overview" && (
            <div className="grid gap-4 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
              <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
                {!edit && <BookingCard />}
                <DetailsCard />
                <SocialsCard />
              </aside>
              <div className="space-y-4">
                <AboutCard />
                <TagsCard />
                <PhotosCard limit={6} />
                <VideosCard limit={2} />
              </div>
            </div>
          )}
          {tab === "info" && (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-4">
                <AboutCard />
                <TagsCard />
              </div>
              <div className="space-y-4">
                <DetailsCard />
                <SocialsCard />
              </div>
            </div>
          )}
          {tab === "photos" && <PhotosCard columns="sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" />}
          {tab === "videos" && <VideosCard />}
          {tab === "equipment" && <EquipmentSection />}
          {tab === "availability" && <AvailabilitySection />}
        </div>
      </article>

      {edit && <EditDialogs open={dialog} onClose={() => setDialog(null)} edit={edit} />}

      <Dialog open={activePhoto !== null} onOpenChange={(open) => !open && setPhotoIndex(null)}>
        <DialogContent className="max-w-5xl border-0 bg-transparent p-0 shadow-none sm:max-w-5xl">
          <DialogTitle className="sr-only">{artist.name}</DialogTitle>
          <DialogDescription className="sr-only">{t.openPhoto}</DialogDescription>
          {activePhoto && (
            <img src={mediaUrl(activePhoto) || "/placeholder.svg"} alt={artist.name} className="max-h-[85vh] w-full rounded-lg object-contain" />
          )}
        </DialogContent>
      </Dialog>
    </WebsiteProvider>
  )
}
