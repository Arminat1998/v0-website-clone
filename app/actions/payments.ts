"use server"

import { and, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { bookings, customerNotifications, notifications } from "@/lib/db/schema"
import { getSession } from "@/lib/session"
import { depositCents } from "@/lib/bookings/payments"
import { isBookingId } from "@/lib/bookings/booking-input"

export interface CheckoutDetailsResult {
  ok: boolean
  error?: string
  booking?: {
    id: number
    eventName: string
    professionalName: string
    professionalType: string
    eventDate: string
    startTime: string
    endTime: string
    city: string
    totalCents: number
    depositCents: number
    balanceCents: number
    paymentStatus: string
    status: string
  }
}

export async function getCheckoutDetails(bookingId: number): Promise<CheckoutDetailsResult> {
  if (!isBookingId(bookingId)) return { ok: false, error: "Ongeldig boekingsnummer." }
  const session = await getSession()
  if (!session?.user) return { ok: false, error: "Log in om de betaling te bekijken." }

  const [booking] = await db
    .select({
      id: bookings.id,
      customerId: bookings.customerId,
      professionalId: bookings.professionalId,
      professionalName: bookings.professionalName,
      professionalType: bookings.professionalType,
      eventName: bookings.eventName,
      eventDate: bookings.eventDate,
      startTime: bookings.startTime,
      endTime: bookings.endTime,
      city: bookings.city,
      totalCents: bookings.totalCents,
      paymentStatus: bookings.paymentStatus,
      status: bookings.status,
    })
    .from(bookings)
    .where(eq(bookings.id, bookingId))
    .limit(1)

  if (!booking) return { ok: false, error: "Boeking niet gevonden." }
  if (session.user.role !== "admin" && booking.customerId && booking.customerId !== session.user.id) {
    return { ok: false, error: "Geen toegang tot deze boeking." }
  }

  const deposit = depositCents(booking.totalCents)
  const balance = Math.max(booking.totalCents - deposit, 0)

  return {
    ok: true,
    booking: {
      id: booking.id,
      eventName: booking.eventName,
      professionalName: booking.professionalName,
      professionalType: booking.professionalType,
      eventDate: booking.eventDate,
      startTime: booking.startTime,
      endTime: booking.endTime,
      city: booking.city,
      totalCents: booking.totalCents,
      depositCents: deposit,
      balanceCents: balance,
      paymentStatus: booking.paymentStatus,
      status: booking.status,
    },
  }
}

export interface ConfirmDepositResult {
  ok: boolean
  error?: string
  alreadyPaid?: boolean
  bookingId?: number
}

export async function confirmDeposit(bookingId: number, providerRef?: string): Promise<ConfirmDepositResult> {
  if (!isBookingId(bookingId)) return { ok: false, error: "Ongeldig boekingsnummer." }
  const session = await getSession()
  if (!session?.user) return { ok: false, error: "Niet ingelogd." }

  try {
    const result = await db.transaction(async (tx): Promise<ConfirmDepositResult> => {
      const [booking] = await tx
        .select()
        .from(bookings)
        .where(eq(bookings.id, bookingId))
        .limit(1)
        .for("update")

      if (!booking) return { ok: false, error: "Boeking niet gevonden." }
      if (session.user.role !== "admin" && booking.customerId && booking.customerId !== session.user.id) {
        return { ok: false, error: "Geen toegang tot deze boeking." }
      }
      if (booking.status !== "accepted") {
        return { ok: false, error: "Deze boeking is niet in afwachting van aanbetaling." }
      }

      // Idempotency: if deposit already paid or fully paid, return success without duplicate entries
      if (booking.paymentStatus === "deposit_paid" || booking.paymentStatus === "paid") {
        return { ok: true, alreadyPaid: true, bookingId }
      }

      const now = new Date()
      await tx
        .update(bookings)
        .set({
          paymentStatus: "deposit_paid",
          paidAt: now,
          updatedAt: now,
        })
        .where(eq(bookings.id, bookingId))

      // Notify professional
      await tx.insert(notifications).values({
        professionalId: booking.professionalId,
        bookingId: booking.id,
        type: "payment",
        title: "Aanbetaling ontvangen",
        body: `De klant heeft de aanbetaling voor ${booking.eventName} voldaan. De boeking is nu definitief bevestigd.`,
      })

      // Notify customer
      if (booking.customerId) {
        await tx.insert(customerNotifications).values({
          userId: booking.customerId,
          bookingId: booking.id,
          status: "deposit_received",
        })
      }

      return { ok: true, bookingId }
    })

    if (!result.ok) return result
  } catch (error) {
    console.error("Failed to confirm deposit:", error)
    return { ok: false, error: "Het verwerken van de aanbetaling is mislukt. Probeer het opnieuw." }
  }

  revalidatePath(`/account/boekingen/${bookingId}`)
  revalidatePath("/account/boekingen")
  revalidatePath(`/dashboard/bookings/${bookingId}`)
  revalidatePath("/dashboard/accepted-bookings")
  revalidatePath("/dashboard/booking-requests")
  revalidatePath("/dashboard", "layout")
  revalidatePath("/account", "layout")

  return { ok: true, bookingId }
}


export async function confirmBalance(bookingId: number, providerRef?: string): Promise<ConfirmDepositResult> {
  if (!isBookingId(bookingId)) return { ok: false, error: "Ongeldig boekingsnummer." }
  const session = await getSession()
  if (!session?.user) return { ok: false, error: "Niet ingelogd." }

  try {
    const result = await db.transaction(async (tx): Promise<ConfirmDepositResult> => {
      const [booking] = await tx
        .select()
        .from(bookings)
        .where(eq(bookings.id, bookingId))
        .limit(1)
        .for("update")

      if (!booking) return { ok: false, error: "Boeking niet gevonden." }
      if (session.user.role !== "admin" && booking.customerId && booking.customerId !== session.user.id) {
        return { ok: false, error: "Geen toegang tot deze boeking." }
      }

      // Idempotency: if already fully paid
      if (booking.paymentStatus === "paid") {
        return { ok: true, alreadyPaid: true, bookingId }
      }

      const now = new Date()
      await tx
        .update(bookings)
        .set({
          paymentStatus: "paid",
          paidAt: now,
          updatedAt: now,
        })
        .where(eq(bookings.id, bookingId))

      // Notify professional
      await tx.insert(notifications).values({
        professionalId: booking.professionalId,
        bookingId: booking.id,
        type: "payment",
        title: "Factuur betaald",
        body: `De klant heeft de volledige betaling voor ${booking.eventName} voldaan. De boeking is financieel afgerond.`,
      })

      // Notify customer
      if (booking.customerId) {
        await tx.insert(customerNotifications).values({
          userId: booking.customerId,
          bookingId: booking.id,
          status: "payment_received",
        })
      }

      return { ok: true, bookingId }
    })

    if (!result.ok) return result
  } catch (error) {
    console.error("Failed to confirm balance payment:", error)
    return { ok: false, error: "Het verwerken van de restantbetaling is mislukt. Probeer het opnieuw." }
  }

  revalidatePath(`/account/boekingen/${bookingId}`)
  revalidatePath("/account/boekingen")
  revalidatePath(`/dashboard/bookings/${bookingId}`)
  revalidatePath("/dashboard/completed-bookings")
  revalidatePath("/dashboard", "layout")
  revalidatePath("/account", "layout")
  revalidatePath("/admin/facturen")
  revalidatePath("/admin/betalingen")

  return { ok: true, bookingId }
}
