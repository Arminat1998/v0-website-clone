import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Header } from "@/components/header"
import { ArtistBackLink } from "@/components/artist-back-link"
import { ArtistWebsite } from "@/components/artist-website/artist-website"
import type { Artist } from "@/lib/smart-search"
import { getArtistBySlug } from "@/lib/artist-slug"
import { getArtistPageContent } from "@/lib/artist-page"
import { getProfessionalArtistBySlug } from "@/lib/professional-artist"
import { emptyPageContent, mediaUrl, type ArtistPageContent } from "@/lib/artist-page-types"

export const dynamic = "force-dynamic"

interface ArtistPageProps {
  params: Promise<{ slug: string }>
}

function withPageContent(artist: Artist, content: ArtistPageContent | null): Artist {
  if (!content) return artist
  return {
    ...artist,
    description: content.about || artist.description,
    eventTypes: content.eventTypes.length > 0 ? content.eventTypes : artist.eventTypes,
    musicStyles: content.musicGenres.length > 0 ? content.musicGenres : artist.musicStyles,
  }
}

export async function generateMetadata({ params }: ArtistPageProps): Promise<Metadata> {
  const { slug } = await params
  const baseArtist = getArtistBySlug(slug) ?? (await getProfessionalArtistBySlug(slug))
  if (!baseArtist) notFound()

  const content = await getArtistPageContent(String(baseArtist.id))
  const artist = withPageContent(baseArtist, content)
  const description =
    artist.description ?? `Boek ${artist.name} (${artist.specialty}) voor jouw evenement via ARSI Events.`
  const image = content?.bannerPath ? mediaUrl(content.bannerPath) : artist.image

  return {
    title: `${artist.name} - ${content?.tagline || artist.specialty} | ARSI Events`,
    description,
    openGraph: {
      title: `${artist.name} | ARSI Events`,
      description,
      images: image ? [image] : undefined,
    },
  }
}

export default async function ArtistPage({ params }: ArtistPageProps) {
  const { slug } = await params
  const baseArtist = getArtistBySlug(slug) ?? (await getProfessionalArtistBySlug(slug))
  if (!baseArtist) notFound()

  const content = await getArtistPageContent(String(baseArtist.id))
  const artist = withPageContent(baseArtist, content)

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto w-full max-w-[1400px] px-3 py-4 sm:px-6 sm:py-6">
        <ArtistBackLink artistId={artist.id} />
        <ArtistWebsite artist={artist} content={content ?? emptyPageContent()} />
      </main>
    </div>
  )
}
