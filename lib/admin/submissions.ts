import "server-only"

import { desc, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { artistPages, professionalProfiles, user as userTable } from "@/lib/db/schema"
import { mediaUrl } from "@/lib/artist-page-types"
import { requireAdmin } from "@/lib/session"
import type { ChecklistState, Submission, SubmissionStatus } from "@/contexts/admin-submissions-context"

export const REVIEW_STATUSES: SubmissionStatus[] = [
  "nieuw",
  "in-beoordeling",
  "wacht-op-aanvulling",
  "goedgekeurd",
  "afgewezen",
]

const emptyChecklist: ChecklistState = {
  profielCompleet: false,
  portfolioBekeken: false,
  contactGecontroleerd: false,
  passendBijArsi: false,
}

function asStatus(value: string): SubmissionStatus {
  return (REVIEW_STATUSES as string[]).includes(value) ? (value as SubmissionStatus) : "nieuw"
}

/** Every professional profile as an admin submission, newest first. */
export async function loadSubmissions(): Promise<Submission[]> {
  await requireAdmin()
  const rows = await db
    .select({
      profile: professionalProfiles,
      email: userTable.email,
      page: artistPages,
    })
    .from(professionalProfiles)
    .innerJoin(userTable, eq(userTable.id, professionalProfiles.professionalId))
    .leftJoin(artistPages, eq(artistPages.professionalId, professionalProfiles.professionalId))
    .orderBy(desc(professionalProfiles.submittedAt))

  return rows.map(({ profile, email, page }) => {
    const data = profile.reviewData ?? {}
    const website = profile.socials.find((link) => link.platform === "website")?.url ?? null
    // The page holds the photos visitors see; the profile only until that page exists.
    const avatar = page ? page.avatarPath : profile.avatarPath
    const banner = page ? page.bannerPath : profile.bannerPath
    const gallery = page?.gallery ?? []
    const submittedAt = profile.submittedAt.toISOString()
    return {
      id: profile.professionalId,
      name: profile.stageName || profile.fullName,
      discipline: profile.artistType || "Artiest",
      photo: avatar ? mediaUrl(avatar) : "",
      banner: banner ? mediaUrl(banner) : "",
      email,
      phone: profile.phone,
      city: profile.city,
      submittedAt,
      status: asStatus(profile.reviewStatus),
      reviewer: profile.reviewerName,
      bio: profile.bio,
      experience: profile.yearsExperience ? `${profile.yearsExperience} jaar ervaring` : "",
      availability: `${profile.minHours}-${profile.maxHours} uur per optreden, binnen ${profile.rangeKm} km van ${profile.city || "de woonplaats"}`,
      hourlyRate: Number(profile.hourlyRate) ? `€${Number(profile.hourlyRate)}` : null,
      dayRate: null,
      genres: profile.genres,
      eventTypes: profile.eventTypes,
      website,
      socials: profile.socials
        .filter((link) => link.platform !== "website")
        .map((link) => ({ platform: link.platform, url: link.url })),
      portfolioImages: gallery.map(mediaUrl),
      videoLinks: (page?.videos ?? []).map((video) => ({ title: video.title || video.url, url: video.url })),
      checklist: { ...emptyChecklist, ...(data.checklist ?? {}) },
      notes: data.notes ?? [],
      timeline: (data.timeline ?? []) as Submission["timeline"],
    }
  })
}
