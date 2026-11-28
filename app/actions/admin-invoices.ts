"use server"

import { and, asc, desc, eq, gte, ilike, inArray, lte, or, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import {
  adminAuditLog,
  billingProfiles,
  bookings,
  customerNotifications,
  invoices,
  notifications,
  type InvoiceLine,
  type InvoiceStatus,
  type PaymentStatus,
} from "@/lib/db/schema"
import { isBookingId } from "@/lib/bookings/booking-input"
import { requireAdmin } from "@/lib/session"
import { storeNotice } from "@/lib/db/notify"
import { logAdminAction } from "@/lib/moderation"

export interface AdminFinancialKpis {
  totalInvoicedCents: number
  totalReceivedCents: number
  openDepositsCents: number
  openBalancesCents: number
  totalCommissionCents: number
  totalRefundedCents: number
  invoicesCount: number
  pendingApprovalCount: number
}

/** Computes financial KPIs across all invoices and bookings for the Admin Dashboard. */
export async function getAdminFinancialKpis(): Promise<AdminFinancialKpis> {
  await requireAdmin()

  // Invoices summary
  const [invoiceAgg] = await db
    .select({
      totalInvoicedCents: sql<number>`coalesce(sum(${invoices.totalCents}), 0)`,
      count: sql<number>`count(${invoices.id})`,
      submittedCount: sql<number>`coalesce(sum(case when ${invoices.status} = 'submitted' then 1 else 0 end), 0)`,
    })
    .from(invoices)

  // Bookings cashflow summary
  const allBookings = await db
    .select({
      id: bookings.id,
      totalCents: bookings.totalCents,
      status: bookings.status,
      paymentStatus: bookings.paymentStatus,
      platformFeeCents: bookings.platformFeeCents,
    })
    .from(bookings)
    .where(inArray(bookings.status, ["accepted", "completed"]))

  let totalReceivedCents = 0
  let openDepositsCents = 0
  let openBalancesCents = 0
  let totalCommissionCents = 0
  let totalRefundedCents = 0

  for (const b of allBookings) {
    const total = b.totalCents || 0
    const deposit = Math.round(total * 0.25)
    const balance = total - deposit

    if (b.paymentStatus === "refunded") {
      totalRefundedCents += total
    } else if (b.paymentStatus === "paid") {
      totalReceivedCents += total
    } else if (b.paymentStatus === "deposit_paid") {
      totalReceivedCents += deposit
      openBalancesCents += balance
    } else if (b.paymentStatus === "unpaid") {
      openDepositsCents += deposit
    }

    if (b.platformFeeCents) {
      totalCommissionCents += b.platformFeeCents
    }
  }

  return {
    totalInvoicedCents: Number(invoiceAgg?.totalInvoicedCents ?? 0),
    totalReceivedCents,
    openDepositsCents,
    openBalancesCents,
    totalCommissionCents,
    totalRefundedCents,
    invoicesCount: Number(invoiceAgg?.count ?? 0),
    pendingApprovalCount: Number(invoiceAgg?.submittedCount ?? 0),
  }
}

export interface ListAdminInvoicesFilter {
  q?: string
  status?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  pageSize?: number
}

export interface AdminInvoiceListItem {
  id: number
  invoiceNumber: string
  invoiceDate: string
  bookingId: number
  eventName: string
  professionalId: string
  artistName: string
  customerName: string
  customerEmail: string | null
  netCents: number
  vatCents: number
  totalCents: number
  status: InvoiceStatus
  method: "self_billing" | "upload"
  paymentStatus: PaymentStatus
  hasFile: boolean
  filePathname: string | null
  fileName: string | null
  submittedAt: Date
}

/** Lists invoices with rich filtering and pagination for the Admin Invoice Table. */
export async function listAdminInvoices(filters: ListAdminInvoicesFilter = {}) {
  await requireAdmin()

  const page = Math.max(1, filters.page ?? 1)
  const pageSize = Math.min(100, Math.max(5, filters.pageSize ?? 20))
  const offset = (page - 1) * pageSize

  const conditions = []

  if (filters.status && filters.status !== "all") {
    conditions.push(eq(invoices.status, filters.status as InvoiceStatus))
  }

  if (filters.dateFrom) {
    conditions.push(gte(invoices.invoiceDate, filters.dateFrom))
  }
  if (filters.dateTo) {
    conditions.push(lte(invoices.invoiceDate, filters.dateTo))
  }

  if (filters.q && filters.q.trim()) {
    const query = `%${filters.q.trim()}%`
    conditions.push(
      or(
        ilike(invoices.invoiceNumber, query),
        ilike(bookings.eventName, query),
        ilike(bookings.firstName, query),
        ilike(bookings.lastName, query),
        ilike(bookings.professionalName, query),
        ilike(billingProfiles.businessName, query),
      ),
    )
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined

  // Total count
  const [{ count }] = await db
    .select({ count: sql<number>`count(${invoices.id})` })
    .from(invoices)
    .innerJoin(bookings, eq(bookings.id, invoices.bookingId))
    .leftJoin(billingProfiles, eq(billingProfiles.professionalId, invoices.professionalId))
    .where(whereClause)

  // Items
  const rows = await db
    .select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      invoiceDate: invoices.invoiceDate,
      bookingId: invoices.bookingId,
      eventName: bookings.eventName,
      professionalId: invoices.professionalId,
      artistName: sql<string>`coalesce(nullif(${billingProfiles.businessName}, ''), ${bookings.professionalName})`,
      customerFirstName: bookings.firstName,
      customerLastName: bookings.lastName,
      customerEmail: bookings.email,
      netCents: invoices.netCents,
      vatCents: invoices.vatCents,
      totalCents: invoices.totalCents,
      status: invoices.status,
      method: invoices.method,
      paymentStatus: bookings.paymentStatus,
      filePathname: invoices.filePathname,
      fileName: invoices.fileName,
      submittedAt: invoices.submittedAt,
    })
    .from(invoices)
    .innerJoin(bookings, eq(bookings.id, invoices.bookingId))
    .leftJoin(billingProfiles, eq(billingProfiles.professionalId, invoices.professionalId))
    .where(whereClause)
    .orderBy(desc(invoices.submittedAt))
    .limit(pageSize)
    .offset(offset)

  const items: AdminInvoiceListItem[] = rows.map((r) => ({
    id: r.id,
    invoiceNumber: r.invoiceNumber,
    invoiceDate: r.invoiceDate,
    bookingId: r.bookingId,
    eventName: r.eventName,
    professionalId: r.professionalId,
    artistName: r.artistName,
    customerName: `${r.customerFirstName} ${r.customerLastName}`.trim(),
    customerEmail: r.customerEmail,
    netCents: r.netCents,
    vatCents: r.vatCents,
    totalCents: r.totalCents,
    status: r.status,
    method: r.method,
    paymentStatus: r.paymentStatus,
    hasFile: Boolean(r.filePathname),
    filePathname: r.filePathname,
    fileName: r.fileName,
    submittedAt: r.submittedAt,
  }))

  return {
    items,
    totalCount: Number(count),
    page,
    pageSize,
    totalPages: Math.ceil(Number(count) / pageSize),
  }
}

