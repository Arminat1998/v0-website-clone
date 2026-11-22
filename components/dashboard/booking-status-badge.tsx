"use client"

import { useBookingT } from "@/lib/booking-i18n"
import type { BookingStatus, InvoiceStatus, PaymentStatus, PayoutStatus } from "@/lib/db/schema"
import { cn } from "@/lib/utils"

const statusStyles: Record<BookingStatus, string> = {
  pending: "bg-amber-500/10 text-amber-800 dark:text-amber-500",
  accepted: "bg-green-500/10 text-green-700 dark:text-green-500",
  rejected: "bg-muted text-muted-foreground",
  completed: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  cancelled: "bg-muted text-muted-foreground",
}

export function BookingStatusBadge({ status, className }: { status: BookingStatus; className?: string }) {
  const { t } = useBookingT()
  return (
    <span className={cn("inline-flex items-center rounded-md px-3 py-1 text-sm font-medium", statusStyles[status], className)}>
      {t.status[status]}
    </span>
  )
}

const paymentStyles: Record<PaymentStatus, string> = {
  unpaid: "bg-amber-500/10 text-amber-800 dark:text-amber-500",
  deposit_paid: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  paid: "bg-green-500/10 text-green-700 dark:text-green-500",
  refunded: "bg-muted text-muted-foreground",
}

export function PaymentStatusBadge({ status, className }: { status: PaymentStatus; className?: string }) {
  const { t } = useBookingT()
  return (
    <span className={cn("inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium", paymentStyles[status], className)}>
      {t.payment[status]}
    </span>
  )
}

const payoutStyles: Record<PayoutStatus, string> = {
  pending: "bg-amber-500/10 text-amber-800 dark:text-amber-500",
  paid: "bg-green-500/10 text-green-700 dark:text-green-500",
}

export function PayoutStatusBadge({ status, className }: { status: PayoutStatus; className?: string }) {
  const { t } = useBookingT()
  return (
    <span className={cn("inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium", payoutStyles[status], className)}>
      {t.payout[status]}
    </span>
  )
}

const invoiceStyles: Record<InvoiceStatus | "missing", string> = {
  missing: "bg-amber-500/10 text-amber-800 dark:text-amber-500",
  submitted: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  approved: "bg-green-500/10 text-green-700 dark:text-green-500",
  rejected: "bg-red-500/10 text-red-700 dark:text-red-400",
}

/** `null` means the completed booking has no invoice yet, which is the state that needs the DJ's attention. */
export function InvoiceStatusBadge({ status, className }: { status: InvoiceStatus | null; className?: string }) {
  const { t } = useBookingT()
  const key = status ?? "missing"
  const label = key === "missing" ? t.invoice.statusMissing : key === "submitted" ? t.invoice.statusSubmitted : key === "approved" ? t.invoice.statusApproved : t.invoice.statusRejected
  return <span className={cn("inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium", invoiceStyles[key], className)}>{label}</span>
}
