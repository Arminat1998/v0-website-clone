import "server-only"

import { and, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { user as userTable } from "@/lib/db/schema"
import { slugify } from "@/lib/artist-slug"
import type { Artist } from "@/lib/smart-search"

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
export function buildProfessionalArtist(account: ProfessionalAccount): Artist {
  return {
    // Real accounts use string ids; the website only interpolates the id into URLs.
    id: account.id as unknown as number,
    name: account.name,
    specialty: CATEGORY_LABELS[account.category ?? ""] ?? "Professional",
    location: "",
    rating: 0,
    reviews: 0,
    price: "€0",
    available: true,
    category: account.category ?? undefined,
    image: account.image ?? undefined,
  }
}

export function getProfessionalArtistPath(account: ProfessionalAccount) {
  return `/artiest/${slugify(account.name) || "professional"}-${account.id}`
}

export async function getProfessionalArtistBySlug(slug: string): Promise<Artist | null> {
  const separator = slug.lastIndexOf("-")
  if (separator < 1) return null
  const id = slug.slice(separator + 1)
  if (!/^[A-Za-z0-9_-]{8,64}$/.test(id)) return null

  try {
    const [account] = await db
      .select({ id: userTable.id, name: userTable.name, image: userTable.image, category: userTable.category })
      .from(userTable)
      .where(and(eq(userTable.id, id), eq(userTable.role, "professional")))
      .limit(1)
    return account ? buildProfessionalArtist(account) : null
  } catch (error) {
    console.error("Failed to load professional account:", error)
    return null
  }
}
