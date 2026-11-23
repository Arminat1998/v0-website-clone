import type { MetadataRoute } from "next"
import { listLivePhotographers, listLiveProfessionalArtists } from "@/lib/professional-artist"
import { getArtistPath } from "@/lib/artist-slug"
import { siteOrigin } from "@/lib/site-origin"

export const dynamic = "force-dynamic"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = siteOrigin()
  const pages = ["/", "/artiesten", "/photo-video", "/register/professional"]
  try {
    const [artists, photographers] = await Promise.all([listLiveProfessionalArtists(), listLivePhotographers()])
    pages.push(...artists.map(getArtistPath), ...photographers.flatMap((photographer) => photographer.href ?? []))
  } catch {
    // Without the database the fixed pages are still listed.
  }
  return pages.map((path) => ({ url: `${origin}${path === "/" ? "" : path}` }))
}
