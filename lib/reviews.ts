import "server-only"

import { randomBytes } from "node:crypto"
import type { db } from "@/lib/db"
import { reviews } from "@/lib/db/schema"

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
