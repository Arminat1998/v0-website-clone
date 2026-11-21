"use server"

import { del } from "@vercel/blob"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { artistPages, user } from "@/lib/db/schema"
import { getProfessionalId } from "@/lib/bookings/professional"
import { enhancedArtists } from "@/lib/smart-search"
import { getArtistPath } from "@/lib/artist-slug"
import {
  MEDIA_PREFIX,
  PAGE_LIMITS,
  SOCIAL_KEYS,
  getVideoEmbed,
  mediaUrl,
  type ArtistPageContent,
  type ArtistPageSocials,
} from "@/lib/artist-page-types"
import { isSafeBlobPath } from "@/lib/blob-paths"
import { getArtistPageContent } from "@/lib/artist-page"
import { isLiveProfessional } from "@/lib/professional-artist"

export type SaveArtistPageResult = { ok: true; content: ArtistPageContent } | { ok: false; error: "invalid" }

function cleanTags(values: unknown) {
  if (!Array.isArray(values)) return []
  const seen = new Set<string>()
  const tags: string[] = []
  for (const value of values) {
    const tag = String(value).trim().slice(0, PAGE_LIMITS.tag)
    const key = tag.toLowerCase()
    if (!tag || seen.has(key)) continue
    seen.add(key)
    tags.push(tag)
  }
  return tags.slice(0, PAGE_LIMITS.tags)
}

function isHttpUrl(value: string) {
  try {
    const { protocol } = new URL(value)
    return protocol === "https:" || protocol === "http:"
  } catch {
    return false
  }
}

function cleanSocials(input: unknown): ArtistPageSocials {
  const socials: ArtistPageSocials = {}
  if (!input || typeof input !== "object") return socials
  for (const key of SOCIAL_KEYS) {
    const raw = String((input as Record<string, unknown>)[key] ?? "").trim().slice(0, PAGE_LIMITS.url)
    if (raw && isHttpUrl(raw)) socials[key] = raw
  }
  return socials
}

export async function saveArtistPage(input: ArtistPageContent): Promise<SaveArtistPageResult> {
  const professionalId = await getProfessionalId()
  const ownPrefix = `${MEDIA_PREFIX}${professionalId}/`
  const ownPath = (value: unknown): value is string => isSafeBlobPath(value, ownPrefix)

  if (!input || typeof input !== "object") return { ok: false, error: "invalid" }

  const content: ArtistPageContent = {
    bannerPath: ownPath(input.bannerPath) ? input.bannerPath : null,
    avatarPath: ownPath(input.avatarPath) ? input.avatarPath : null,
    tagline: String(input.tagline ?? "").trim().slice(0, PAGE_LIMITS.tagline),
    about: String(input.about ?? "").trim().slice(0, PAGE_LIMITS.about),
    eventTypes: cleanTags(input.eventTypes),
    musicGenres: cleanTags(input.musicGenres),
    gallery: (Array.isArray(input.gallery) ? input.gallery : []).filter(ownPath).slice(0, PAGE_LIMITS.gallery),
    videos: (Array.isArray(input.videos) ? input.videos : [])
      .filter((video) => video && typeof video.url === "string" && getVideoEmbed(video.url.trim()))
      .slice(0, PAGE_LIMITS.videos)
      .map((video) => ({
        id: String(video.id || crypto.randomUUID()).slice(0, 40),
        url: video.url.trim().slice(0, PAGE_LIMITS.url),
        title: String(video.title ?? "").trim().slice(0, PAGE_LIMITS.videoTitle),
      })),
    socials: cleanSocials(input.socials),
  }

  const [previous] = await db.select().from(artistPages).where(eq(artistPages.professionalId, professionalId)).limit(1)

  const values = {
    bannerPath: content.bannerPath,
    avatarPath: content.avatarPath,
    tagline: content.tagline,
    about: content.about,
    eventTypes: content.eventTypes,
    musicGenres: content.musicGenres,
    gallery: content.gallery,
    videos: content.videos,
    socials: content.socials as Record<string, string>,
    updatedAt: new Date(),
  }

  await db
    .insert(artistPages)
    .values({ professionalId, ...values })
    .onConflictDoUpdate({ target: artistPages.professionalId, set: values })

  await db
    .update(user)
    .set({ image: content.avatarPath ? mediaUrl(content.avatarPath) : null })
    .where(eq(user.id, professionalId))

  if (previous) {
    const kept = new Set([content.bannerPath, content.avatarPath, ...content.gallery])
    const orphaned = [previous.bannerPath, previous.avatarPath, ...previous.gallery].filter(
      (path): path is string => Boolean(path) && !kept.has(path),
    )
    // Only ever delete files under this professional's own prefix.
    const ownOrphaned = orphaned.filter(ownPath)
    await Promise.allSettled(ownOrphaned.map((path) => del(path)))
  }

  const artist = enhancedArtists.find((candidate) => String(candidate.id) === professionalId)
  if (artist) revalidatePath(getArtistPath(artist))
  else revalidatePath("/artiest/[slug]", "page")
  revalidatePath("/dashboard/my-page")

  return { ok: true, content }
}

/** The public page content of a live professional, so the profile modal shows the same cover photo as their page. */
export async function getPublicArtistPageContent(professionalId: string): Promise<ArtistPageContent | null> {
  if (typeof professionalId !== "string" || !(await isLiveProfessional(professionalId))) return null
  return getArtistPageContent(professionalId)
}
