import type { Metadata } from "next"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ArtistPageEditor } from "@/components/artist-page-editor"
import { requireProfessionalUser } from "@/lib/session"
import { ProfileLinks } from "@/components/profile-links"
import {
  buildProfessionalArtist,
  getProfessionalArtistPath,
  getProfessionalProfileSummary,
} from "@/lib/professional-artist"
import { getProfileRow } from "@/lib/professional-profile"
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
  const profile = await getProfessionalProfileSummary(professionalId)
  const artist = listedArtist ?? buildProfessionalArtist(account, profile)
  const artistPath = listedArtist ? getArtistPath(listedArtist) : getProfessionalArtistPath(account)

  // Until the profile is approved there is no public page to open or share.
  const isLive = Boolean(listedArtist) || (await getProfileRow(professionalId))?.reviewStatus === "goedgekeurd"

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
      <div className="space-y-4 p-4 sm:p-6 sm:pt-8 lg:p-8">
        <ProfileLinks current="website" />
        <ArtistPageEditor initialContent={content} artist={artist} artistPath={isLive ? artistPath : null} />
      </div>
    </DashboardLayout>
  )
}
