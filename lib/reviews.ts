import "server-only"

import { randomBytes } from "node:crypto"
import { db } from "@/lib/db"
import { reviews } from "@/lib/db/schema"

// Not a server action: only server code that has just completed a booking may create an invite.
/** Called once a booking is completed; the token is the customer's personal review link. */
export async function createReviewInvite(booking: {
  id: number
  customerId: string | null
  professionalId: string
  professionalType: string
}) {
  if (!booking.customerId) return
  await db
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
