import type { Metadata } from "next"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ArtistPageEditor } from "@/components/artist-page-editor"
import { requireProfessionalUser } from "@/lib/session"
import { buildProfessionalArtist, getProfessionalArtistPath } from "@/lib/professional-artist"
import { getArtistPageContent } from "@/lib/artist-page"
import { getArtistPath } from "@/lib/artist-slug"
import { enhancedArtists } from "@/lib/smart-search"
import type { ArtistPageContent } from "@/lib/artist-page-types"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Mijn Website | ARSI Events",
}

export default async function MyPageDashboard() {
  const account = await requireProfessionalUser()
  const professionalId = account.id
  const listedArtist = enhancedArtists.find((item) => String(item.id) === professionalId)
  const artist = listedArtist ?? buildProfessionalArtist(account)
  const artistPath = listedArtist ? getArtistPath(listedArtist) : getProfessionalArtistPath(account)

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

  return (
    <DashboardLayout>
      <div className="p-4 pt-16 sm:p-6 lg:p-8">
        <ArtistPageEditor initialContent={content} artist={artist} artistPath={artistPath} />
      </div>
    </DashboardLayout>
  )
}
