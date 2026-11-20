"use server"

import { and, eq, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import {
  billingProfiles,
  bookings,
  invoices,
  notifications,
  type BillingProfile,
  type Booking,
  type Invoice,
  type InvoiceLine,
  type VatScheme,
} from "@/lib/db/schema"
import { formatEuro } from "@/lib/bookings/pricing"
import { redactContactDetails } from "@/lib/bookings/privacy"
import { getProfessionalId } from "@/lib/bookings/professional"
import { todayIso } from "@/lib/bookings/format"
import {
  buildInvoiceLines,
  sanitizeAdjustments,
  payoutFor,
  type InvoiceAdjustments,
  assertReceiptsOwned,
  invoiceBlobPrefix,
  isBillingProfileComplete,
  PERFORMANCE_VAT_RATES,
  proposeInvoiceNumber,
  sumInvoiceLines,
  type InvoiceTotals,
} from "@/lib/bookings/invoicing"
import { isSafeBlobPath } from "@/lib/blob-paths"

function revalidateInvoicePaths(bookingId: number) {
  revalidatePath("/dashboard")
  revalidatePath("/dashboard/completed-bookings")
  revalidatePath(`/dashboard/bookings/${bookingId}`)
  revalidatePath(`/dashboard/bookings/${bookingId}/invoice`)
}

async function getOwnedCompletedBooking(bookingId: number, professionalId: string) {
  const [booking] = await db
    .select()
    .from(bookings)
    .where(and(eq(bookings.id, bookingId), eq(bookings.professionalId, professionalId)))
    .limit(1)
  if (!booking) return null
  return booking.status === "completed" ? booking : null
}

export async function getBillingProfile(): Promise<BillingProfile> {
  const professionalId = await getProfessionalId()
  const [existing] = await db.select().from(billingProfiles).where(eq(billingProfiles.professionalId, professionalId)).limit(1)
  if (existing) return existing
  const [created] = await db.insert(billingProfiles).values({ professionalId }).returning()
  return created
}

export interface BillingProfileInput {
  businessName: string
  kvkNumber: string
  vatNumber: string
  vatScheme: VatScheme
  performanceVatRate: number
  iban: string
  street: string
  houseNumber: string
  postalCode: string
  city: string
  country: string
  invoicePrefix: string
  nextInvoiceNumber: number
}

const orNull = (value: string) => (value.trim() ? value.trim() : null)

export async function saveBillingProfile(input: BillingProfileInput) {
  const professionalId = await getProfessionalId()
  if (!input.businessName.trim()) throw new Error("Business name is required")
  const iban = input.iban.replace(/\s+/g, "").toUpperCase()
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(iban)) throw new Error("Invalid IBAN")
  const performanceVatRate = (PERFORMANCE_VAT_RATES as readonly number[]).includes(input.performanceVatRate) ? input.performanceVatRate : 9
  const nextInvoiceNumber = Number.isInteger(input.nextInvoiceNumber) && input.nextInvoiceNumber > 0 ? input.nextInvoiceNumber : 1

  await getBillingProfile()
  const [profile] = await db
    .update(billingProfiles)
    .set({
      businessName: input.businessName.trim(),
      kvkNumber: orNull(input.kvkNumber),
      vatNumber: input.vatScheme === "kor" ? orNull(input.vatNumber) : orNull(input.vatNumber.toUpperCase()),
      vatScheme: input.vatScheme === "kor" ? "kor" : "standard",
      performanceVatRate,
      iban,
      street: orNull(input.street),
      houseNumber: orNull(input.houseNumber),
      postalCode: orNull(input.postalCode.toUpperCase()),
      city: orNull(input.city),
      country: input.country.trim() || "Nederland",
      invoicePrefix: input.invoicePrefix.trim().toUpperCase(),
      nextInvoiceNumber,
      updatedAt: new Date(),
    })
    .where(eq(billingProfiles.professionalId, professionalId))
    .returning()
  revalidatePath("/dashboard", "layout")
  return profile
}

