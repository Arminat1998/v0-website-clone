import "server-only"

import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { billingProfiles, professionalProfiles } from "@/lib/db/schema"
import { STANDARD_VAT_RATE } from "@/lib/bookings/invoicing"
import { PACKAGE_OPTION_ID, parseHourlyRateCents, type BookingOption, type BookingOptions } from "@/lib/bookings/pricing"

/**
 * The booking options of a professional: hourly rate, hours, travel range and the equipment and extras from
 * their own profile, plus the VAT that applies on top. Null when the professional has no profile.
 */
export async function loadBookingOptions(professionalId: string): Promise<BookingOptions | null> {
  const [profile] = await db
    .select()
    .from(professionalProfiles)
    .where(eq(professionalProfiles.professionalId, professionalId))
    .limit(1)
  if (!profile) return null
  const [billing] = await db
    .select({ vatScheme: billingProfiles.vatScheme, performanceVatRate: billingProfiles.performanceVatRate })
    .from(billingProfiles)
    .where(eq(billingProfiles.professionalId, professionalId))
    .limit(1)

  // Lighting and sound sets with a category belong to the package; items without a category are optional extras.
  const packageItems = [...Object.values(profile.minimumEquipment ?? {}), ...(profile.extraEquipment ?? []).filter((item) => item.category)]
    .filter((item) => item?.name)
  const packageCents = packageItems.reduce((sum, item) => sum + parseHourlyRateCents(item.price), 0)
  const extras: BookingOption[] = (profile.extraEquipment ?? [])
    .filter((item) => !item.category && item.name && item.id)
    .map((item) => ({ id: `extra:${item.id}`, label: item.name, priceCents: parseHourlyRateCents(item.price) }))

  const kor = billing?.vatScheme === "kor"
  return {
    hourlyRateCents: parseHourlyRateCents(Number(profile.hourlyRate)),
    minHours: profile.minHours,
    maxHours: Math.max(profile.minHours, profile.maxHours),
    rangeKm: profile.rangeKm,
    package: packageCents > 0 ? { id: PACKAGE_OPTION_ID, label: "Apparatuurpakket", priceCents: packageCents } : null,
    extras,
    vat: {
      performanceRate: kor ? 0 : (billing?.performanceVatRate ?? 9),
      equipmentRate: kor ? 0 : STANDARD_VAT_RATE,
    },
  }
}

export async function loadProfessionalCity(professionalId: string) {
  const [row] = await db
    .select({ city: professionalProfiles.city })
    .from(professionalProfiles)
    .where(eq(professionalProfiles.professionalId, professionalId))
    .limit(1)
  return row?.city?.trim() || null
}
