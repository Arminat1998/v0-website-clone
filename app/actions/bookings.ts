"use server"

import { and, asc, desc, eq, gte, inArray, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { bookings, customerNotifications, invoices, notifications, type Booking, type Invoice, type Notification } from "@/lib/db/schema"
import { calculatePricing, parseHourlyRateCents } from "@/lib/bookings/pricing"
import { abbreviateLastName, redactContactDetails } from "@/lib/bookings/privacy"
import { getProfessionalId } from "@/lib/bookings/professional"
import { getSession } from "@/lib/session"
import { resolveCustomerProfessional } from "@/lib/customer-catalog"
import { createReviewInvite } from "@/app/actions/reviews"
import { isDemoProfessional } from "@/lib/demo-professionals"

export type CustomerBooking = Pick<
  Booking,
  | "id"
  | "professionalId"
  | "professionalName"
  | "professionalType"
  | "status"
  | "eventName"
  | "eventDate"
  | "startTime"
  | "endTime"
  | "city"
  | "totalCents"
  | "createdAt"
>

export async function getMyBookings(): Promise<CustomerBooking[]> {
  const session = await getSession()
  if (!session?.user) throw new Error("Unauthorized")
  return db
    .select({
      id: bookings.id,
      professionalId: bookings.professionalId,
      professionalName: bookings.professionalName,
      professionalType: bookings.professionalType,
      status: bookings.status,
      eventName: bookings.eventName,
      eventDate: bookings.eventDate,
      startTime: bookings.startTime,
      endTime: bookings.endTime,
      city: bookings.city,
      totalCents: bookings.totalCents,
      createdAt: bookings.createdAt,
    })
    .from(bookings)
    .where(eq(bookings.customerId, session.user.id))
    .orderBy(desc(bookings.eventDate))
}

const DASHBOARD_PATHS = [
  "/dashboard",
  "/dashboard/booking-requests",
  "/dashboard/accepted-bookings",
  "/dashboard/completed-bookings",
  "/dashboard/calendar",
]

function revalidateDashboard(bookingId?: number) {
  revalidatePath("/account", "layout")
  for (const path of DASHBOARD_PATHS) revalidatePath(path)
  if (bookingId) revalidatePath(`/dashboard/bookings/${bookingId}`)
}

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

export interface CreateBookingInput {
  professionalId: string
  professionalName: string
  professionalType: "artist" | "photographer"
  professionalPrice: string
  eventName: string
  eventDate: string
  startTime: string
  endTime: string
  eventTypes: string[]
  musicGenres: string[]
  capacity: string
  description: string
  specialRequests: string
  dressCode: string
  playlistLink: string
  openingDanceLink: string
  openingDanceFileName: string
  lastSongLink: string
  lastSongFileName: string
  street: string
  houseNumber: string
  houseNumberExt: string
  postalCode: string
  city: string
  country: string
  distanceKm: number
  equipment: string[]
  firstName: string
  lastName: string
  email: string
  phone: string
  customerType: "private" | "business"
  companyName: string
  billingStreet: string
  billingHouseNumber: string
  billingPostalCode: string
  billingCity: string
  billingCountry: string
  vatNumber: string
  paymentMethod: "ideal" | "card" | "invoice"
}

const orNull = (value: string) => (value.trim() ? value.trim() : null)

export async function createBooking(input: CreateBookingInput) {
  const session = await getSession()
  if (!session?.user) throw new Error("Unauthorized")
  const customerId = session.user.id

  if (!input.professionalId || !input.eventDate || !input.startTime || !input.endTime) {
    throw new Error("Missing required booking fields")
  }
  if (!input.firstName.trim() || !input.lastName.trim() || !input.email.includes("@")) {
    throw new Error("Missing customer details")
  }

  if (!["artist", "photographer"].includes(input.professionalType) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(input.eventDate) || input.eventDate < todayIso() ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(input.startTime) ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(input.endTime) ||
      !Number.isFinite(input.distanceKm) || input.distanceKm < 0 || input.distanceKm > 2000 ||
      !Array.isArray(input.equipment) || input.equipment.length > 20) {
    throw new Error("Invalid booking details")
  }
  // Sample profiles have no account behind them, so a request would never reach anyone.
  if (isDemoProfessional(input.professionalId)) throw new Error("Professional unavailable")
  const professional = await resolveCustomerProfessional(input.professionalId, input.professionalType)
  if (!professional) throw new Error("Professional unavailable")
  if ((await getBlockedDates(input.professionalId)).includes(input.eventDate)) throw new Error("Date unavailable")

  const pricing = calculatePricing({
    hourlyRateCents: parseHourlyRateCents(professional.price),
    startTime: input.startTime,
    endTime: input.endTime,
    equipment: input.equipment,
    distanceKm: input.distanceKm,
  })

  const capacity = Number.parseInt(input.capacity, 10)

  const created = await db.transaction(async (tx) => {
    // Serialise requests from this customer for this professional and date, so a double click,
    // a retry after a network error or a second tab cannot create the same request twice.
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtext(${`booking:${customerId}:${input.professionalId}:${input.eventDate}`}))`,
    )
    const [existing] = await tx
      .select({ id: bookings.id })
      .from(bookings)
      .where(
        and(
          eq(bookings.customerId, customerId),
          eq(bookings.professionalId, input.professionalId),
          eq(bookings.eventDate, input.eventDate),
          eq(bookings.startTime, input.startTime),
          eq(bookings.status, "pending"),
          gte(bookings.createdAt, sql`now() - interval '10 minutes'`),
        ),
      )
      .limit(1)
    if (existing) return { id: existing.id, duplicate: true }

    const [inserted] = await tx
      .insert(bookings)
      .values({
        customerId,
        professionalId: input.professionalId,
        professionalName: professional.name,
        professionalType: input.professionalType,
        status: "pending",
        eventName: input.eventName.trim() || `${input.eventTypes[0] ?? "Evenement"} ${input.firstName.trim()}`,
        eventDate: input.eventDate,
        startTime: input.startTime,
        endTime: input.endTime,
        eventTypes: input.eventTypes,
        musicGenres: input.musicGenres,
        capacity: Number.isFinite(capacity) ? capacity : null,
        description: orNull(input.description),
        specialRequests: orNull(input.specialRequests),
        dressCode: orNull(input.dressCode),
        playlistLink: orNull(input.playlistLink),
        openingDanceLink: orNull(input.openingDanceLink),
        openingDanceFileName: orNull(input.openingDanceFileName),
        lastSongLink: orNull(input.lastSongLink),
        lastSongFileName: orNull(input.lastSongFileName),
        street: orNull(input.street),
        houseNumber: orNull(input.houseNumber),
        houseNumberExt: orNull(input.houseNumberExt),
        postalCode: orNull(input.postalCode),
        city: input.city.trim() || "Onbekend",
        country: orNull(input.country),
        distanceKm: Math.max(0, Math.round(input.distanceKm)),
        equipment: input.equipment,
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        email: input.email.trim(),
        phone: input.phone.trim(),
        customerType: input.customerType,
        companyName: orNull(input.companyName),
        billingStreet: orNull(input.billingStreet),
        billingHouseNumber: orNull(input.billingHouseNumber),
        billingPostalCode: orNull(input.billingPostalCode),
        billingCity: orNull(input.billingCity),
        billingCountry: orNull(input.billingCountry),
        vatNumber: orNull(input.vatNumber),
        paymentMethod: input.paymentMethod,
        hourlyRateCents: pricing.hourlyRateCents,
        hours: pricing.hours.toString(),
        equipmentCents: pricing.equipmentCents,
        travelCents: pricing.travelCents,
        totalCents: pricing.totalCents,
        platformFeeCents: pricing.platformFeeCents,
        payoutCents: pricing.payoutCents,
      })
      .returning({ id: bookings.id })

    await tx.insert(notifications).values({
      professionalId: input.professionalId,
      bookingId: inserted.id,
      type: "new_request",
      title: "Nieuwe boekingsaanvraag",
      body: `${input.firstName.trim()} ${abbreviateLastName(input.lastName)} wil je boeken voor ${input.eventName.trim() || "een evenement"} op ${formatDutchDate(input.eventDate)}.`,
    })
    return { id: inserted.id, duplicate: false }
  })

  if (!created.duplicate) revalidateDashboard(created.id)
  return { id: created.id }
}

function formatDutchDate(iso: string) {
  const [y, m, d] = iso.split("-")
  return `${d}-${m}-${y}`
}

export type InvoiceSummary = Pick<Invoice, "id" | "status" | "invoiceNumber" | "method">
export type BookingListItem = Booking & { invoice: InvoiceSummary | null }

export async function getBookingsByStatus(status: Booking["status"] | Booking["status"][]): Promise<BookingListItem[]> {
  const professionalId = await getProfessionalId()
  const statuses = Array.isArray(status) ? status : [status]
  const rows = await db
    .select({
      booking: bookings,
      invoice: { id: invoices.id, status: invoices.status, invoiceNumber: invoices.invoiceNumber, method: invoices.method },
    })
    .from(bookings)
    .leftJoin(invoices, eq(invoices.bookingId, bookings.id))
    .where(and(eq(bookings.professionalId, professionalId), inArray(bookings.status, statuses)))
    .orderBy(status === "completed" ? desc(bookings.eventDate) : asc(bookings.eventDate))
  return rows.map(({ booking, invoice }) => ({ ...redactContactDetails(booking), invoice: invoice?.id ? invoice : null }))
}

export async function getBooking(id: number) {
  const professionalId = await getProfessionalId()
  const [booking] = await db
    .select()
    .from(bookings)
    .where(and(eq(bookings.id, id), eq(bookings.professionalId, professionalId)))
    .limit(1)
  return booking ? redactContactDetails(booking) : null
}

export type AcceptBookingResult = { ok: true } | { ok: false; error: "NOT_FOUND" | "DATE_PASSED" | "DATE_TAKEN" }

export async function acceptBooking(id: number, message: string): Promise<AcceptBookingResult> {
  const professionalId = await getProfessionalId()
  const result = await db.transaction(async (tx): Promise<AcceptBookingResult> => {
    const [booking] = await tx
      .select({ eventDate: bookings.eventDate })
      .from(bookings)
      .where(and(eq(bookings.id, id), eq(bookings.professionalId, professionalId), eq(bookings.status, "pending")))
      .limit(1)
    if (!booking) return { ok: false, error: "NOT_FOUND" }
    if (booking.eventDate < todayIso()) return { ok: false, error: "DATE_PASSED" }

    // One accepted booking per professional per date, also when two requests are accepted at the same time.
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`accept:${professionalId}:${booking.eventDate}`}))`)
    const [taken] = await tx
      .select({ id: bookings.id })
      .from(bookings)
      .where(
        and(
          eq(bookings.professionalId, professionalId),
          eq(bookings.eventDate, booking.eventDate),
          inArray(bookings.status, ["accepted", "completed"]),
        ),
      )
      .limit(1)
    if (taken) return { ok: false, error: "DATE_TAKEN" }

    const updated = await tx
      .update(bookings)
      .set({
        status: "accepted",
        responseMessage: message.trim() || null,
        respondedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(bookings.id, id), eq(bookings.professionalId, professionalId), eq(bookings.status, "pending")))
      .returning({ id: bookings.id, customerId: bookings.customerId })
    if (!updated.length) return { ok: false, error: "NOT_FOUND" }
    const customerId = updated[0].customerId
    if (customerId) await tx.insert(customerNotifications).values({ userId: customerId, bookingId: id, status: "accepted" })

    await tx
      .update(notifications)
      .set({ read: true })
      .where(and(eq(notifications.bookingId, id), eq(notifications.professionalId, professionalId)))
    return { ok: true }
  })
  revalidateDashboard(id)
  return result
}

