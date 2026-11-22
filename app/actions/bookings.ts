"use server"

import { and, asc, desc, eq, gte, inArray, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { bookings, customerNotifications, invoices, notifications, type Booking, type Invoice, type Notification } from "@/lib/db/schema"
import { hoursBetween, hoursProblem, priceBooking, type BookingOptions } from "@/lib/bookings/pricing"
import { loadBookingOptions, loadProfessionalCity } from "@/lib/bookings/booking-options"
import { distanceBetween } from "@/lib/bookings/distance"
import { dateProblem, hasUnavailableDatesTable, loadUnavailableDates, lockDate } from "@/lib/bookings/availability"
import { BookingError, isBookingId, optionalText, parseBookingInput, type BookingErrorCode } from "@/lib/bookings/booking-input"
import { todayIso } from "@/lib/bookings/format"
import { isOwnAudioPath } from "@/lib/bookings/audio"
import { takeToken } from "@/lib/rate-limit"
import { abbreviateLastName, redactContactDetails } from "@/lib/bookings/privacy"
import { getProfessionalId } from "@/lib/bookings/professional"
import { getSession } from "@/lib/session"
import { resolveCustomerProfessional } from "@/lib/customer-catalog"
import { createReviewInvite } from "@/lib/reviews"
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
  /** Path of the uploaded audio file in the private store, or empty. */
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
  /** The place the distance was calculated to in step 1; the server calculates the distance again. */
  eventLocation: string
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

const orNull = (value: string) => value || null

/**
 * The distance the server charges for: calculated again from the professional's city to the event location.
 * When the geocoder is unavailable, the distance from the browser is used. Beyond the professional's travel
 * range the booking is refused.
 */
async function resolveDistance(professionalId: string, eventLocation: string, clientKm: number, options: BookingOptions) {
  const from = await loadProfessionalCity(professionalId)
  const place = eventLocation.slice(0, 120)
  const serverKm = from && place ? await distanceBetween(from, place) : null
  const km = serverKm ?? Math.round(clientKm)
  if (km > options.rangeKm) throw new BookingError("OUTSIDE_RANGE")
  return km
}

/** The bookable options of a professional for the booking page: rates, hours, range, package, extras and VAT. */
export async function getBookingOptions(professionalId: string): Promise<BookingOptions | null> {
  if (isDemoProfessional(professionalId) || typeof professionalId !== "string" || professionalId.length > 100) return null
  return loadBookingOptions(professionalId)
}

export type BookingDistanceResult =
  | { ok: true; distanceKm: number; rangeKm: number }
  | { ok: false; error: "UNAUTHORIZED" | "NOT_FOUND" | "OUT_OF_RANGE" | "TOO_MANY"; rangeKm?: number }

/** Distance from the professional's city to the event location, calculated on the server like at booking time. */
export async function calculateBookingDistance(professionalId: string, eventLocation: string): Promise<BookingDistanceResult> {
  const session = await getSession()
  if (!session?.user) return { ok: false, error: "UNAUTHORIZED" }
  if (!takeToken(`distance:${session.user.id}`, 20, 10 * 60 * 1000)) return { ok: false, error: "TOO_MANY" }
  const options = await getBookingOptions(professionalId)
  const from = options ? await loadProfessionalCity(professionalId) : null
  const place = String(eventLocation ?? "").trim().slice(0, 120)
  if (!options || !from || !place) return { ok: false, error: "NOT_FOUND" }
  const distanceKm = await distanceBetween(from, place)
  if (distanceKm === null) return { ok: false, error: "NOT_FOUND" }
  if (distanceKm > options.rangeKm) return { ok: false, error: "OUT_OF_RANGE", rangeKm: options.rangeKm }
  return { ok: true, distanceKm, rangeKm: options.rangeKm }
}

export type CreateBookingResult = { ok: true; id: number } | { ok: false; error: BookingErrorCode; field?: string }

/** Sends a booking request and tells why it was refused. Server actions hide thrown messages in production. */
export async function submitBooking(input: CreateBookingInput): Promise<CreateBookingResult> {
  try {
    return { ok: true, id: await placeBooking(input) }
  } catch (error) {
    if (error instanceof BookingError) return { ok: false, error: error.code, field: error.field }
    console.error("Failed to create booking:", error)
    return { ok: false, error: "FAILED" }
  }
}

/** The older contract of submitBooking: throws when the request is refused. */
export async function createBooking(input: CreateBookingInput) {
  return { id: await placeBooking(input) }
}

async function placeBooking(raw: CreateBookingInput): Promise<number> {
  const session = await getSession()
  if (!session?.user) throw new BookingError("UNAUTHORIZED")
  const customerId = session.user.id
  const input = parseBookingInput(raw)

  for (const field of ["openingDanceFileName", "lastSongFileName"] as const) {
    if (input[field] && !isOwnAudioPath(input[field], customerId)) throw new BookingError("INVALID", field)
  }
  // Sample profiles have no account behind them, so a request would never reach anyone.
  if (isDemoProfessional(input.professionalId) || input.professionalId === customerId) throw new BookingError("PROFESSIONAL_UNAVAILABLE")
  if (!takeToken(`booking:${customerId}`, 20, 10 * 60 * 1000)) throw new BookingError("TOO_MANY")
  const professional = await resolveCustomerProfessional(input.professionalId, input.professionalType)
  if (!professional) throw new BookingError("PROFESSIONAL_UNAVAILABLE")

  // The price comes from the professional's own profile, never from the browser.
  const options = await loadBookingOptions(input.professionalId)
  if (!options) throw new BookingError("PROFESSIONAL_UNAVAILABLE")
  if (input.startTime === input.endTime || hoursProblem(options, hoursBetween(input.startTime, input.endTime))) {
    throw new BookingError("INVALID_HOURS")
  }
  if (input.professionalType === "photographer" && input.equipment.includes("package")) throw new BookingError("INVALID", "equipment")
  const distanceKm = await resolveDistance(input.professionalId, input.eventLocation, input.distanceKm, options)
  const pricing = priceBooking(options, {
    startTime: input.startTime,
    endTime: input.endTime,
    equipment: input.equipment,
    distanceKm,
  })

  const hasTable = await hasUnavailableDatesTable()
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

    // Checked under the lock of this date, so a booking that is accepted or a date that is blocked at the
    // same moment cannot slip through.
    await lockDate(tx, input.professionalId, input.eventDate)
    if (await dateProblem(tx, input.professionalId, input.eventDate, hasTable)) throw new BookingError("DATE_UNAVAILABLE")

    const [inserted] = await tx
      .insert(bookings)
      .values({
        customerId,
        professionalId: input.professionalId,
        professionalName: professional.name,
        professionalType: input.professionalType,
        status: "pending",
        eventName: input.eventName || `${input.eventTypes[0] ?? "Evenement"} ${input.firstName}`,
        eventDate: input.eventDate,
        startTime: input.startTime,
        endTime: input.endTime,
        eventTypes: input.eventTypes,
        musicGenres: input.musicGenres,
        capacity: input.capacity,
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
        city: input.city || "Onbekend",
        country: orNull(input.country),
        distanceKm,
        equipment: pricing.equipmentLabels,
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        phone: input.phone,
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
      body: `${input.firstName} ${abbreviateLastName(input.lastName)} wil je boeken voor ${input.eventName || "een evenement"} op ${formatDutchDate(input.eventDate)}.`,
    })
    return { id: inserted.id, duplicate: false }
  })

  if (!created.duplicate) revalidateDashboard(created.id)
  return created.id
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
  if (!isBookingId(id)) return null
  const [booking] = await db
    .select()
    .from(bookings)
    .where(and(eq(bookings.id, id), eq(bookings.professionalId, professionalId)))
    .limit(1)
  return booking ? redactContactDetails(booking) : null
}

