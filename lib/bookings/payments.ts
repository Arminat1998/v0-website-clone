import type { Booking, InvoiceLine } from "@/lib/db/schema"

/** Share of the quoted total the client pays up front to make the booking final. */
export const DEPOSIT_RATE = 0.25
export const DEPOSIT_PERCENT = Math.round(DEPOSIT_RATE * 100)

export function depositCents(totalCents: number) {
  return Math.round(totalCents * DEPOSIT_RATE)
}

/** Reference the client puts on the bank transfer, so a payment can be matched to its booking. */
export function paymentReference(bookingId: number, part: "deposit" | "balance") {
  return `ARSI-${bookingId}-${part === "deposit" ? "A" : "R"}`
}

export const PAYMENT_STEPS = ["request", "quote", "deposit", "invoice", "done"] as const
export type PaymentStep = (typeof PAYMENT_STEPS)[number]

/** What the client sees of the professional's invoice: no receipts, no file. */
export interface CustomerInvoice {
  invoiceNumber: string
  invoiceDate: string
  totalCents: number
  lines: Pick<InvoiceLine, "key" | "description" | "quantity" | "unitLabel" | "grossCents">[]
}

export interface PaymentSummary {
  /** False for rejected and cancelled bookings: there is nothing to pay. */
  active: boolean
  current: PaymentStep
  quoteCents: number
  depositCents: number
  /** Invoice total once the professional has invoiced, otherwise the quoted total. */
  finalCents: number
  /** Costs added on the invoice on top of the quote, e.g. an extra hour or parking. */
  addedCents: number
  balanceCents: number
  depositPaid: boolean
  paid: boolean
  due: { part: "deposit" | "balance"; cents: number } | null
}

/**
 * The deposit is fixed on the quoted total, so costs added afterwards only change the balance.
 */
export function paymentSummary(
  booking: Pick<Booking, "status" | "totalCents" | "paymentStatus">,
  invoice: Pick<CustomerInvoice, "totalCents"> | null,
): PaymentSummary {
  const active = booking.status !== "rejected" && booking.status !== "cancelled"
  const paid = booking.paymentStatus === "paid"
  const depositPaid = paid || booking.paymentStatus === "deposit_paid"
  const deposit = depositCents(booking.totalCents)
  const finalCents = invoice?.totalCents ?? booking.totalCents
  const balanceCents = Math.max(finalCents - deposit, 0)
  const invoiced = booking.status === "completed" && invoice !== null

  let current: PaymentStep = "request"
  let due: PaymentSummary["due"] = null
  if (paid) current = "done"
  else if (!active) current = "request"
  else if (booking.status === "pending") current = "quote"
  else if (invoiced) {
    current = "invoice"
    due = { part: "balance", cents: depositPaid ? balanceCents : finalCents }
  } else if (!depositPaid) {
    current = "deposit"
    due = { part: "deposit", cents: deposit }
  } else current = "invoice"

  return {
    active,
    current,
    quoteCents: booking.totalCents,
    depositCents: deposit,
    finalCents,
    addedCents: finalCents - booking.totalCents,
    balanceCents,
    depositPaid,
    paid,
    due,
  }
}

/** Bank details ARSI Events receives client payments on; unset until the account is configured. */
export interface BankDetails {
  iban: string
  accountName: string
}

export function bankDetails(): BankDetails | null {
  const iban = process.env.ARSI_IBAN?.trim()
  if (!iban) return null
  return { iban, accountName: process.env.ARSI_ACCOUNT_NAME?.trim() || "ARSI Events" }
}