/** Detailed view of a single invoice for the drawer/modal. */
export async function getAdminInvoiceDetail(invoiceId: number) {
  await requireAdmin()

  const [row] = await db
    .select({
      invoice: invoices,
      booking: bookings,
      profile: billingProfiles,
    })
    .from(invoices)
    .innerJoin(bookings, eq(bookings.id, invoices.bookingId))
    .leftJoin(billingProfiles, eq(billingProfiles.professionalId, invoices.professionalId))
    .where(eq(invoices.id, invoiceId))
    .limit(1)

  if (!row) return null

  const depositCents = Math.round((row.booking.totalCents || 0) * 0.25)
  const balanceCents = (row.booking.totalCents || 0) - depositCents

  return {
    ...row.invoice,
    booking: {
      ...row.booking,
      depositCents,
      balanceCents,
      customerFullName: `${row.booking.firstName} ${row.booking.lastName}`.trim(),
    },
    profile: row.profile,
  }
}

/** Updates invoice status (e.g. approve or reject an uploaded invoice). */
export async function setInvoiceStatus(input: {
  invoiceId: number
  status: "approved" | "rejected"
  note?: string
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = await requireAdmin()
  if (input.status !== "approved" && input.status !== "rejected") {
    return { ok: false, error: "Ongeldige status." }
  }

  try {
    const result = await db.transaction(async (tx): Promise<{ ok: true } | { ok: false; error: string }> => {
      const [existing] = await tx
        .select()
        .from(invoices)
        .where(eq(invoices.id, input.invoiceId))
        .limit(1)
        .for("update")

      if (!existing) return { ok: false, error: "Factuur niet gevonden." }

      const [booking] = await tx
        .select({
          payoutStatus: bookings.payoutStatus,
          professionalId: bookings.professionalId,
          eventName: bookings.eventName,
        })
        .from(bookings)
        .where(eq(bookings.id, existing.bookingId))
        .limit(1)

      if (booking?.payoutStatus === "paid" && input.status === "rejected") {
        return {
          ok: false,
          error: "Deze factuur kan niet worden afgewezen omdat de uitbetaling aan de artiest al is verwerkt.",
        }
      }

      await tx
        .update(invoices)
        .set({
          status: input.status,
          note: input.note?.trim() || null,
          updatedAt: new Date(),
        })
        .where(eq(invoices.id, input.invoiceId))

      if (input.status === "rejected" && booking) {
        await tx.insert(notifications).values({
          professionalId: booking.professionalId,
          bookingId: existing.bookingId,
          type: "reminder",
          title: "Factuur afgewezen",
          body: `Factuur ${existing.invoiceNumber || ""} voor ${booking.eventName} is afgewezen door beheer. ${input.note ? `Reden: ${input.note}` : ""}`.trim(),
        })
      }

      await logAdminAction(
        {
          adminId: admin.id,
          adminName: admin.name,
          action: "update_invoice_status",
          targetLabel: String(input.invoiceId),
          details: JSON.stringify({
            previousStatus: existing.status,
            newStatus: input.status,
            note: input.note,
          }),
        },
        tx,
      )

      return { ok: true }
    })

    if (!result.ok) return result
  } catch (err) {
    console.error("Failed to update invoice status:", err)
    return { ok: false, error: "Bijwerken van factuurstatus is mislukt." }
  }

  revalidatePath("/admin/facturen")
  revalidatePath("/admin/betalingen")
  return { ok: true }
}

/** Dispatches a payment reminder notification to the customer for deposit or balance. */
export async function sendPaymentReminder(input: {
  bookingId: number
  part: "deposit" | "balance"
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = await requireAdmin()
  if (!isBookingId(input.bookingId)) return { ok: false, error: "Ongeldig boekingsnummer." }

  const [booking] = await db.select().from(bookings).where(eq(bookings.id, input.bookingId)).limit(1)
  if (!booking) return { ok: false, error: "Boeking niet gevonden." }

  if (input.part === "deposit" && (booking.paymentStatus === "deposit_paid" || booking.paymentStatus === "paid")) {
    return { ok: false, error: "De aanbetaling voor deze boeking is reeds voldaan." }
  }
  if (input.part === "balance" && booking.paymentStatus === "paid") {
    return { ok: false, error: "Het restant voor deze boeking is reeds voldaan." }
  }

  if (booking.customerId) {
    try {
      await db.insert(customerNotifications).values({
        userId: booking.customerId,
        bookingId: booking.id,
        status: "invoice_ready",
      })
    } catch (err) {
      console.error("Failed to insert customer notice:", err)
    }
  }

  await logAdminAction({
    adminId: admin.id,
    adminName: admin.name,
    action: "send_payment_reminder",
    targetLabel: String(booking.id),
    details: JSON.stringify({ part: input.part }),
  })

  return { ok: true }
}
