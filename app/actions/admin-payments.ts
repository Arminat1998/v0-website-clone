"use server"

import { and, asc, desc, eq, inArray } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { storeNotice } from "@/lib/db/notify"
import { billingProfiles, bookings, customerNotifications, invoices, notifications } from "@/lib/db/schema"
import { logError } from "@/lib/log-error"
import { isBookingId } from "@/lib/bookings/booking-input"
import { invoiceFileUrl, isValidIban } from "@/lib/bookings/invoicing"
import { requireAdmin } from "@/lib/session"
import { logAdminAction } from "@/lib/moderation"
import { formatEuro } from "@/lib/bookings/pricing"
import { paymentReference, paymentSummary } from "@/lib/bookings/payments"

type Result = { ok: true } | { ok: false; error: string }

/** Accepted and completed bookings with what the client has paid and still owes. */
export async function listPayments() {
  await requireAdmin()
  const rows = await db
    .select({
      id: bookings.id,
      eventName: bookings.eventName,
      eventDate: bookings.eventDate,
      customerName: bookings.firstName,
      customerLastName: bookings.lastName,
      professionalName: bookings.professionalName,
      status: bookings.status,
      totalCents: bookings.totalCents,
      paymentStatus: bookings.paymentStatus,
      paidAt: bookings.paidAt,
      invoiceNumber: invoices.invoiceNumber,
      invoiceTotalCents: invoices.totalCents,
    })
    .from(bookings)
    .leftJoin(invoices, eq(invoices.bookingId, bookings.id))
    .where(inArray(bookings.status, ["accepted", "completed"]))
    .orderBy(desc(bookings.eventDate))
  return rows.map(({ customerLastName, invoiceTotalCents, ...row }) => ({
    ...row,
    customerName: `${row.customerName} ${customerLastName}`.trim(),
    summary: paymentSummary(
      row,
      row.status === "completed" && invoiceTotalCents !== null ? { totalCents: invoiceTotalCents } : null,
    ),
  }))
}

export type AdminPaymentRow = Awaited<ReturnType<typeof listPayments>>[number]

/** Registers a bank transfer ARSI Events received from the client for this booking. */
export async function markPaymentReceived(input: { bookingId: number; part: "deposit" | "balance" }): Promise<Result> {
  const admin = await requireAdmin()
  if (!isBookingId(input?.bookingId)) return { ok: false, error: "Boeking niet gevonden." }
  try {
    const row = (await listPayments()).find((r) => r.id === input.bookingId)
    if (!row) return { ok: false, error: "Boeking niet gevonden." }
    const due = row.summary.due
    if (due?.part !== input.part) return { ok: false, error: "Deze betaling staat niet open." }

    const balance = due.part === "balance"
    // The payment, both notifications and the audit entry: everything is stored or nothing is.
    const stored = await db.transaction(async (tx) => {
      // Guard on the status we just read, so two admins cannot register the same transfer twice.
      const [updated] = await tx
        .update(bookings)
        .set(balance ? { paymentStatus: "paid", paidAt: new Date() } : { paymentStatus: "deposit_paid" })
        .where(and(eq(bookings.id, row.id), eq(bookings.paymentStatus, row.paymentStatus)))
        .returning({ professionalId: bookings.professionalId, customerId: bookings.customerId })
      if (!updated) return false

      await tx.insert(notifications).values({
        professionalId: updated.professionalId,
        bookingId: row.id,
        type: "payment",
        title: balance ? "Factuur betaald" : "Aanbetaling ontvangen",
        body: balance
          ? `De klant heeft de factuur voor ${row.eventName} betaald.`
          : `De klant heeft de aanbetaling voor ${row.eventName} betaald. De boeking is definitief.`,
      })
      const { customerId } = updated
      if (customerId) {
        await storeNotice(tx, "Failed to notify the client of a payment:", (notice) =>
          notice
            .insert(customerNotifications)
            .values({ userId: customerId, bookingId: row.id, status: balance ? "payment_received" : "deposit_received" }),
        )
      }
      await logAdminAction(
        {
          adminId: admin.id,
          adminName: admin.name,
          action: balance ? "payment_balance" : "payment_deposit",
          targetLabel: `Boeking #${row.id} · ${row.eventName}`,
          details: `${formatEuro(due.cents)} ontvangen (${paymentReference(row.id, due.part)})`,
        },
        tx,
      )
      return true
    })
    if (!stored) return { ok: false, error: "Deze betaling is al verwerkt." }
  } catch (error) {
    logError("Failed to register the payment:", error)
    return { ok: false, error: "Opslaan is mislukt. Probeer het opnieuw." }
  }
  revalidatePath("/admin/betalingen")
  revalidatePath("/admin/activiteit")
  revalidatePath("/account", "layout")
  revalidatePath("/dashboard", "layout")
  return { ok: true }
}

