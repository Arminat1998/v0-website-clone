import "server-only"

import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { professionalProfiles } from "@/lib/db/schema"
import type { ProfessionalProfileData } from "@/lib/professional-profile-types"
import { logError } from "@/lib/log-error"

export async function getProfessionalProfile(
  professionalId: string,
  account: { email: string; phone?: string | null; name: string },
): Promise<ProfessionalProfileData | null> {
  try {
    const [row] = await db
      .select()
      .from(professionalProfiles)
      .where(eq(professionalProfiles.professionalId, professionalId))
      .limit(1)
    if (!row) return null

    return {
      stageName: row.stageName || account.name,
      fullName: row.fullName,
      email: account.email,
      phone: row.phone || account.phone || "",
      companyName: row.companyName,
      kvkNumber: row.kvkNumber,
      vatNumber: row.vatNumber,
      bio: row.bio,
      yearsExperience: row.yearsExperience,
      hourlyRate: Number(row.hourlyRate),
      minHours: row.minHours,
      maxHours: row.maxHours,
      city: row.city,
      rangeKm: row.rangeKm,
      artistType: row.artistType,
      genres: row.genres,
      eventTypes: row.eventTypes,
      socials: row.socials,
      minimumEquipment: row.minimumEquipment,
      extraEquipment: row.extraEquipment,
      avatarPath: row.avatarPath,
      bannerPath: row.bannerPath,
    }
  } catch (error) {
    logError("Failed to load professional profile:", error)
    return null
  }
}

export async function getProfileRow(professionalId: string) {
  const [row] = await db
    .select()
    .from(professionalProfiles)
    .where(eq(professionalProfiles.professionalId, professionalId))
    .limit(1)
  return row ?? null
}
