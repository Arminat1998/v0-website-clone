"use server"

import { eq, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { artistPages, billingProfiles, professionalProfiles, user as userTable } from "@/lib/db/schema"
import { getProfessionalId } from "@/lib/bookings/professional"
import { ALLROUND, isDj, isPhotoVideo, mainGenres } from "@/lib/profile-options"
import { MEDIA_PREFIX, mediaUrl } from "@/lib/artist-page-types"
import { socialsForPage, syncPageWithProfile, type SyncedField } from "@/lib/profile-page-sync"
import { httpUrl } from "@/lib/http-url"
import { isSafeBlobPath } from "@/lib/blob-paths"
import type {
  ProfessionalProfileData,
  ProfileEquipmentItem,
  ProfileSocialLink,
} from "@/lib/professional-profile-types"
import { logError } from "@/lib/log-error"

export type SaveProfessionalProfileInput = Omit<ProfessionalProfileData, "email"> & {
  /** Display labels for the selected genres, used for the public page. */
  genreLabels: string[]
}

/** `kept`: parts of "My website" that were edited there, so this change did not reach them. */
export type SaveProfessionalProfileResult = { ok: true; kept: SyncedField[] } | { ok: false; error: "invalid" | "failed" }

const text = (value: unknown, max: number) => String(value ?? "").trim().slice(0, max)
const int = (value: unknown, min: number, max: number, fallback: number) => {
  const parsed = Math.round(Number(value))
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback
}
const list = (values: unknown, max = 30) =>
  Array.isArray(values) ? [...new Set(values.map((value) => text(value, 60)).filter(Boolean))].slice(0, max) : []

/** Only blob pathnames under this professional's own media prefix are accepted; the browser uploads data URLs first. */
function cleanImage(value: unknown, ownPrefix: string) {
  const image = text(value, 500)
  return isSafeBlobPath(image, ownPrefix) ? image : undefined
}

function cleanEquipment(item: Partial<ProfileEquipmentItem> | undefined, ownPrefix: string): ProfileEquipmentItem | null {
  if (!item) return null
  const name = text(item.name, 120)
  if (!name) return null
  return {
    id: text(item.id, 60) || crypto.randomUUID(),
    name,
    price: text(item.price, 40),
    description: text(item.description, 400),
    image: cleanImage(item.image, ownPrefix),
    category: item.category === "lighting" || item.category === "sound" ? item.category : undefined,
  }
}

export async function saveProfessionalProfile(input: SaveProfessionalProfileInput): Promise<SaveProfessionalProfileResult> {
  let professionalId: string
  try {
    professionalId = await getProfessionalId()
  } catch {
    return { ok: false, error: "invalid" }
  }

  const ownPrefix = `${MEDIA_PREFIX}${professionalId}/`
  const stageName = text(input.stageName, 80)
  const fullName = text(input.fullName, 120)
  if (!stageName || !fullName || !text(input.companyName, 120)) return { ok: false, error: "invalid" }

  const minHours = int(input.minHours, 1, 24, 1)
  const maxHours = Math.max(minHours, int(input.maxHours, 1, 24, 8))
  const hourlyRate = Math.min(100000, Math.max(0, Number(input.hourlyRate) || 0))

  const socials: ProfileSocialLink[] = Array.isArray(input.socials)
    ? input.socials
        .map((link) => ({ id: text(link?.id, 60) || crypto.randomUUID(), platform: text(link?.platform, 30), url: text(link?.url, 300) }))
        .filter((link) => link.platform && httpUrl(link.url))
        .slice(0, 12)
    : []

  const minimumEquipment: Record<string, ProfileEquipmentItem> = {}
  for (const [key, item] of Object.entries(input.minimumEquipment ?? {}).slice(0, 12)) {
    const cleaned = cleanEquipment(item, ownPrefix)
    if (cleaned) minimumEquipment[text(key, 60)] = { ...cleaned, id: text(key, 60) }
  }
  const extraEquipment = (Array.isArray(input.extraEquipment) ? input.extraEquipment : [])
    .slice(0, 60)
    .map((item) => cleanEquipment(item, ownPrefix))
    .filter((item): item is ProfileEquipmentItem => item !== null)

  // Allround is only for DJs; it is kept next to the main genres, which must stay.
  const genres = list(input.genres).filter((value) => value !== ALLROUND || isDj(input.artistType))
  const eventTypes = list(input.eventTypes)
  const genreLabels = list(input.genreLabels).filter((label) => label.trim().toLowerCase() !== ALLROUND)
  // The form checks this too; here it stops a profile that skips the form's checks.
  const completeEquipment = Object.values(minimumEquipment).filter((item) => item.name && item.price && item.description && item.image)
  // Photographers and videographers have no required equipment package.
  let photo = false
  try {
    const [account] = await db.select({ category: userTable.category }).from(userTable).where(eq(userTable.id, professionalId)).limit(1)
    photo = isPhotoVideo(account?.category)
  } catch {
    return { ok: false, error: "failed" }
  }
  if (mainGenres(genres).length === 0 || eventTypes.length === 0 || (!photo && completeEquipment.length === 0)) return { ok: false, error: "invalid" }
  const avatarPath = cleanImage(input.avatarPath, ownPrefix) ?? null
  const bannerPath = cleanImage(input.bannerPath, ownPrefix) ?? null
  const phone = text(input.phone, 40)

  const values = {
    stageName,
    fullName,
    phone,
    companyName: text(input.companyName, 120),
    kvkNumber: text(input.kvkNumber, 8),
    vatNumber: text(input.vatNumber, 20),
    bio: text(input.bio, 2000),
    yearsExperience: int(input.yearsExperience, 0, 60, 0),
    hourlyRate: hourlyRate.toFixed(2),
    minHours,
    maxHours,
    city: text(input.city, 80),
    rangeKm: int(input.rangeKm, 0, 5000, 100),
    artistType: text(input.artistType, 30),
    genres,
    eventTypes,
    socials,
    minimumEquipment,
    extraEquipment,
    updatedAt: new Date(),
  }

  let kept: SyncedField[] = []
  try {
    // Together, so a failure halfway or a second save at the same time never leaves the page behind on the profile.
    kept = await db.transaction(async (tx) => {
      const [existingProfile] = await tx
        .select({
          avatarPath: professionalProfiles.avatarPath,
          bannerPath: professionalProfiles.bannerPath,
          reviewStatus: professionalProfiles.reviewStatus,
          reviewData: professionalProfiles.reviewData,
          bio: professionalProfiles.bio,
          genres: professionalProfiles.genres,
          eventTypes: professionalProfiles.eventTypes,
          socials: professionalProfiles.socials,
        })
        .from(professionalProfiles)
        .where(eq(professionalProfiles.professionalId, professionalId))
        .limit(1)
        .for("update")

      const profileAvatar = avatarPath ?? existingProfile?.avatarPath ?? null
      const profileBanner = bannerPath ?? existingProfile?.bannerPath ?? null

      // New profiles enter the admin screening queue; a profile that was asked for more info goes back to the queue.
      const now = new Date().toISOString()
      const timeline = existingProfile?.reviewData?.timeline ?? []
      const entry = (title: string) => ({ id: crypto.randomUUID(), type: "aanmelding", date: now, title, author: "Systeem" })
      const review: Partial<typeof professionalProfiles.$inferInsert> = {}
      if (!existingProfile) {
        review.reviewStatus = "nieuw"
        review.reviewData = { timeline: [entry("Aanmelding ontvangen")] }
      } else if (existingProfile.reviewStatus === "wacht-op-aanvulling") {
        review.reviewStatus = "nieuw"
        review.submittedAt = new Date()
        review.reviewData = { ...existingProfile.reviewData, timeline: [...timeline, entry("Aanvulling ontvangen")] }
      }

      await tx
        .insert(professionalProfiles)
        .values({ professionalId, ...values, avatarPath: profileAvatar, bannerPath: profileBanner, ...review })
        .onConflictDoUpdate({
          target: professionalProfiles.professionalId,
          set: { ...values, avatarPath: profileAvatar, bannerPath: profileBanner, ...review },
        })

      await tx
        .update(userTable)
        .set({ name: stageName, phone: phone || null, ...(profileAvatar ? { image: mediaUrl(profileAvatar) } : {}) })
        .where(eq(userTable.id, professionalId))

      const billing = {
        businessName: values.companyName || stageName,
        kvkNumber: values.kvkNumber || null,
        vatNumber: values.vatNumber || null,
        city: values.city || null,
      }
      // The invoice details are kept in the invoice step: the profile only fills in what is still empty there.
      await tx
        .insert(billingProfiles)
        .values({ professionalId, ...billing })
        .onConflictDoUpdate({
          target: billingProfiles.professionalId,
          set: {
            businessName: sql`coalesce(nullif(${billingProfiles.businessName}, ''), excluded.business_name)`,
            kvkNumber: sql`coalesce(nullif(${billingProfiles.kvkNumber}, ''), excluded.kvk_number)`,
            vatNumber: sql`coalesce(nullif(${billingProfiles.vatNumber}, ''), excluded.vat_number)`,
            city: sql`coalesce(nullif(${billingProfiles.city}, ''), excluded.city)`,
            updatedAt: new Date(),
          },
        })

      const [page] = await tx.select().from(artistPages).where(eq(artistPages.professionalId, professionalId)).limit(1).for("update")
      if (!page) {
        await tx.insert(artistPages).values({
          professionalId,
          avatarPath: profileAvatar,
          bannerPath: profileBanner,
          about: values.bio,
          eventTypes,
          musicGenres: genreLabels,
          socials: socialsForPage(socials),
        })
        return []
      }
      const synced = syncPageWithProfile(
        { about: page.about ?? "", eventTypes: page.eventTypes, musicGenres: page.musicGenres, socials: page.socials },
        existingProfile ?? null,
        { bio: values.bio, eventTypes, genres, genreLabels, socials },
      )
      await tx
        .update(artistPages)
        .set({
          ...synced.page,
          avatarPath: avatarPath ?? page.avatarPath ?? profileAvatar,
          bannerPath: bannerPath ?? page.bannerPath ?? profileBanner,
          updatedAt: new Date(),
        })
        .where(eq(artistPages.professionalId, professionalId))
      return synced.kept
    })
  } catch (error) {
    logError("Failed to save professional profile:", error)
    return { ok: false, error: "failed" }
  }

  revalidatePath("/dashboard", "layout")
  revalidatePath("/artiest/[slug]", "page")
  revalidatePath("/foto-video/[slug]", "page")
  return { ok: true, kept }
}