/** Completed bookings with an invoice: what goes to which professional, and what has been paid out. */
export async function listPayouts() {
  await requireAdmin()
  const rows = await db
    .select({
      id: bookings.id,
      eventName: bookings.eventName,
      eventDate: bookings.eventDate,
      professionalName: bookings.professionalName,
      paymentStatus: bookings.paymentStatus,
      payoutCents: bookings.payoutCents,
      payoutStatus: bookings.payoutStatus,
      paidOutAt: bookings.paidOutAt,
      invoiceNumber: invoices.invoiceNumber,
      invoiceMethod: invoices.method,
      filePathname: invoices.filePathname,
      lines: invoices.lines,
      accountName: billingProfiles.businessName,
      iban: billingProfiles.iban,
    })
    .from(bookings)
    .innerJoin(invoices, and(eq(invoices.bookingId, bookings.id), eq(invoices.professionalId, bookings.professionalId)))
    .leftJoin(billingProfiles, eq(billingProfiles.professionalId, bookings.professionalId))
    .where(eq(bookings.status, "completed"))
    .orderBy(asc(bookings.eventDate), asc(bookings.id), asc(invoices.id))
  // The oldest invoice of a booking is the one in use, like in storeInvoice.
  const unique = rows.filter((row, index) => rows.findIndex((other) => other.id === row.id) === index)
  return unique.map(({ filePathname, lines, iban, ...row }) => {
    const open = row.payoutStatus !== "paid"
    return {
      ...row,
      invoiceUrl: row.invoiceMethod === "upload" ? invoiceFileUrl({ filePathname }) : `/admin/betalingen/${row.id}/factuur`,
      receipts: lines.flatMap((line) =>
        line.receipt ? [{ label: line.description, url: invoiceFileUrl({ filePathname: line.receipt.pathname })! }] : [],
      ),
      // The account number is only needed for what still has to be paid out.
      iban: open ? iban?.trim() || null : null,
      ibanValid: open && isValidIban(iban ?? ""),
    }
  })
}

export type AdminPayoutRow = Awaited<ReturnType<typeof listPayouts>>[number]

/** The invoice ARSI Events made for a professional, to show to an admin. */
export async function getInvoiceForAdmin(bookingId: number) {
  await requireAdmin()
  if (!isBookingId(bookingId)) return null
  const [row] = await db
    .select({ booking: bookings, invoice: invoices, profile: billingProfiles })
    .from(invoices)
    .innerJoin(bookings, and(eq(bookings.id, invoices.bookingId), eq(bookings.professionalId, invoices.professionalId)))
    .innerJoin(billingProfiles, eq(billingProfiles.professionalId, invoices.professionalId))
    .where(eq(invoices.bookingId, bookingId))
    .orderBy(asc(invoices.id))
    .limit(1)
  return row ?? null
}

/** Registers a payout ARSI Events made by bank transfer. Nothing is transferred here. */
export async function markPayoutPaid(input: { bookingId: number; payoutCents: number }): Promise<Result> {
  const admin = await requireAdmin()
  if (!isBookingId(input?.bookingId) || !Number.isSafeInteger(input.payoutCents)) return { ok: false, error: "Boeking niet gevonden." }
  const { bookingId } = input
  try {
    const result = await db.transaction(async (tx): Promise<Result> => {
      const [booking] = await tx
        .select({
          professionalId: bookings.professionalId,
          eventName: bookings.eventName,
          payoutCents: bookings.payoutCents,
          payoutStatus: bookings.payoutStatus,
        })
        .from(bookings)
        .where(and(eq(bookings.id, bookingId), eq(bookings.status, "completed")))
        .limit(1)
        .for("update")
      if (!booking) return { ok: false, error: "Boeking niet gevonden." }
      if (booking.payoutStatus === "paid") return { ok: false, error: "Deze uitbetaling is al verwerkt." }
      const [invoice] = await tx
        .select({ invoiceNumber: invoices.invoiceNumber })
        .from(invoices)
        .where(and(eq(invoices.bookingId, bookingId), eq(invoices.professionalId, booking.professionalId)))
        .orderBy(asc(invoices.id))
        .limit(1)
      if (!invoice) return { ok: false, error: "Er is nog geen factuur voor deze boeking." }
      // The professional may have sent a new invoice after the admin opened the page.
      if (booking.payoutCents !== input.payoutCents) return { ok: false, error: "Het bedrag is gewijzigd. Controleer de factuur opnieuw." }
      const [profile] = await tx
        .select({ iban: billingProfiles.iban })
        .from(billingProfiles)
        .where(eq(billingProfiles.professionalId, booking.professionalId))
        .limit(1)
      if (!isValidIban(profile?.iban ?? "")) return { ok: false, error: "Het IBAN van deze professional ontbreekt of klopt niet." }

      const now = new Date()
      await tx.update(bookings).set({ payoutStatus: "paid", paidOutAt: now, updatedAt: now }).where(eq(bookings.id, bookingId))
      const amount = formatEuro(booking.payoutCents)
      await tx.insert(notifications).values({
        professionalId: booking.professionalId,
        bookingId,
        type: "payout",
        title: "Uitbetaald",
        body: `Je uitbetaling van ${amount} voor ${booking.eventName} (factuur ${invoice.invoiceNumber}) is overgemaakt.`,
      })
      await logAdminAction(
        {
          adminId: admin.id,
          adminName: admin.name,
          action: "payout_paid",
          targetUserId: booking.professionalId,
          targetLabel: `Boeking #${bookingId} · ${booking.eventName}`,
          details: `${amount} uitbetaald (factuur ${invoice.invoiceNumber})`,
        },
        tx,
      )
      return { ok: true }
    })
    if (!result.ok) return result
  } catch (error) {
    logError("Failed to register the payout:", error)
    return { ok: false, error: "Opslaan is mislukt. Probeer het opnieuw." }
  }
  revalidatePath("/admin/betalingen")
  revalidatePath("/admin/activiteit")
  revalidatePath("/dashboard", "layout")
  return { ok: true }
}
