"use server"

import { and, desc, eq, isNotNull, isNull } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { db } from "@/lib/db"
import { storeNotice } from "@/lib/db/notify"
import { bookings, notifications, reviews } from "@/lib/db/schema"
import { logError, withoutValues } from "@/lib/log-error"
import { getSession } from "@/lib/session"

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
  if (typeof token !== "string" || !/^[\w-]{20,64}$/.test(token)) return null
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
  if (!parsed.success || typeof token !== "string") return { ok: false as const, error: "invalid" }
  try {
    const stored = await db.transaction(async (tx) => {
      const [review] = await tx
        .update(reviews)
        .set({ ...parsed.data, submittedAt: new Date() })
        .where(and(eq(reviews.token, token), isNull(reviews.submittedAt)))
        .returning({ professionalId: reviews.professionalId, bookingId: reviews.bookingId })
      if (!review) return false
      const [booking] = await tx.select({ eventName: bookings.eventName }).from(bookings).where(eq(bookings.id, review.bookingId)).limit(1)
      await storeNotice(tx, "Failed to notify the professional of a review:", (notice) =>
        notice.insert(notifications).values({
          professionalId: review.professionalId,
          bookingId: review.bookingId,
          type: "review",
          title: "Nieuwe review",
          body: `Je hebt een nieuwe review${booking ? ` voor ${booking.eventName}` : ""}. Bekijk hem bij Reviews.`,
        }),
      )
      return true
    })
    if (!stored) return { ok: false as const, error: "used" }
  } catch (error) {
    logError("Failed to store the review:", error)
    return { ok: false as const, error: "failed" }
  }
  revalidatePath("/account/reviews")
  revalidatePath("/dashboard", "layout")
  revalidatePath("/artiest/[slug]", "page")
  revalidatePath("/foto-video/[slug]", "page")
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
  if (!Number.isSafeInteger(id) || typeof reply !== "string") return { ok: false as const }
  const text = reply.trim()
  if (!text || text.length > 1000) return { ok: false as const }
  const professionalId = session.user.id
  const updated = await withoutValues("Failed to store the reply:", () =>
    db
      .update(reviews)
      .set({ reply: text, repliedAt: new Date() })
      // Only a submitted review can be answered; an open invite would otherwise show the reply to the customer first.
      .where(
        and(eq(reviews.id, id), eq(reviews.professionalId, professionalId), isNotNull(reviews.submittedAt), isNull(reviews.reply)),
      )
      .returning({ id: reviews.id }),
  )
  revalidatePath("/dashboard/reviews")
  return { ok: updated.length > 0 }
}
