"use server"

import { randomBytes } from "node:crypto"
import { and, desc, eq, isNotNull, isNull } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { db } from "@/lib/db"
import { bookings, reviews } from "@/lib/db/schema"
import { getSession } from "@/lib/session"

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

const inviteFields = {
  token: reviews.token,
  rating: reviews.rating,
  comment: reviews.comment,
  reply: reviews.reply,
  submittedAt: reviews.submittedAt,
  bookingId: bookings.id,
  eventName: bookings.eventName,
  eventDate: bookings.eventDate,
  professionalName: bookings.professionalName,
  professionalType: bookings.professionalType,
}

export async function getReviewInvite(token: string) {
  if (!/^[\w-]{20,64}$/.test(token)) return null
  const [row] = await db
    .select(inviteFields)
    .from(reviews)
    .innerJoin(bookings, eq(bookings.id, reviews.bookingId))
    .where(eq(reviews.token, token))
    .limit(1)
  return row ? { ...row, submittedAt: row.submittedAt?.toISOString() ?? null } : null
}

export type ReviewInvite = NonNullable<Awaited<ReturnType<typeof getReviewInvite>>>

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(10).max(2000),
})

export async function submitReview(token: string, input: { rating: number; comment: string }) {
  const parsed = reviewSchema.safeParse(input)
  if (!parsed.success) return { ok: false as const, error: "invalid" }
  const updated = await db
    .update(reviews)
    .set({ ...parsed.data, submittedAt: new Date() })
    .where(and(eq(reviews.token, token), isNull(reviews.submittedAt)))
    .returning({ id: reviews.id })
  if (!updated.length) return { ok: false as const, error: "used" }
  revalidatePath("/account/reviews")
  revalidatePath("/dashboard/reviews")
  return { ok: true as const }
}

export async function getMyReviews() {
  const session = await getSession()
  if (session?.user?.role !== "user") throw new Error("Unauthorized")
  const rows = await db
    .select(inviteFields)
    .from(reviews)
    .innerJoin(bookings, eq(bookings.id, reviews.bookingId))
    .where(eq(reviews.customerId, session.user.id))
    .orderBy(desc(reviews.createdAt))
  return rows.map((r) => ({ ...r, submittedAt: r.submittedAt?.toISOString() ?? null }))
}

export async function getProfessionalReviews() {
  const session = await getSession()
  if (session?.user?.role !== "professional") throw new Error("Unauthorized")
  const rows = await db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      comment: reviews.comment,
      reply: reviews.reply,
      submittedAt: reviews.submittedAt,
      customerName: bookings.firstName,
      eventName: bookings.eventName,
      eventDate: bookings.eventDate,
    })
    .from(reviews)
    .innerJoin(bookings, eq(bookings.id, reviews.bookingId))
    .where(and(eq(reviews.professionalId, session.user.id), isNotNull(reviews.submittedAt)))
    .orderBy(desc(reviews.submittedAt))
  return rows.map((r) => ({ ...r, submittedAt: r.submittedAt!.toISOString() }))
}

export type ProfessionalReview = Awaited<ReturnType<typeof getProfessionalReviews>>[number]

export async function replyToReview(id: number, reply: string) {
  const session = await getSession()
  if (session?.user?.role !== "professional") throw new Error("Unauthorized")
  const text = reply.trim()
  if (!text || text.length > 1000) return { ok: false as const }
  const updated = await db
    .update(reviews)
    .set({ reply: text, repliedAt: new Date() })
    .where(and(eq(reviews.id, id), eq(reviews.professionalId, session.user.id), isNull(reviews.reply)))
    .returning({ id: reviews.id })
  revalidatePath("/dashboard/reviews")
  return { ok: updated.length > 0 }
}
