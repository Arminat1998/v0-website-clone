import "server-only"

import { and, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { artistPages, professionalProfiles, user as userTable } from "@/lib/db/schema"
import { mediaUrl } from "@/lib/artist-page-types"
import { slugify } from "@/lib/artist-slug"
import { getRestriction } from "@/lib/moderation"
import { digitsOnlyPrice } from "@/lib/professional-profile-types"
import { canonicalEventType, genreLabel, isPhotoVideo } from "@/lib/profile-options"
import type { Artist, EquipmentDetail, Photographer } from "@/lib/smart-search"

interface ProfessionalAccount {
  id: string
  name: string
  image?: string | null
  category?: string | null
  bannerPath?: string | null
  avatarPath?: string | null
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

/** Day price of the equipment package: the sum of its items, like the single package price on the cards. */
function packagePrice(items: EquipmentDetail[]) {
  const total = items.reduce((sum, item) => sum + (Number(digitsOnlyPrice(item.price)) || 0), 0)
  if (total <= 0) return undefined
  return `€${Number.isInteger(total) ? total : total.toFixed(2).replace(".", ",")}`
}

export function buildProfessionalArtist(account: ProfessionalAccount, profile?: ProfessionalProfileSummary | null): Artist {
  return {
    // Real accounts use string ids; the website only interpolates the id into URLs.
    id: account.id as unknown as number,
    name: profile?.stageName || account.name,
    specialty: profile?.artistType || (CATEGORY_LABELS[account.category ?? ""] ?? "Professional"),
    location: profile?.city ?? "",
    description: profile?.bio || undefined,
    eventTypes: profile?.eventTypes.length ? [...new Set(profile.eventTypes.map(canonicalEventType))] : undefined,
    // Genres are stored by value; show and filter on their English names, like the other artists.
    musicStyles: profile?.genres.length ? [...new Set(profile.genres.map((value) => genreLabel(value, false)))] : undefined,
    experience: profile?.yearsExperience ? `${profile.yearsExperience}` : undefined,
    equipment: profile?.equipment.length ? profile.equipment : undefined,
    equipmentDetails: { packageItems: profile?.packageItems ?? [], extraItems: profile?.extraItems ?? [] },
    equipmentPrice: packagePrice(profile?.packageItems ?? []),
    rating: 0,
    reviews: 0,
    price: profile?.hourlyRate ? `€${profile.hourlyRate}` : "€0",
    available: true,
    category: account.category ?? undefined,
    image: account.image ?? undefined,
    banner: account.bannerPath ? mediaUrl(account.bannerPath) : undefined,
    avatar: account.avatarPath ? mediaUrl(account.avatarPath) : undefined,
    kind: isPhotoVideo(account.category) ? "photo-video" : "artist",
  }
}

/** Artists live under /artiest, photographers and videographers under /foto-video. */
export function getProfessionalArtistPath(account: ProfessionalAccount) {
  const base = isPhotoVideo(account.category) ? "/foto-video" : "/artiest"
  return `${base}/${slugify(account.name) || "professional"}-${account.id}`
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

/** All professionals whose profile was approved in the admin dashboard and whose account is not restricted. */
async function listLiveAccounts() {
  const rows = await db
    .select({
      id: userTable.id,
      name: userTable.name,
      image: userTable.image,
      category: userTable.category,
      status: userTable.status,
      statusReason: userTable.statusReason,
      suspendedUntil: userTable.suspendedUntil,
      bannerPath: artistPages.bannerPath,
      avatarPath: artistPages.avatarPath,
    })
    .from(userTable)
    .innerJoin(professionalProfiles, eq(professionalProfiles.professionalId, userTable.id))
    .leftJoin(artistPages, eq(artistPages.professionalId, userTable.id))
    .where(and(eq(userTable.role, "professional"), eq(professionalProfiles.reviewStatus, "goedgekeurd")))
  return rows.filter((account) => !getRestriction(account))
}

/** Approved artists. Photographers and videographers have their own list. */
export async function listLiveProfessionalArtists(): Promise<Artist[]> {
  try {
    const rows = await listLiveAccounts()
    const artists = await Promise.all(
      rows
        .filter((account) => !isPhotoVideo(account.category))
        .map(async (account) => {
          const profile = await getProfessionalProfileSummary(account.id)
          const artist = buildProfessionalArtist(account, profile)
          // The overview filters on categories such as "DJ" or "Band", so use the artist type from the profile.
          return profile?.artistType ? { ...artist, category: profile.artistType } : artist
        }),
    )
    return artists
  } catch (error) {
    console.error("Failed to list live professionals:", error)
    return []
  }
}

/** Approved photographers and videographers, in the shape of the photo & video page. */
export async function listLivePhotographers(): Promise<Photographer[]> {
  try {
    const rows = await listLiveAccounts()
    return await Promise.all(
      rows
        .filter((account) => isPhotoVideo(account.category))
        .map(async (account) => {
          const profile = await getProfessionalProfileSummary(account.id)
          const artist = buildProfessionalArtist(account, profile)
          const type = profile?.artistType || "Photographer"
          return {
            id: artist.id,
            name: artist.name,
            specialty: type,
            location: artist.location,
            rating: 0,
            reviews: 0,
            price: artist.price,
            available: true,
            description: artist.description,
            eventTypes: artist.eventTypes,
            serviceTypes: artist.musicStyles,
            experience: artist.experience,
            // The page filters on "Photographer", "Videographer" or both.
            category: type,
            image: artist.image,
            banner: artist.banner,
            avatar: artist.avatar,
            href: getProfessionalArtistPath(account),
            equipmentDetails: artist.equipmentDetails,
          }
        }),
    )
  } catch (error) {
    console.error("Failed to list live photographers:", error)
    return []
  }
}

/** True when the professional is approved and not restricted, so their page is public. */
export async function isLiveProfessional(id: string): Promise<boolean> {
  if (!/^[A-Za-z0-9_-]{8,64}$/.test(id)) return false
  try {
    const [account] = await db
      .select({
        status: userTable.status,
        statusReason: userTable.statusReason,
        suspendedUntil: userTable.suspendedUntil,
        review: professionalProfiles.reviewStatus,
      })
      .from(userTable)
      .innerJoin(professionalProfiles, eq(professionalProfiles.professionalId, userTable.id))
      .where(and(eq(userTable.id, id), eq(userTable.role, "professional")))
      .limit(1)
    return !!account && account.review === "goedgekeurd" && !getRestriction(account)
  } catch (error) {
    console.error("Failed to check professional status:", error)
    return false
  }
}

/** A live professional by the slug of their page; `kind` keeps artists and photographers on their own pages. */
export async function getProfessionalArtistBySlug(
  slug: string,
  kind: "artist" | "photo-video" = "artist",
): Promise<Artist | null> {
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
    if (isPhotoVideo(account.category) !== (kind === "photo-video")) return null
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
