import "server-only"

import { and, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { professionalProfiles, user as userTable } from "@/lib/db/schema"
import { slugify } from "@/lib/artist-slug"
import { getRestriction } from "@/lib/moderation"
import type { Artist, EquipmentDetail } from "@/lib/smart-search"

interface ProfessionalAccount {
  id: string
  name: string
  image?: string | null
  category?: string | null
}

const CATEGORY_LABELS: Record<string, string> = {
  artist: "Artiest",
  "photo-video": "Foto & Video",
  venue: "Locatie",
  catering: "Catering",
}

/** Builds the artist shape used by the website from a real professional account. */
export interface ProfessionalProfileSummary {
  stageName: string
  bio: string
  city: string
  hourlyRate: number
  yearsExperience: number
  artistType: string
  genres: string[]
  eventTypes: string[]
  avatarPath: string | null
  equipment: string[]
  packageItems: EquipmentDetail[]
  extraItems: EquipmentDetail[]
}

export function buildProfessionalArtist(account: ProfessionalAccount, profile?: ProfessionalProfileSummary | null): Artist {
  return {
    // Real accounts use string ids; the website only interpolates the id into URLs.
    id: account.id as unknown as number,
    name: profile?.stageName || account.name,
    specialty: profile?.artistType || (CATEGORY_LABELS[account.category ?? ""] ?? "Professional"),
    location: profile?.city ?? "",
    description: profile?.bio || undefined,
    eventTypes: profile?.eventTypes.length ? profile.eventTypes : undefined,
    musicStyles: profile?.genres.length ? profile.genres : undefined,
    experience: profile?.yearsExperience ? `${profile.yearsExperience}` : undefined,
    equipment: profile?.equipment.length ? profile.equipment : undefined,
    equipmentDetails: { packageItems: profile?.packageItems ?? [], extraItems: profile?.extraItems ?? [] },
    rating: 0,
    reviews: 0,
    price: profile?.hourlyRate ? `€${profile.hourlyRate}` : "€0",
    available: true,
    category: account.category ?? undefined,
    image: account.image ?? undefined,
  }
}

export function getProfessionalArtistPath(account: ProfessionalAccount) {
  return `/artiest/${slugify(account.name) || "professional"}-${account.id}`
}

export async function getProfessionalProfileSummary(professionalId: string): Promise<ProfessionalProfileSummary | null> {
  try {
    const [row] = await db
      .select()
      .from(professionalProfiles)
      .where(eq(professionalProfiles.professionalId, professionalId))
      .limit(1)
    if (!row) return null
    // Extra lighting/sound sets (with a category) belong to the equipment package; only uncategorised items are optional extras.
    const toDetail = (item: { name: string; description: string; price: string; image?: string }) => ({
      name: item.name,
      description: item.description,
      price: item.price,
      image: item.image,
    })
    const packageItems = [
      ...Object.values(row.minimumEquipment),
      ...row.extraEquipment.filter((item) => item.category),
    ]
      .filter((item) => item.name)
      .map(toDetail)
    const extraItems = row.extraEquipment
      .filter((item) => !item.category && item.name)
      .map(toDetail)
    return {
      stageName: row.stageName,
      bio: row.bio,
      city: row.city,
      hourlyRate: Number(row.hourlyRate),
      yearsExperience: row.yearsExperience,
      artistType: row.artistType,
      genres: row.genres,
      eventTypes: row.eventTypes,
      avatarPath: row.avatarPath,
      equipment: [...packageItems, ...extraItems].map((item) => item.name),
      packageItems,
      extraItems,
    }
  } catch (error) {
    console.error("Failed to load profile summary:", error)
    return null
  }
}

export async function getProfessionalArtistBySlug(slug: string): Promise<Artist | null> {
  const separator = slug.lastIndexOf("-")
  if (separator < 1) return null
  const id = slug.slice(separator + 1)
  if (!/^[A-Za-z0-9_-]{8,64}$/.test(id)) return null

  try {
    const [account] = await db
      .select({
        id: userTable.id,
        name: userTable.name,
        image: userTable.image,
        category: userTable.category,
        status: userTable.status,
        statusReason: userTable.statusReason,
        suspendedUntil: userTable.suspendedUntil,
      })
      .from(userTable)
      .where(and(eq(userTable.id, id), eq(userTable.role, "professional")))
      .limit(1)
    if (!account || getRestriction(account)) return null
    // Only profiles approved in the admin dashboard are live on the platform.
    const [review] = await db
      .select({ status: professionalProfiles.reviewStatus })
      .from(professionalProfiles)
      .where(eq(professionalProfiles.professionalId, account.id))
      .limit(1)
    if (review?.status !== "goedgekeurd") return null
    return buildProfessionalArtist(account, await getProfessionalProfileSummary(account.id))
  } catch (error) {
    console.error("Failed to load professional account:", error)
    return null
  }
}