export async function rejectBooking(id: number, reason: string) {
  const professionalId = await getProfessionalId()
  await db.transaction(async (tx) => {
    const updated = await tx
      .update(bookings)
      .set({
        status: "rejected",
        rejectionReason: reason.trim() || null,
        respondedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(bookings.id, id), eq(bookings.professionalId, professionalId), eq(bookings.status, "pending")))
      .returning({ customerId: bookings.customerId })
    if (!updated.length) return
    const customerId = updated[0].customerId
    if (customerId) await tx.insert(customerNotifications).values({ userId: customerId, bookingId: id, status: "rejected" })
    await tx
      .update(notifications)
      .set({ read: true })
      .where(and(eq(notifications.bookingId, id), eq(notifications.professionalId, professionalId)))
  })
  revalidateDashboard(id)
}

export async function completeBooking(id: number) {
  const professionalId = await getProfessionalId()
  const booking = await getBooking(id)
  if (!booking || booking.status !== "accepted") return
  if (booking.eventDate > todayIso()) throw new Error("Event has not taken place yet")

  const updated = await db
    .update(bookings)
    .set({ status: "completed", completedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(bookings.id, id), eq(bookings.professionalId, professionalId), eq(bookings.status, "accepted")))
    .returning({ customerId: bookings.customerId })
  if (!updated.length) return
  const customerId = updated[0].customerId
  if (customerId) await db.insert(customerNotifications).values({ userId: customerId, bookingId: id, status: "completed" })

  await db.insert(notifications).values({
    professionalId,
    bookingId: id,
    type: "reminder",
    title: "Dien je factuur in",
    body: `${booking.eventName} is afgerond. Dien je factuur in om je uitbetaling in gang te zetten.`,
  })
  await createReviewInvite(booking)
  revalidateDashboard(id)
}

