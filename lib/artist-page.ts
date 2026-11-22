import "server-only"

import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { artistPages } from "@/lib/db/schema"
import type { ArtistPageContent } from "@/lib/artist-page-types"
import { logError } from "@/lib/log-error"

export async function getArtistPageContent(professionalId: string): Promise<ArtistPageContent | null> {
  try {
    const [row] = await db.select().from(artistPages).where(eq(artistPages.professionalId, professionalId)).limit(1)
    if (!row) return null

    return {
      bannerPath: row.bannerPath,
      avatarPath: row.avatarPath,
      tagline: row.tagline ?? "",
      about: row.about ?? "",
      eventTypes: row.eventTypes,
      musicGenres: row.musicGenres,
      gallery: row.gallery,
      videos: row.videos,
      socials: row.socials,
    }
  } catch (error) {
    logError("Failed to load artist page content:", error)
    return null
  }
}
