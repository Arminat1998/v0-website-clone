"use server"

import { and, desc, eq, inArray } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { bookings, invoices, notifications } from "@/lib/db/schema"
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
  if (!Number.isSafeInteger(input.bookingId) || input.bookingId < 1) return { ok: false, error: "Boeking niet gevonden." }
  const row = (await listPayments()).find((r) => r.id === input.bookingId)
  if (!row) return { ok: false, error: "Boeking niet gevonden." }
  if (row.summary.due?.part !== input.part) return { ok: false, error: "Deze betaling staat niet open." }

  const balance = input.part === "balance"
  // Guard on the status we just read, so two admins cannot register the same transfer twice.
  const updated = await db
    .update(bookings)
    .set(balance ? { paymentStatus: "paid", paidAt: new Date() } : { paymentStatus: "deposit_paid" })
    .where(and(eq(bookings.id, row.id), eq(bookings.paymentStatus, row.paymentStatus)))
    .returning({ professionalId: bookings.professionalId })
  if (updated.length === 0) return { ok: false, error: "Deze betaling is al verwerkt." }

  const amount = formatEuro(row.summary.due.cents)
  await db.insert(notifications).values({
    professionalId: updated[0].professionalId,
    bookingId: row.id,
    type: "payment",
    title: balance ? "Factuur betaald" : "Aanbetaling ontvangen",
    body: balance
      ? `De klant heeft de factuur voor ${row.eventName} betaald.`
      : `De klant heeft de aanbetaling voor ${row.eventName} betaald. De boeking is definitief.`,
  })
  await logAdminAction({
    adminId: admin.id,
    adminName: admin.name,
    action: balance ? "payment_balance" : "payment_deposit",
    targetLabel: `Boeking #${row.id} · ${row.eventName}`,
    details: `${amount} ontvangen (${paymentReference(row.id, input.part)})`,
  })
  revalidatePath("/admin/betalingen")
  revalidatePath("/admin/activiteit")
  revalidatePath(`/account/boekingen/${row.id}`)
  revalidatePath("/dashboard")
  return { ok: true }
}
