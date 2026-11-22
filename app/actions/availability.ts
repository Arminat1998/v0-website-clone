"use server"

import { and, eq, inArray } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { professionalUnavailableDates } from "@/lib/db/schema"
import { ensureUnavailableDatesTable, loadBlockedByHand, lockDate } from "@/lib/bookings/availability"
import { isBookableDate } from "@/lib/bookings/format"
import { getProfessionalId } from "@/lib/bookings/professional"
import { takeToken } from "@/lib/rate-limit"

/** Enough for a few months at once; the calendar never sends more than one month. */
const MAX_DATES = 100

export type SaveAvailabilityResult =
  | { ok: true; unavailableDates: string[] }
  | { ok: false; error: "UNAUTHORIZED" | "INVALID" | "TOO_MANY" | "FAILED" }

/** The dates the signed-in professional blocked by hand, from today on. */
export async function getMyUnavailableDates(): Promise<string[]> {
  return loadBlockedByHand(await getProfessionalId())
}

/** Blocks (`available: false`) or frees (`available: true`) dates of the signed-in professional. */
export async function saveMyAvailability(input: { dates: string[]; available: boolean }): Promise<SaveAvailabilityResult> {
  let professionalId: string
  try {
    professionalId = await getProfessionalId()
  } catch {
    return { ok: false, error: "UNAUTHORIZED" }
  }
  if (!input || typeof input.available !== "boolean" || !Array.isArray(input.dates) || input.dates.length === 0) {
    return { ok: false, error: "INVALID" }
  }
  if (input.dates.length > MAX_DATES || !takeToken(`availability:${professionalId}`, 120, 10 * 60 * 1000)) {
    return { ok: false, error: "TOO_MANY" }
  }
  if (!input.dates.every(isBookableDate)) return { ok: false, error: "INVALID" }
  // Sorted, so two saves at the same time take the locks in the same order.
  const dates = [...new Set(input.dates)].sort()

  try {
    await ensureUnavailableDatesTable()
    await db.transaction(async (tx) => {
      for (const date of dates) await lockDate(tx, professionalId, date)
      if (input.available) {
        await tx
          .delete(professionalUnavailableDates)
          .where(and(eq(professionalUnavailableDates.professionalId, professionalId), inArray(professionalUnavailableDates.date, dates)))
      } else {
        await tx
          .insert(professionalUnavailableDates)
          .values(dates.map((date) => ({ professionalId, date })))
          .onConflictDoNothing()
      }
    })
  } catch (error) {
    console.error("Failed to save availability:", error)
    return { ok: false, error: "FAILED" }
  }

  revalidatePath("/dashboard/calendar")
  revalidatePath("/artiest/[slug]", "page")
  revalidatePath("/foto-video/[slug]", "page")
  return { ok: true, unavailableDates: await loadBlockedByHand(professionalId) }
}
