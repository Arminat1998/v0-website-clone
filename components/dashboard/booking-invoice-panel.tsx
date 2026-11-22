"use client"

import Link from "next/link"
import { ArrowRight, ExternalLink, FileText, Printer } from "lucide-react"
import { useBookingT } from "@/lib/booking-i18n"
import type { Booking, Invoice } from "@/lib/db/schema"
import { formatEuro } from "@/lib/bookings/pricing"
import { formatDateTime, formatEventDate } from "@/lib/bookings/format"
import { invoiceFileUrl } from "@/lib/bookings/invoicing"
import { Button } from "@/components/ui/button"
import { InvoiceStatusBadge, PaymentStatusBadge, PayoutStatusBadge } from "./booking-status-badge"

export function BookingInvoicePanel({ booking, invoice }: { booking: Booking; invoice: Invoice | null }) {
  const { t, locale } = useBookingT()
  const ti = t.invoice

  return (
    <section aria-labelledby="invoice-heading" className={`rounded-xl border bg-card p-5 shadow-sm md:p-6 ${invoice ? "border-border" : "border-amber-500/40"}`}>
      <div className="flex items-start justify-between gap-3">
        <h2 id="invoice-heading" className="text-base font-semibold text-foreground">
          {ti.panelTitle}
        </h2>
        <InvoiceStatusBadge status={invoice?.status ?? null} />
      </div>

      {invoice ? (
        <dl className="mt-4 flex flex-col gap-3 text-sm">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">{ti.invoiceNumber}</dt>
            <dd className="font-mono font-medium text-foreground">{invoice.invoiceNumber}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">{ti.invoiceDate}</dt>
            <dd className="text-foreground">{formatEventDate(invoice.invoiceDate, locale, "short")}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">{ti.submittedOn}</dt>
            <dd className="text-foreground">{formatDateTime(invoice.submittedAt, locale)}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">{ti.invoiceTotal}</dt>
            <dd className="font-medium tabular-nums text-foreground">{formatEuro(invoice.totalCents, locale)}</dd>
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
            <dt className="text-muted-foreground">{t.paymentMethod[booking.paymentMethod]}</dt>
            <dd>
              <PaymentStatusBadge status={booking.paymentStatus} />
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">{t.detail.payout}</dt>
            <dd>
              <PayoutStatusBadge status={booking.payoutStatus} />
            </dd>
          </div>
        </dl>
      ) : (
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{ti.panelMissing}</p>
      )}

      <div className="mt-4 flex flex-col gap-2">
        {invoice ? (
          <>
            <p className="text-xs text-muted-foreground">
              {booking.payoutStatus === "paid" && booking.paidOutAt ? `${t.completed.paidOutOn} ${formatDateTime(booking.paidOutAt, locale)}` : t.completed.payoutExpected}
            </p>
            {invoice.method === "self_billing" ? (
              <Button asChild variant="outline" className="w-full">
                <Link href={`/dashboard/bookings/${booking.id}/invoice/print`} target="_blank">
                  <Printer className="mr-2 h-4 w-4" aria-hidden />
                  {ti.viewInvoice}
                </Link>
              </Button>
            ) : (
              invoiceFileUrl(invoice) && (
                <Button asChild variant="outline" className="w-full">
                  <a href={invoiceFileUrl(invoice)!} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" aria-hidden />
                    {ti.viewInvoice}
                  </a>
                </Button>
              )
            )}
          </>
        ) : (
          <Button asChild className="w-full bg-red-700 text-white hover:bg-red-600">
            <Link href={`/dashboard/bookings/${booking.id}/invoice`}>
              <FileText className="mr-2 h-4 w-4" aria-hidden />
              {ti.panelCta}
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
            </Link>
          </Button>
        )}
      </div>
    </section>
  )
}
