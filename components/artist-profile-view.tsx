"use client";

import { useBookGuard } from "@/hooks/use-book-guard";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useState } from "react";
import { Car, Clock, MapPin, Target } from "lucide-react";
import { hoursLabel, rangeLabel } from "@/lib/artist-facts";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Artist } from "@/lib/smart-search";
import { ArtistPortfolio } from "@/components/artist-portfolio";
import { FavoriteButton } from "@/components/account/favorite-button";
import { emptyPageContent, mediaUrl, type ArtistPageContent } from "@/lib/artist-page-types";
import { useLanguage } from "@/contexts/language-context";
import {
  WebsiteProvider,
  bookingHref,
  eventTagLabel,
  experienceLabel,
  genreTagLabel,
  professionLabel,
  profileCopy,
} from "@/components/artist-website/website-context";
import { AvailabilitySection } from "@/components/artist-website/availability-section";
import { EquipmentSection } from "@/components/artist-website/equipment-section";
import { ProfileRating } from "@/components/artist-website/profile-rating";
import { isDemoProfessional } from "@/lib/demo-professionals";
import { DemoBookButton } from "@/components/demo-book-button";

interface ArtistProfileViewProps {
  artist: Artist;
  onNavigate?: () => void;
  heroAction?: ReactNode;
  content?: ArtistPageContent | null;
  /** In the modal: a bar that stays at the bottom with the price and the book button. */
  stickyBookBar?: boolean;
}

const tabClass =
  "min-h-11 flex-none whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-foreground data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=inactive]:bg-muted sm:px-8 sm:py-3 sm:text-base";

