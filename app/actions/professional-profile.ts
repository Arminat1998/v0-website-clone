"use server"

import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { artistPages, billingProfiles, professionalProfiles, user as userTable } from "@/lib/db/schema"
import { getProfessionalId } from "@/lib/bookings/professional"
import { SOCIAL_KEYS, mediaUrl, type ArtistPageSocials, type SocialKey } from "@/lib/artist-page-types"
import type {
  ProfessionalProfileData,
  ProfileEquipmentItem,
  ProfileSocialLink,
} from "@/lib/professional-profile-types"

export type SaveProfessionalProfileInput = Omit<ProfessionalProfileData, "email"> & {
  /** Display labels for the selected genres, used for the public page. */
  genreLabels: string[]
}

export type SaveProfessionalProfileResult = { ok: true } | { ok: false; error: "invalid" | "failed" }

const text = (value: unknown, max: number) => String(value ?? "").trim().slice(0, max)
const int = (value: unknown, min: number, max: number, fallback: number) => {
  const parsed = Math.round(Number(value))
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback
}
const list = (values: unknown, max = 30) =>
  Array.isArray(values) ? [...new Set(values.map((value) => text(value, 60)).filter(Boolean))].slice(0, max) : []

function cleanImage(value: unknown) {
  const image = text(value, 500)
  // Only stored blob pathnames are accepted; raw data URLs are uploaded by the browser first.
  return image && !image.startsWith("data:") && !image.startsWith("blob:") ? image : undefined
}

function cleanEquipment(item: Partial<ProfileEquipmentItem> | undefined): ProfileEquipmentItem | null {
  if (!item) return null
  const name = text(item.name, 120)
  if (!name) return null
  return {
    id: text(item.id, 60) || crypto.randomUUID(),
    name,
    price: text(item.price, 40),
    description: text(item.description, 400),
    image: cleanImage(item.image),
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

  const stageName = text(input.stageName, 80)
  const fullName = text(input.fullName, 120)
  if (!stageName || !fullName) return { ok: false, error: "invalid" }

  const minHours = int(input.minHours, 1, 24, 1)
  const maxHours = Math.max(minHours, int(input.maxHours, 1, 24, 8))
  const hourlyRate = Math.min(100000, Math.max(0, Number(input.hourlyRate) || 0))

  const socials: ProfileSocialLink[] = Array.isArray(input.socials)
    ? input.socials
        .map((link) => ({ id: text(link?.id, 60) || crypto.randomUUID(), platform: text(link?.platform, 30), url: text(link?.url, 300) }))
        .filter((link) => link.platform && /^https?:\/\//i.test(link.url))
        .slice(0, 12)
    : []

  const minimumEquipment: Record<string, ProfileEquipmentItem> = {}
  for (const [key, item] of Object.entries(input.minimumEquipment ?? {}).slice(0, 12)) {
    const cleaned = cleanEquipment(item)
    if (cleaned) minimumEquipment[text(key, 60)] = { ...cleaned, id: text(key, 60) }
  }
  const extraEquipment = (Array.isArray(input.extraEquipment) ? input.extraEquipment : [])
    .slice(0, 60)
    .map(cleanEquipment)
    .filter((item): item is ProfileEquipmentItem => item !== null)

  const genres = list(input.genres)
  const eventTypes = list(input.eventTypes)
  const genreLabels = list(input.genreLabels)
  const avatarPath = cleanImage(input.avatarPath) ?? null
  const bannerPath = cleanImage(input.bannerPath) ?? null
  const phone = text(input.phone, 40)

  const values = {
    stageName,
    fullName,
    phone,
    companyName: text(input.companyName, 120),
    kvkNumber: text(input.kvkNumber, 8),
    vatNumber: text(input.vatNumber, 20),
    bio: text(input.bio, 2000),
    yearsExperience: int(input.yearsExperience, 0, 80, 0),
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

  try {
    const [existingProfile] = await db
      .select({
        avatarPath: professionalProfiles.avatarPath,
        bannerPath: professionalProfiles.bannerPath,
        reviewStatus: professionalProfiles.reviewStatus,
        reviewData: professionalProfiles.reviewData,
      })
      .from(professionalProfiles)
      .where(eq(professionalProfiles.professionalId, professionalId))
      .limit(1)

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

    await db
      .insert(professionalProfiles)
      .values({ professionalId, ...values, avatarPath: profileAvatar, bannerPath: profileBanner, ...review })
      .onConflictDoUpdate({
        target: professionalProfiles.professionalId,
        set: { ...values, avatarPath: profileAvatar, bannerPath: profileBanner, ...review },
      })

    await db
      .update(userTable)
      .set({ name: stageName, phone: phone || null, ...(profileAvatar ? { image: mediaUrl(profileAvatar) } : {}) })
      .where(eq(userTable.id, professionalId))

    const billing = {
      businessName: values.companyName || stageName,
      kvkNumber: values.kvkNumber || null,
      vatNumber: values.vatNumber || null,
      city: values.city || null,
    }
    await db
      .insert(billingProfiles)
      .values({ professionalId, ...billing })
      .onConflictDoUpdate({ target: billingProfiles.professionalId, set: { ...billing, updatedAt: new Date() } })

    const pageSocials: ArtistPageSocials = {}
    for (const link of socials) {
      if ((SOCIAL_KEYS as readonly string[]).includes(link.platform)) pageSocials[link.platform as SocialKey] = link.url
    }

    const [page] = await db.select().from(artistPages).where(eq(artistPages.professionalId, professionalId)).limit(1)
    if (!page) {
      await db.insert(artistPages).values({
        professionalId,
        avatarPath: profileAvatar,
        bannerPath: profileBanner,
        about: values.bio,
        eventTypes,
        musicGenres: genreLabels,
        socials: pageSocials,
      })
    } else {
      await db
        .update(artistPages)
        .set({
          avatarPath: avatarPath ?? page.avatarPath ?? profileAvatar,
          bannerPath: bannerPath ?? page.bannerPath ?? profileBanner,
          about: page.about?.trim() ? page.about : values.bio,
          eventTypes: page.eventTypes.length ? page.eventTypes : eventTypes,
          musicGenres: page.musicGenres.length ? page.musicGenres : genreLabels,
          socials: { ...pageSocials, ...page.socials },
          updatedAt: new Date(),
        })
        .where(eq(artistPages.professionalId, professionalId))
    }
  } catch (error) {
    console.error("Failed to save professional profile:", error)
    return { ok: false, error: "failed" }
  }

  revalidatePath("/dashboard", "layout")
  revalidatePath("/artiest/[slug]", "page")
  return { ok: true }
}