/** DATE_TAKEN with `blocked`: the professional blocked the date by hand instead of having a booking on it. */
export type AcceptBookingResult =
  | { ok: true }
  | { ok: false; error: "NOT_FOUND" | "DATE_PASSED" | "DATE_TAKEN"; blocked?: boolean }

export async function acceptBooking(id: number, message: string): Promise<AcceptBookingResult> {
  const professionalId = await getProfessionalId()
  if (!isBookingId(id)) return { ok: false, error: "NOT_FOUND" }
  const hasTable = await hasUnavailableDatesTable()
  const result = await db.transaction(async (tx): Promise<AcceptBookingResult> => {
    const [booking] = await tx
      .select({ eventDate: bookings.eventDate })
      .from(bookings)
      .where(and(eq(bookings.id, id), eq(bookings.professionalId, professionalId), eq(bookings.status, "pending")))
      .limit(1)
    if (!booking) return { ok: false, error: "NOT_FOUND" }
    if (booking.eventDate < todayIso()) return { ok: false, error: "DATE_PASSED" }

    // One accepted booking per professional per date, also when two requests are accepted at the same time.
    await lockDate(tx, professionalId, booking.eventDate)
    const problem = await dateProblem(tx, professionalId, booking.eventDate, hasTable)
    if (problem) return { ok: false, error: "DATE_TAKEN", blocked: problem === "blocked" }

    const updated = await tx
      .update(bookings)
      .set({
        status: "accepted",
        responseMessage: optionalText(message, 2000),
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

export type RespondResult = { ok: true } | { ok: false; error: "NOT_FOUND" }

export async function rejectBooking(id: number, reason: string): Promise<RespondResult> {
  const professionalId = await getProfessionalId()
  if (!isBookingId(id)) return { ok: false, error: "NOT_FOUND" }
  const rejected = await db.transaction(async (tx) => {
    const updated = await tx
      .update(bookings)
      .set({
        status: "rejected",
        rejectionReason: optionalText(reason, 2000),
        respondedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(bookings.id, id), eq(bookings.professionalId, professionalId), eq(bookings.status, "pending")))
      .returning({ customerId: bookings.customerId })
    if (!updated.length) return false
    const customerId = updated[0].customerId
    if (customerId) await tx.insert(customerNotifications).values({ userId: customerId, bookingId: id, status: "rejected" })
    await tx
      .update(notifications)
      .set({ read: true })
      .where(and(eq(notifications.bookingId, id), eq(notifications.professionalId, professionalId)))
    return true
  })
  revalidateDashboard(id)
  return rejected ? { ok: true } : { ok: false, error: "NOT_FOUND" }
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

/** Dates that cannot be booked, from today on: accepted bookings and dates blocked by hand. Public. */
export async function getBlockedDates(professionalId: string): Promise<string[]> {
  if (typeof professionalId !== "string" || !professionalId || professionalId.length > 100) return []
  return (await loadUnavailableDates([professionalId])).get(professionalId) ?? []
}