export interface DashboardSummary {
  pendingCount: number
  upcomingCount: number
  awaitingPayoutCents: number
  earnedThisYearCents: number
  invoicesDueCount: number
  invoicesDueCents: number
  nextBooking: Booking | null
  recentRequests: Booking[]
  notifications: Notification[]
  unreadCount: number
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const professionalId = await getProfessionalId()
  const today = todayIso()
  const yearStart = `${today.slice(0, 4)}-01-01`
  const hasNoInvoice = sql`not exists (select 1 from ${invoices} where ${invoices.bookingId} = ${bookings.id})`

  const [counts] = await db
    .select({
      pendingCount: sql<number>`count(*) filter (where ${bookings.status} = 'pending')`.mapWith(Number),
      upcomingCount: sql<number>`count(*) filter (where ${bookings.status} = 'accepted' and ${bookings.eventDate} >= ${today})`.mapWith(Number),
      awaitingPayoutCents: sql<number>`coalesce(sum(${bookings.payoutCents}) filter (where ${bookings.status} = 'completed' and ${bookings.payoutStatus} = 'pending'), 0)`.mapWith(Number),
      earnedThisYearCents: sql<number>`coalesce(sum(${bookings.payoutCents}) filter (where ${bookings.status} = 'completed' and ${bookings.eventDate} >= ${yearStart}), 0)`.mapWith(Number),
      invoicesDueCount: sql<number>`count(*) filter (where ${bookings.status} = 'completed' and ${hasNoInvoice})`.mapWith(Number),
      invoicesDueCents: sql<number>`coalesce(sum(${bookings.payoutCents}) filter (where ${bookings.status} = 'completed' and ${hasNoInvoice}), 0)`.mapWith(Number),
    })
    .from(bookings)
    .where(eq(bookings.professionalId, professionalId))