export interface InvoiceContext {
  booking: Booking
  profile: BillingProfile
  profileComplete: boolean
  invoice: Invoice | null
  lines: InvoiceLine[]
  totals: InvoiceTotals
  proposedNumber: string
  today: string
}

export async function getInvoiceContext(bookingId: number): Promise<InvoiceContext | null> {
  const professionalId = await getProfessionalId()
  const booking = await getOwnedCompletedBooking(bookingId, professionalId)
  if (!booking) return null
  const profile = await getBillingProfile()
  const [invoice] = await db.select().from(invoices).where(eq(invoices.bookingId, bookingId)).limit(1)
  const lines = buildInvoiceLines(booking, profile)
  return {
    booking: redactContactDetails(booking),
    profile,
    profileComplete: isBillingProfileComplete(profile),
    invoice: invoice ?? null,
    lines,
    totals: sumInvoiceLines(lines),
    proposedNumber: proposeInvoiceNumber(profile),
    today: todayIso(),
  }
}

export async function getInvoiceForBooking(bookingId: number): Promise<Invoice | null> {
  const professionalId = await getProfessionalId()
  const [invoice] = await db
    .select()
    .from(invoices)
    .where(and(eq(invoices.bookingId, bookingId), eq(invoices.professionalId, professionalId)))
    .limit(1)
  return invoice ?? null
}

function assertInvoiceFields(invoiceNumber: string, invoiceDate: string) {
  if (!invoiceNumber.trim()) throw new Error("Invoice number is required")
  if (!/^\d{4}-\d{2}-\d{2}$/.test(invoiceDate)) throw new Error("Invalid invoice date")
  if (invoiceDate > todayIso()) throw new Error("Invoice date cannot be in the future")
}

async function notifyInvoiceReceived(professionalId: string, booking: Booking, invoiceNumber: string) {
  await db.insert(notifications).values({
    professionalId,
    bookingId: booking.id,
    type: "payout",
    title: "Factuur ontvangen",
    body: `Factuur ${invoiceNumber} voor ${booking.eventName} is ontvangen. Je uitbetaling van ${formatEuro(booking.payoutCents)} volgt binnen 7 dagen.`,
  })
}

export async function submitSelfBillingInvoice(input: { bookingId: number; invoiceNumber: string; invoiceDate: string; adjustments?: InvoiceAdjustments }) {
  const professionalId = await getProfessionalId()
  const booking = await getOwnedCompletedBooking(input.bookingId, professionalId)
  if (!booking) throw new Error("Booking not found or not completed")
  const profile = await getBillingProfile()
  if (!isBillingProfileComplete(profile)) throw new Error("Billing profile incomplete")
  assertInvoiceFields(input.invoiceNumber, input.invoiceDate)

  if (booking.payoutStatus === "paid") throw new Error("Payout already completed")
  const adjustments = sanitizeAdjustments(input.adjustments, booking)
  assertReceiptsOwned(adjustments, invoiceBlobPrefix(professionalId, booking.id))
  const lines = buildInvoiceLines(booking, profile, adjustments)
  const totals = sumInvoiceLines(lines)
  const invoiceNumber = input.invoiceNumber.trim()

  const [invoice] = await db
    .insert(invoices)
    .values({
      bookingId: booking.id,
      professionalId,
      method: "self_billing",
      invoiceNumber,
      invoiceDate: input.invoiceDate,
      lines,
      netCents: totals.netCents,
      vatCents: totals.vatCents,
      totalCents: totals.totalCents,
      status: "submitted",
    })
    .onConflictDoUpdate({
      target: invoices.bookingId,
      set: {
        method: "self_billing",
        invoiceNumber,
        invoiceDate: input.invoiceDate,
        lines,
        netCents: totals.netCents,
        vatCents: totals.vatCents,
        totalCents: totals.totalCents,
        declaredTotalCents: null,
        filePathname: null,
        fileName: null,
        fileSize: null,
        fileContentType: null,
        status: "submitted",
        submittedAt: new Date(),
        updatedAt: new Date(),
      },
    })
    .returning()

  await db
    .update(billingProfiles)
    .set({
      nextInvoiceNumber: invoiceNumber === proposeInvoiceNumber(profile) ? sql`${billingProfiles.nextInvoiceNumber} + 1` : billingProfiles.nextInvoiceNumber,
      selfBillingAcceptedAt: profile.selfBillingAcceptedAt ?? new Date(),
      updatedAt: new Date(),
    })
    .where(eq(billingProfiles.professionalId, professionalId))

  const payout = payoutFor(totals.totalCents)
  await db.update(bookings).set({ platformFeeCents: payout.feeCents, payoutCents: payout.payoutCents, updatedAt: new Date() })
    .where(and(eq(bookings.id, booking.id), eq(bookings.professionalId, professionalId)))
  await notifyInvoiceReceived(professionalId, { ...booking, payoutCents: payout.payoutCents }, invoiceNumber)
  revalidateInvoicePaths(booking.id)
  return invoice
}

