import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { professionalProfiles, user } from "@/lib/db/schema";
import { artists, photographers } from "@/lib/smart-search";
import { getArtistPath } from "@/lib/artist-slug";
import { getRestriction } from "@/lib/moderation";
import { getProfessionalArtistPath } from "@/lib/professional-artist";
import { isPhotoVideo } from "@/lib/profile-options";
import type { FavoriteItem, FavoriteType } from "@/lib/customer-types";

function sampleItem(id: string, type: FavoriteType): FavoriteItem | null {
  const item = (type === "artist" ? artists : photographers).find((sample) => String(sample.id) === id);
  if (!item) return null;
  return {
    professionalId: id,
    professionalType: type,
    name: item.name,
    specialty: item.specialty,
    location: item.location,
    price: item.price,
    image: item.image || null,
    available: true,
    href:
      type === "artist"
        ? getArtistPath(item as (typeof artists)[number])
        : `/booking?professionalId=${encodeURIComponent(id)}&type=photographer`,
  };
}

/** The sample and approved professionals behind these ids, in one query. Unknown or unavailable ones are null. */
export async function resolveCustomerProfessionals(
  wanted: { id: string; type: FavoriteType }[],
): Promise<(FavoriteItem | null)[]> {
  const samples = wanted.map(({ id, type }) => sampleItem(id, type));
  const ids = wanted.filter((_, index) => !samples[index]).map(({ id }) => id);
  const rows = ids.length
    ? await db
        .select({
          id: user.id,
          name: user.name,
          image: user.image,
          category: user.category,
          status: user.status,
          statusReason: user.statusReason,
          suspendedUntil: user.suspendedUntil,
          stageName: professionalProfiles.stageName,
          specialty: professionalProfiles.artistType,
          city: professionalProfiles.city,
          rate: professionalProfiles.hourlyRate,
        })
        .from(user)
        .innerJoin(professionalProfiles, eq(professionalProfiles.professionalId, user.id))
        .where(
          and(
            inArray(user.id, ids),
            eq(user.role, "professional"),
            eq(professionalProfiles.reviewStatus, "goedgekeurd"),
          ),
        )
    : [];
  const byId = new Map(rows.map((row) => [row.id, row]));
  return wanted.map(({ id, type }, index) => {
    if (samples[index]) return samples[index];
    const row = byId.get(id);
    if (!row || getRestriction(row)) return null;
    // Registered photographers and videographers are saved and booked as "photographer".
    if (isPhotoVideo(row.category) !== (type === "photographer")) return null;
    return {
      professionalId: id,
      professionalType: type,
      name: row.stageName || row.name,
      specialty: row.specialty,
      location: row.city,
      price: `€${row.rate}`,
      image: row.image,
      available: true,
      href: getProfessionalArtistPath({ id, name: row.stageName || row.name, category: row.category }),
    };
  });
}

export async function resolveCustomerProfessional(id: string, type: FavoriteType): Promise<FavoriteItem | null> {
  const [item] = await resolveCustomerProfessionals([{ id, type }]);
  return item;
}