  const [nextBooking] = await db
    .select()
    .from(bookings)
    .where(and(eq(bookings.professionalId, professionalId), eq(bookings.status, "accepted"), gte(bookings.eventDate, today)))
    .orderBy(asc(bookings.eventDate))
    .limit(1)

  const recentRequests = await db
    .select()
    .from(bookings)
    .where(and(eq(bookings.professionalId, professionalId), eq(bookings.status, "pending")))
    .orderBy(desc(bookings.createdAt))
    .limit(3)

  const notificationRows = await db
    .select()
    .from(notifications)
    .where(eq(notifications.professionalId, professionalId))
    .orderBy(desc(notifications.createdAt))
    .limit(8)

  return {
    pendingCount: counts?.pendingCount ?? 0,
    upcomingCount: counts?.upcomingCount ?? 0,
    awaitingPayoutCents: counts?.awaitingPayoutCents ?? 0,
    earnedThisYearCents: counts?.earnedThisYearCents ?? 0,
    invoicesDueCount: counts?.invoicesDueCount ?? 0,
    invoicesDueCents: counts?.invoicesDueCents ?? 0,
    nextBooking: nextBooking ?? null,
    recentRequests: recentRequests.map(redactContactDetails),
    notifications: notificationRows,
    unreadCount: notificationRows.filter((n) => !n.read).length,
  }
}

export async function markAllNotificationsRead() {
  const professionalId = await getProfessionalId()
  await db
    .update(notifications)
    .set({ read: true })
    .where(and(eq(notifications.professionalId, professionalId), eq(notifications.read, false)))
  revalidatePath("/dashboard")
}

export interface CalendarBooking {
  id: number
  eventDate: string
  eventName: string
  startTime: string
  endTime: string
  city: string
  status: Booking["status"]
}

export async function getCalendarBookings(): Promise<CalendarBooking[]> {
  const professionalId = await getProfessionalId()
  return db
    .select({
      id: bookings.id,
      eventDate: bookings.eventDate,
      eventName: bookings.eventName,
      startTime: bookings.startTime,
      endTime: bookings.endTime,
      city: bookings.city,
      status: bookings.status,
    })
    .from(bookings)
    .where(and(eq(bookings.professionalId, professionalId), inArray(bookings.status, ["pending", "accepted", "completed"])))
    .orderBy(asc(bookings.eventDate))
}

/** Dates that are already taken for a professional; used by the public booking calendar. */
export async function getBlockedDates(professionalId: string): Promise<string[]> {
  const rows = await db
    .select({ eventDate: bookings.eventDate })
    .from(bookings)
    .where(and(eq(bookings.professionalId, professionalId), inArray(bookings.status, ["accepted", "completed"])))
  return rows.map((r) => r.eventDate)
}
