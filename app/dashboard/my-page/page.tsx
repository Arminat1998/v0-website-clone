import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ArtistPageEditor } from "@/components/artist-page-editor"
import { getProfessionalId } from "@/lib/bookings/professional"
import { getArtistPageContent } from "@/lib/artist-page"
import { getArtistPath } from "@/lib/artist-slug"
import { enhancedArtists } from "@/lib/smart-search"
import type { ArtistPageContent } from "@/lib/artist-page-types"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Mijn Website | ARSI Events",
}

export default async function MyPageDashboard() {
  const professionalId = await getProfessionalId()
  const artist = enhancedArtists.find((item) => String(item.id) === professionalId)
  if (!artist) notFound()

  const stored = await getArtistPageContent(professionalId)
  const content: ArtistPageContent = stored ?? {
    bannerPath: null,
    avatarPath: null,
    tagline: "",
    about: artist.description ?? "",
    eventTypes: artist.eventTypes ?? [],
    musicGenres: artist.musicStyles ?? [],
    gallery: [],
    videos: [],
    socials: {},
  }

  const summary = [
    { label: "Tarief", value: artist.price },
    { label: "Stad", value: artist.location },
    ...(artist.experience ? [{ label: "Ervaring", value: artist.experience }] : []),
    { label: "Type", value: artist.specialty },
  ]

  return (
    <DashboardLayout>
      <div className="p-4 pt-16 sm:p-6 lg:p-8">
        <ArtistPageEditor
          initialContent={content}
          artistName={artist.name}
          artistPath={getArtistPath(artist)}
          fallbackImage={artist.image}
          summary={summary}
        />
      </div>
    </DashboardLayout>
  )
}
