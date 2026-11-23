import "server-only"

import { randomBytes } from "node:crypto"
import { and, avg, count, inArray, isNotNull } from "drizzle-orm"
import { db } from "@/lib/db"
import { reviews } from "@/lib/db/schema"
import { logError } from "@/lib/log-error"

export interface RatingSummary {
  /** Average of the stars, rounded to one decimal. */
  rating: number
  reviews: number
}

/** Average and number of submitted reviews, for all these professionals in one query; only stars, no texts. */
export async function loadRatings(professionalIds: string[]): Promise<Map<string, RatingSummary>> {
  if (professionalIds.length === 0) return new Map()
  try {
    const rows = await db
      .select({ id: reviews.professionalId, rating: avg(reviews.rating), reviews: count() })
      .from(reviews)
      .where(and(inArray(reviews.professionalId, professionalIds), isNotNull(reviews.submittedAt), isNotNull(reviews.rating)))
      .groupBy(reviews.professionalId)
    return new Map(rows.map((row) => [row.id, { rating: Math.round(Number(row.rating) * 10) / 10, reviews: row.reviews }]))
  } catch (error) {
    // Profiles stay visible without stars when the reviews cannot be read.
    logError("Failed to load ratings:", error)
    return new Map()
  }
}

// Not a server action: only server code that has just completed a booking may create an invite.
/** Called in the transaction that completes a booking; the token is the customer's personal review link. */
export async function createReviewInvite(
  booking: {
    id: number
    customerId: string | null
    professionalId: string
    professionalType: string
  },
  tx: Pick<typeof db, "insert">,
) {
  if (!booking.customerId) return
  await tx
    .insert(reviews)
    .values({
      bookingId: booking.id,
      customerId: booking.customerId,
      professionalId: booking.professionalId,
      professionalType: booking.professionalType,
      token: randomBytes(24).toString("base64url"),
    })
    .onConflictDoNothing()
}