export interface UploadedInvoiceFile {
  pathname: string
  name: string
  size: number
  contentType: string
}

export async function submitUploadedInvoice(input: {
  bookingId: number
  invoiceNumber: string
  invoiceDate: string
  declaredTotalCents: number
  adjustments?: InvoiceAdjustments
  file: UploadedInvoiceFile
}) {
  const professionalId = await getProfessionalId()
  const booking = await getOwnedCompletedBooking(input.bookingId, professionalId)
  if (!booking) throw new Error("Booking not found or not completed")
  const profile = await getBillingProfile()
  assertInvoiceFields(input.invoiceNumber, input.invoiceDate)
  if (!isSafeBlobPath(input.file.pathname, invoiceBlobPrefix(professionalId, booking.id))) throw new Error("Invalid file")

  if (booking.payoutStatus === "paid") throw new Error("Payout already completed")
  const adjustments = sanitizeAdjustments(input.adjustments, booking)
  assertReceiptsOwned(adjustments, invoiceBlobPrefix(professionalId, booking.id))
  const lines = buildInvoiceLines(booking, profile, adjustments)
  const totals = sumInvoiceLines(lines)
  if (input.declaredTotalCents !== totals.totalCents) throw new Error("TOTAL_MISMATCH")
  const invoiceNumber = input.invoiceNumber.trim()

  const [invoice] = await db
    .insert(invoices)
    .values({
      bookingId: booking.id,
      professionalId,
      method: "upload",
      invoiceNumber,
      invoiceDate: input.invoiceDate,
      lines,
      netCents: totals.netCents,
      vatCents: totals.vatCents,
      totalCents: totals.totalCents,
      declaredTotalCents: input.declaredTotalCents,
      filePathname: input.file.pathname,
      fileName: input.file.name,
      fileSize: input.file.size,
      fileContentType: input.file.contentType,
      status: "submitted",
    })
    .onConflictDoUpdate({
      target: invoices.bookingId,
      set: {
        method: "upload",
        invoiceNumber,
        invoiceDate: input.invoiceDate,
        lines,
        netCents: totals.netCents,
        vatCents: totals.vatCents,
        totalCents: totals.totalCents,
        declaredTotalCents: input.declaredTotalCents,
        filePathname: input.file.pathname,
        fileName: input.file.name,
        fileSize: input.file.size,
        fileContentType: input.file.contentType,
        status: "submitted",
        submittedAt: new Date(),
        updatedAt: new Date(),
      },
    })
    .returning()

  const payout = payoutFor(totals.totalCents)
  await db.update(bookings).set({ platformFeeCents: payout.feeCents, payoutCents: payout.payoutCents, updatedAt: new Date() })
    .where(and(eq(bookings.id, booking.id), eq(bookings.professionalId, professionalId)))
  await notifyInvoiceReceived(professionalId, { ...booking, payoutCents: payout.payoutCents }, invoiceNumber)
  revalidateInvoicePaths(booking.id)
  return invoice
}
