import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Header } from "@/components/header"
import { ArtistWebsite } from "@/components/artist-website/artist-website"
import type { Artist } from "@/lib/smart-search"
import { getArtistPageContent } from "@/lib/artist-page"
import { getProfessionalArtistBySlug } from "@/lib/professional-artist"
import { emptyPageContent, mediaUrl, type ArtistPageContent } from "@/lib/artist-page-types"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export const dynamic = "force-dynamic"

interface PhotoVideoPageProps {
  params: Promise<{ slug: string }>
}

function withPageContent(professional: Artist, content: ArtistPageContent | null): Artist {
  if (!content) return professional
  return {
    ...professional,
    description: content.about || professional.description,
    eventTypes: content.eventTypes.length > 0 ? content.eventTypes : professional.eventTypes,
    musicStyles: content.musicGenres.length > 0 ? content.musicGenres : professional.musicStyles,
  }
}

export async function generateMetadata({ params }: PhotoVideoPageProps): Promise<Metadata> {
  const { slug } = await params
  const base = await getProfessionalArtistBySlug(slug, "photo-video")
  if (!base) notFound()

  const content = await getArtistPageContent(String(base.id))
  const professional = withPageContent(base, content)
  const description =
    professional.description ?? `Boek ${professional.name} (${professional.specialty}) voor jouw evenement via ARSI Events.`
  const image = content?.bannerPath ? mediaUrl(content.bannerPath) : professional.image

  return {
    title: `${professional.name} - ${content?.tagline || professional.specialty} | ARSI Events`,
    description,
    openGraph: {
      title: `${professional.name} | ARSI Events`,
      description,
      images: image ? [image] : undefined,
    },
  }
}

export default async function PhotoVideoProfessionalPage({ params }: PhotoVideoPageProps) {
  const { slug } = await params
  const base = await getProfessionalArtistBySlug(slug, "photo-video")
  if (!base) notFound()

  const content = await getArtistPageContent(String(base.id))
  const professional = withPageContent(base, content)

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto w-full max-w-[1400px] px-3 py-4 sm:px-6 sm:py-6">
        <Link
          href="/photo-video"
          className="mb-3 ml-3 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground sm:ml-0"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Alle fotografen en videografen
        </Link>
        <ArtistWebsite artist={professional} content={content ?? emptyPageContent()} />
      </main>
    </div>
  )
}