/** The profile in the modal. It shares its data, labels, equipment and calendar with the full page (artist-website). */
export function ArtistProfileView({
  artist,
  onNavigate,
  heroAction,
  content,
  stickyBookBar = false,
}: ArtistProfileViewProps) {
  const router = useRouter();
  const bookGuard = useBookGuard();
  const { language } = useLanguage();
  const nl = language === "nl";
  // Photographers and videographers use the same view with their own labels and booking route.
  const photo = artist.kind === "photo-video";
  const demo = isDemoProfessional(artist.id);
  const t = profileCopy(artist, nl ? "nl" : "en");
  const notProvided = nl ? "Niet opgegeven" : "Not specified";
  const [activeTab, setActiveTab] = useState("about");

  const artistImage =
    (content?.bannerPath ? mediaUrl(content.bannerPath) : null) ||
    artist.banner ||
    artist.image ||
    `/placeholder.svg?height=400&width=800&query=${encodeURIComponent(artist.name)} ${encodeURIComponent(artist.category ?? artist.specialty)} performance`;
  const profileImage =
    (content?.avatarPath ? mediaUrl(content.avatarPath) : null) ||
    artist.avatar ||
    artist.image ||
    `/placeholder.svg?height=144&width=144&query=${encodeURIComponent(artist.name)} profile portrait`;

  const book = () => {
    const href = bookingHref(artist);
    if (!bookGuard(href)) return;
    onNavigate?.();
    router.push(href);
  };

  const travel = rangeLabel(artist, nl);
  const facts = [
    { icon: Clock, label: t.duration, value: hoursLabel(artist, nl) },
    { icon: Target, label: t.experience, value: experienceLabel(artist.experience, nl) ?? notProvided },
    { icon: MapPin, label: t.city, value: artist.location || notProvided },
    ...(travel ? [{ icon: Car, label: t.travel, value: travel }] : []),
  ];

  return (
    <WebsiteProvider
      value={{
        artist,
        content: content ?? emptyPageContent(),
        edit: null,
        t,
        openDialog: () => {},
        goToTab: () => {},
        openPhoto: () => {},
      }}
    >
      {/* min-w-0: the dialog is a grid, so without it the row of tabs would make the whole modal wider than the screen. */}
      <div className="min-w-0 bg-background">
        <div className="relative">
          {/* Hero Image */}
          <div className="relative h-56 overflow-hidden bg-muted sm:h-80 lg:h-[26rem]">
            <img src={artistImage || "/placeholder.svg"} alt="" className="h-full w-full object-cover" />
            {heroAction}
          </div>

          {/* Profile Image */}
          <div className="absolute -bottom-14 left-3 z-10 size-28 overflow-hidden rounded-full border-4 border-background bg-muted shadow-lg sm:-bottom-20 sm:left-6 sm:size-44">
            <img src={profileImage || "/placeholder.svg"} alt={artist.name} className="h-full w-full object-cover" />
          </div>
        </div>

        {/* Profile Header */}
        <div className="px-3 pb-4 pt-16 sm:px-6 sm:pb-6 sm:pt-24">
          <div className="mb-4 flex flex-col gap-4 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              {/* The modal's own (hidden) title is the heading with this name, so this is not a second one. */}
              <p className="mb-1 text-xl font-bold text-foreground sm:text-3xl">{artist.name}</p>
              <p className="mb-3 text-sm text-muted-foreground sm:text-base">
                {content?.tagline || professionLabel(artist.specialty, nl)}
              </p>
              <ProfileRating artist={artist} />
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-3 [&_[data-slot=button]]:min-h-11">
              <FavoriteButton professionalId={String(artist.id)} professionalType={photo ? "photographer" : "artist"} />
              {/* With the bar at the bottom the book button is always in view, so it is not repeated here. */}
              {!stickyBookBar &&
                (demo ? (
                  <DemoBookButton />
                ) : (
                  <Button className="bg-red-700 px-6 text-white hover:bg-red-600" onClick={book}>
                    {t.book}
                  </Button>
                ))}
            </div>
          </div>

          {/* Info Cards Grid */}
          <dl className="mb-4 grid grid-cols-2 gap-2 sm:mb-6 sm:gap-4 lg:grid-cols-4">
            <div className="rounded-lg border-2 border-border bg-card p-3 sm:rounded-xl sm:p-6">
              <dt className="mb-2 text-xs text-muted-foreground sm:text-sm">{t.rate}</dt>
              <dd>
                <span className="mb-1 block text-2xl font-bold text-foreground sm:text-4xl">
                  <span className="text-red-600">€</span>
                  {artist.price.replace("€", "").trim()}
                </span>
                <span className="block text-xs text-muted-foreground">{t.rateNote}</span>
              </dd>
            </div>
            {facts.map(({ icon: Icon, label, value }) => (
              <div key={label} className="rounded-lg border-2 border-border bg-card p-3 sm:rounded-xl sm:p-6">
                <dt className="mb-2 flex items-center gap-2 text-xs text-muted-foreground sm:text-sm">
                  <Icon className="size-4 text-red-600 sm:size-5" aria-hidden />
                  {label}
                </dt>
                <dd className="break-words text-lg font-bold text-foreground sm:text-2xl">{value}</dd>
              </div>
            ))}
          </dl>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-4 h-auto w-full flex-wrap justify-start gap-1 bg-transparent p-0 sm:mb-6">
              <TabsTrigger value="about" className={tabClass}>
                {nl ? "Over" : "About"}
              </TabsTrigger>
              <TabsTrigger value="portfolio" className={tabClass}>
                Portfolio
              </TabsTrigger>
              <TabsTrigger value="equipment" className={tabClass}>
                {t.tabs.equipment}
              </TabsTrigger>
              <TabsTrigger value="availability" className={tabClass}>
                {t.tabs.availability}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="about" className="mt-0">
              <h3 className="mb-3 text-lg font-bold text-foreground sm:mb-4 sm:text-2xl">{t.about}</h3>
              <p className="mb-6 max-w-3xl whitespace-pre-line text-sm leading-relaxed text-muted-foreground sm:mb-8 sm:text-base">
                {artist.description || t.aboutEmpty}
              </p>

              <div className="mb-6 sm:mb-8">
                <h4 className="mb-3 text-base font-bold text-foreground sm:mb-4 sm:text-xl">{t.eventTypes}</h4>
                {artist.eventTypes?.length ? (
                  <ul className="flex flex-wrap gap-1 sm:gap-2">
                    {artist.eventTypes.map((tag) => (
                      <li
                        key={tag}
                        className="rounded-full border border-foreground/60 px-3 py-1 text-xs font-medium text-foreground sm:px-4 sm:py-2 sm:text-sm"
                      >
                        {eventTagLabel(tag, nl)}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">{notProvided}</p>
                )}
              </div>

              <div>
                <h4 className="mb-3 text-base font-bold text-foreground sm:mb-4 sm:text-xl">{t.genres}</h4>
                {artist.musicStyles?.length ? (
                  <ul className="flex flex-wrap gap-1 sm:gap-2">
                    {artist.musicStyles.map((tag) => (
                      <li
                        key={tag}
                        className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-800 sm:px-4 sm:py-2 sm:text-sm dark:bg-red-900/30 dark:text-red-300"
                      >
                        {genreTagLabel(tag, nl)}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">{notProvided}</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="portfolio" className="mt-0">
              {content ? (
                <ArtistPortfolio content={content} artistName={artist.name} />
              ) : (
                <div className="space-y-6 sm:space-y-8">
                  <div>
                    <h3 className="mb-3 text-lg font-bold text-foreground sm:mb-4 sm:text-2xl">{t.photos}</h3>
                    <p className="text-sm text-muted-foreground">{t.photosEmpty}</p>
                  </div>
                  <div>
                    <h3 className="mb-3 text-lg font-bold text-foreground sm:mb-4 sm:text-2xl">{t.videos}</h3>
                    <p className="text-sm text-muted-foreground">{t.videosEmpty}</p>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="equipment" className="mt-0">
              <EquipmentSection />
            </TabsContent>

            <TabsContent value="availability" className="mt-0">
              <AvailabilitySection />
            </TabsContent>
          </Tabs>
        </div>

        {stickyBookBar && (
          <div className="sticky bottom-0 z-10 flex items-center justify-between gap-3 border-t border-border bg-background/95 px-4 py-3 backdrop-blur sm:px-6">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{artist.name}</p>
              <p className="whitespace-nowrap text-sm text-foreground">
                <span className="font-semibold">{artist.price}</span>/{nl ? "uur" : "hr"}
                <span className="ml-1 text-xs text-muted-foreground">{nl ? "excl. btw" : "excl. VAT"}</span>
              </p>
            </div>
            {demo ? (
              <DemoBookButton className="h-11 max-w-[55%] shrink whitespace-normal text-xs leading-tight sm:max-w-none sm:text-sm" />
            ) : (
              <Button className="h-11 shrink-0 bg-red-700 px-6 text-white hover:bg-red-600" onClick={book}>
                {t.book}
              </Button>
            )}
          </div>
        )}
      </div>
    </WebsiteProvider>
  );
}
