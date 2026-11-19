import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { professionalProfiles, user } from "@/lib/db/schema";
import { artists, photographers } from "@/lib/smart-search";
import { getArtistPath } from "@/lib/artist-slug";
import { getRestriction } from "@/lib/moderation";
import { getProfessionalArtistPath } from "@/lib/professional-artist";
import { isPhotoVideo } from "@/lib/profile-options";
import type { FavoriteItem, FavoriteType } from "@/lib/customer-types";

export async function resolveCustomerProfessional(
  id: string,
  type: FavoriteType,
): Promise<FavoriteItem | null> {
  const staticItem = (type === "artist" ? artists : photographers).find(
    (item) => String(item.id) === id,
  );
  if (staticItem)
    return {
      professionalId: id,
      professionalType: type,
      name: staticItem.name,
      specialty: staticItem.specialty,
      location: staticItem.location,
      price: staticItem.price,
      image: staticItem.image || null,
      available: true,
      href:
        type === "artist"
          ? getArtistPath(staticItem as (typeof artists)[number])
          : `/booking?professionalId=${encodeURIComponent(id)}&type=photographer`,
    };
  const [row] = await db
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
    .innerJoin(
      professionalProfiles,
      eq(professionalProfiles.professionalId, user.id),
    )
    .where(
      and(
        eq(user.id, id),
        eq(user.role, "professional"),
        eq(professionalProfiles.reviewStatus, "goedgekeurd"),
      ),
    )
    .limit(1);
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
    href: getProfessionalArtistPath({
      id,
      name: row.stageName || row.name,
      category: row.category,
    }),
  };
}
