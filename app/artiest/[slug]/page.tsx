import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Header } from "@/components/header"
import { ArtistBackLink } from "@/components/artist-back-link"
import { ArtistProfileView } from "@/components/artist-profile-view"
import { ArtistShareButton } from "@/components/artist-share-button"
import { enhancedArtists } from "@/lib/smart-search"
import { getArtistBySlug, getArtistSlug } from "@/lib/artist-slug"

interface ArtistPageProps {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return enhancedArtists.map((artist) => ({ slug: getArtistSlug(artist) }))
}

export async function generateMetadata({ params }: ArtistPageProps): Promise<Metadata> {
  const { slug } = await params
  const artist = getArtistBySlug(slug)
  if (!artist) return { title: "Artiest niet gevonden | ARSI Events" }

  const description =
    artist.description ?? `Boek ${artist.name} (${artist.specialty}) voor jouw evenement via ARSI Events.`

  return {
    title: `${artist.name} - ${artist.specialty} | ARSI Events`,
    description,
    openGraph: {
      title: `${artist.name} | ARSI Events`,
      description,
      images: artist.image ? [artist.image] : undefined,
    },
  }
}

export default async function ArtistPage({ params }: ArtistPageProps) {
  const { slug } = await params
  const artist = getArtistBySlug(slug)
  if (!artist) notFound()

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto w-full max-w-6xl px-0 sm:px-4 py-4 sm:py-8">
        <ArtistBackLink />
        <div className="overflow-hidden border-y border-border sm:rounded-xl sm:border">
          <ArtistProfileView artist={artist} heroAction={<ArtistShareButton />} />
        </div>
      </main>
    </div>
  )
}
