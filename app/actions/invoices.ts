"use server"

import { and, asc, eq, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { storeNotice } from "@/lib/db/notify"
import { logError, withoutValues } from "@/lib/log-error"
import {
  billingProfiles,
  bookings,
  customerNotifications,
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
import { isBookingId, optionalText } from "@/lib/bookings/booking-input"
import { isIsoDate, todayIso } from "@/lib/bookings/format"
import {
  buildInvoiceLines,
  sanitizeAdjustments,
  payoutFor,
  isVatExclusive,
  type InvoiceAdjustments,
  assertReceiptsOwned,
  INVOICE_FILE_TYPES,
  MAX_INVOICE_FILE_BYTES,
  invoiceBlobPrefix,
  hasPayoutDetails,
  isBillingProfileComplete,
  isValidIban,
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
  if (!isBookingId(bookingId)) return null
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
  // Two first visits at the same time: the second finds the row of the first.
  await db.insert(billingProfiles).values({ professionalId }).onConflictDoNothing()
  const [created] = await db.select().from(billingProfiles).where(eq(billingProfiles.professionalId, professionalId)).limit(1)
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

const orNull = (value: string) => optionalText(value, 200)

export interface BillingProfileErrors {
  businessName?: "REQUIRED"
  iban?: "REQUIRED" | "INVALID"
}

export type SaveBillingProfileResult = { ok: true; profile: BillingProfile } | { ok: false; errors: BillingProfileErrors }

/** Wrong fields are returned per field: server actions hide thrown messages in production. */
export async function saveBillingProfile(input: BillingProfileInput): Promise<SaveBillingProfileResult> {
  return withoutValues("Failed to save the billing profile:", () => runSaveBillingProfile(input))
}

async function runSaveBillingProfile(input: BillingProfileInput): Promise<SaveBillingProfileResult> {
  const professionalId = await getProfessionalId()
  const businessName = orNull(input.businessName)
  const iban = String(input.iban ?? "").replace(/\s+/g, "").toUpperCase()
  const errors: BillingProfileErrors = {}
  if (!businessName) errors.businessName = "REQUIRED"
  if (!iban) errors.iban = "REQUIRED"
  else if (!isValidIban(iban)) errors.iban = "INVALID"
  if (!businessName || errors.iban) return { ok: false, errors }
  const performanceVatRate = (PERFORMANCE_VAT_RATES as readonly number[]).includes(input.performanceVatRate) ? input.performanceVatRate : 9
  const nextInvoiceNumber = Number.isInteger(input.nextInvoiceNumber) && input.nextInvoiceNumber > 0 && input.nextInvoiceNumber < 1_000_000 ? input.nextInvoiceNumber : 1

  await getBillingProfile()
  const [profile] = await db
    .update(billingProfiles)
    .set({
      businessName,
      kvkNumber: orNull(input.kvkNumber),
      vatNumber: input.vatScheme === "kor" ? orNull(input.vatNumber) : (orNull(input.vatNumber)?.toUpperCase() ?? null),
      vatScheme: input.vatScheme === "kor" ? "kor" : "standard",
      performanceVatRate,
      iban,
      street: orNull(input.street),
      houseNumber: orNull(input.houseNumber),
      postalCode: orNull(input.postalCode)?.toUpperCase() ?? null,
      city: orNull(input.city),
      country: orNull(input.country) ?? "Nederland",
      invoicePrefix: optionalText(input.invoicePrefix, 20)?.toUpperCase() ?? "",
      nextInvoiceNumber,
      updatedAt: new Date(),
    })
    .where(eq(billingProfiles.professionalId, professionalId))
    .returning()
  revalidatePath("/dashboard", "layout")
  return { ok: true, profile }
}

export interface InvoiceContext {
  booking: Booking
  profile: BillingProfile
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
    invoice: invoice ?? null,
    lines,
    totals: sumInvoiceLines(lines),
    proposedNumber: proposeInvoiceNumber(profile),
    today: todayIso(),
  }
}

export async function getInvoiceForBooking(bookingId: number): Promise<Invoice | null> {
  const professionalId = await getProfessionalId()
  if (!isBookingId(bookingId)) return null
  const [invoice] = await db
    .select()
    .from(invoices)
    .where(and(eq(invoices.bookingId, bookingId), eq(invoices.professionalId, professionalId)))
    .limit(1)
  return invoice ?? null
}

export type InvoiceErrorCode =
  | "NOT_FOUND"
  | "INVOICE_LOCKED"
  | "PROFILE_INCOMPLETE"
  | "TOTAL_MISMATCH"
  | "INVALID_NUMBER"
  | "INVALID_DATE"
  | "DATE_IN_FUTURE"
  | "INVALID_FILE"
  | "FAILED"

export type SubmitInvoiceResult = { ok: true; invoice: Invoice } | { ok: false; error: InvoiceErrorCode }

class InvoiceError extends Error {
  constructor(readonly code: InvoiceErrorCode) {
    super(code)
  }
}

/** Refusals are returned: server actions hide thrown messages in production. */
async function invoiceResult(store: () => Promise<Invoice>): Promise<SubmitInvoiceResult> {
  try {
    return { ok: true, invoice: await store() }
  } catch (error) {
    if (error instanceof InvoiceError) return { ok: false, error: error.code }
    logError("Failed to store invoice:", error)
    return { ok: false, error: "FAILED" }
  }
}

function assertInvoiceFields(invoiceNumber: unknown, invoiceDate: unknown) {
  if (typeof invoiceNumber !== "string" || !invoiceNumber.trim() || invoiceNumber.length > 60) throw new InvoiceError("INVALID_NUMBER")
  if (!isIsoDate(invoiceDate)) throw new InvoiceError("INVALID_DATE")
  if (invoiceDate > todayIso()) throw new InvoiceError("DATE_IN_FUTURE")
}

interface InvoiceSubmission {
  professionalId: string
  bookingId: number
  invoiceNumber: string
  invoiceDate: string
  adjustments: InvoiceAdjustments | undefined
  /** The uploaded invoice; without it the invoice is made by ARSI Events (self-billing). */
  upload?: { file: UploadedInvoiceFile; declaredTotalCents: number }
}

/** Stores the invoice of a booking. One at a time per booking, and everything succeeds or nothing does. */
async function storeInvoice({ professionalId, bookingId, invoiceDate, upload, ...input }: InvoiceSubmission): Promise<Invoice> {
  const invoiceNumber = input.invoiceNumber.trim()
  const invoice = await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`invoice:${bookingId}`}))`)
    const [booking] = await tx
      .select()
      .from(bookings)
      .where(and(eq(bookings.id, bookingId), eq(bookings.professionalId, professionalId), eq(bookings.status, "completed")))
      .limit(1)
      .for("update")
    if (!booking) throw new InvoiceError("NOT_FOUND")
    if (booking.payoutStatus === "paid") throw new InvoiceError("INVOICE_LOCKED")
    const [existing] = await tx.select().from(invoices).where(eq(invoices.bookingId, bookingId)).orderBy(asc(invoices.id)).limit(1)
    // The client paid the amount on this invoice, or ARSI Events approved it: it may not change anymore.
    if (existing && (existing.status === "approved" || booking.paymentStatus === "paid")) throw new InvoiceError("INVOICE_LOCKED")

    // Locked as well, so two invoices at the same time do not use the same next number.
    const [profile] = await tx.select().from(billingProfiles).where(eq(billingProfiles.professionalId, professionalId)).limit(1).for("update")
    // An upload has the address on the invoice itself, but without an IBAN nobody can be paid.
    if (!profile || !(upload ? hasPayoutDetails(profile) : isBillingProfileComplete(profile))) throw new InvoiceError("PROFILE_INCOMPLETE")

    const adjustments = sanitizeAdjustments(input.adjustments, booking)
    assertReceiptsOwned(adjustments, invoiceBlobPrefix(professionalId, bookingId))
    const lines = buildInvoiceLines(booking, profile, adjustments)
    const totals = sumInvoiceLines(lines)
    if (upload && upload.declaredTotalCents !== totals.totalCents) throw new InvoiceError("TOTAL_MISMATCH")

    const values = {
      method: upload ? ("upload" as const) : ("self_billing" as const),
      invoiceNumber,
      invoiceDate,
      lines,
      netCents: totals.netCents,
      vatCents: totals.vatCents,
      totalCents: totals.totalCents,
      declaredTotalCents: upload?.declaredTotalCents ?? null,
      filePathname: upload?.file.pathname ?? null,
      fileName: upload?.file.name ?? null,
      fileSize: upload?.file.size ?? null,
      fileContentType: upload?.file.contentType ?? null,
      status: "submitted" as const,
    }
    // A second click sends exactly the same invoice: nothing to change and nothing to report.
    const isRepeat =
      existing?.status === "submitted" &&
      existing.method === values.method &&
      existing.invoiceNumber === invoiceNumber &&
      existing.invoiceDate === invoiceDate &&
      existing.totalCents === values.totalCents &&
      existing.filePathname === values.filePathname &&
      lineFingerprint(existing.lines) === lineFingerprint(lines)
    if (isRepeat) return existing

    const [stored] = existing
      ? await tx.update(invoices).set({ ...values, submittedAt: new Date(), updatedAt: new Date() }).where(eq(invoices.id, existing.id)).returning()
      : await tx.insert(invoices).values({ bookingId, professionalId, ...values }).returning()

    if (!upload) {
      await tx
        .update(billingProfiles)
        .set({
          nextInvoiceNumber: profile.nextInvoiceNumber + (invoiceNumber === proposeInvoiceNumber(profile) ? 1 : 0),
          selfBillingAcceptedAt: profile.selfBillingAcceptedAt ?? new Date(),
          updatedAt: new Date(),
        })
        .where(eq(billingProfiles.professionalId, professionalId))
    }

    const payout = payoutFor(totals, isVatExclusive(booking))
    await tx
      .update(bookings)
      .set({ platformFeeCents: payout.feeCents, payoutCents: payout.payoutCents, updatedAt: new Date() })
      .where(and(eq(bookings.id, bookingId), eq(bookings.professionalId, professionalId)))
    await tx.insert(notifications).values({
      professionalId,
      bookingId,
      type: "payout",
      title: "Factuur ontvangen",
      body: `Factuur ${invoiceNumber} voor ${booking.eventName} is ontvangen. Je uitbetaling van ${formatEuro(payout.payoutCents)} volgt. Je krijgt een melding zodra die is gedaan.`,
    })
    const { customerId } = booking
    if (customerId) {
      await storeNotice(tx, "Failed to notify the client of an invoice:", async (notice) => {
        // A corrected invoice renews the unread notice; its amount is read from the invoice when it is shown.
        const renewed = await notice
          .update(customerNotifications)
          .set({ createdAt: new Date() })
          .where(
            and(
              eq(customerNotifications.userId, customerId),
              eq(customerNotifications.bookingId, bookingId),
              eq(customerNotifications.status, "invoice_ready"),
              eq(customerNotifications.read, false),
            ),
          )
          .returning({ id: customerNotifications.id })
        if (renewed.length === 0) {
          await notice.insert(customerNotifications).values({ userId: customerId, bookingId, status: "invoice_ready" })
        }
      })
    }
    return stored
  })
  revalidateInvoicePaths(bookingId)
  revalidatePath("/account", "layout")
  return invoice
}

/** What makes the lines of two invoices the same. */
function lineFingerprint(lines: InvoiceLine[]) {
  return lines.map((line) => [line.key, line.description, line.quantity, line.vatRate, line.netCents, line.grossCents, line.receipt?.pathname ?? ""].join("|")).join("\n")
}

export async function submitSelfBillingInvoice(input: { bookingId: number; invoiceNumber: string; invoiceDate: string; adjustments?: InvoiceAdjustments }): Promise<SubmitInvoiceResult> {
  return invoiceResult(async () => {
    const professionalId = await getProfessionalId()
    if (!isBookingId(input.bookingId)) throw new InvoiceError("NOT_FOUND")
    assertInvoiceFields(input.invoiceNumber, input.invoiceDate)
    return storeInvoice({
      professionalId,
      bookingId: input.bookingId,
      invoiceNumber: input.invoiceNumber,
      invoiceDate: input.invoiceDate,
      adjustments: input.adjustments,
    })
  })
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
}): Promise<SubmitInvoiceResult> {
  return invoiceResult(async () => {
    const professionalId = await getProfessionalId()
    if (!isBookingId(input.bookingId)) throw new InvoiceError("NOT_FOUND")
    assertInvoiceFields(input.invoiceNumber, input.invoiceDate)
    const { pathname, name, size, contentType } = input.file ?? {}
    if (
      !isSafeBlobPath(pathname, invoiceBlobPrefix(professionalId, input.bookingId)) ||
      typeof name !== "string" ||
      !Number.isSafeInteger(size) ||
      size <= 0 ||
      size > MAX_INVOICE_FILE_BYTES ||
      !(INVOICE_FILE_TYPES as readonly string[]).includes(contentType)
    ) {
      throw new InvoiceError("INVALID_FILE")
    }
    // The invoice lines need the VAT settings, which an upload may submit before the profile was ever opened.
    await getBillingProfile()
    return storeInvoice({
      professionalId,
      bookingId: input.bookingId,
      invoiceNumber: input.invoiceNumber,
      invoiceDate: input.invoiceDate,
      adjustments: input.adjustments,
      upload: { file: { pathname, name: name.slice(0, 200), size, contentType }, declaredTotalCents: input.declaredTotalCents },
    })
  })
}
