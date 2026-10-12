"use client"

import { useBookingT } from "@/lib/booking-i18n"
import type { BillingProfile, Booking, InvoiceLine, InvoiceMethod } from "@/lib/db/schema"
import { formatEuro } from "@/lib/bookings/pricing"
import { billingAddress, bookingNumber, clientName, formatEventDate } from "@/lib/bookings/format"
import { formatIban, sumInvoiceLines } from "@/lib/bookings/invoicing"

interface Props {
  booking: Booking
  profile: BillingProfile
  lines: InvoiceLine[]
  invoiceNumber: string
  invoiceDate: string
  method: InvoiceMethod
  className?: string
}

export function InvoiceDocument({ booking, profile, lines, invoiceNumber, invoiceDate, method, className }: Props) {
  const { t, locale } = useBookingT()
  const td = t.invoice.doc
  const totals = sumInvoiceLines(lines)
  const recipient = billingAddress(booking)
  const providerAddress = [
    [profile.street, profile.houseNumber].filter(Boolean).join(" "),
    [profile.postalCode, profile.city].filter(Boolean).join(" "),
    profile.country,
  ].filter(Boolean)

  return (
    <article className={`bg-paper text-paper-foreground ${className ?? ""}`} aria-label={`${td.invoice} ${invoiceNumber}`}>
      <div className="mx-auto flex max-w-[210mm] flex-col gap-10 p-10 md:p-14">
        <header className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-paper-muted">{td.from}</p>
            <h1 className="mt-1 text-2xl font-bold">{profile.businessName || "—"}</h1>
            <address className="mt-2 text-sm not-italic leading-relaxed text-paper-muted">
              {providerAddress.map((line) => (
                <div key={line}>{line}</div>
              ))}
            </address>
            <dl className="mt-3 flex flex-col gap-0.5 text-xs text-paper-muted">
              {profile.kvkNumber && (
                <div className="flex gap-2">
                  <dt>{td.kvk}</dt>
                  <dd className="font-mono">{profile.kvkNumber}</dd>
                </div>
              )}
              {profile.vatNumber && profile.vatScheme !== "kor" && (
                <div className="flex gap-2">
                  <dt>{td.vat}</dt>
                  <dd className="font-mono">{profile.vatNumber}</dd>
                </div>
              )}
              {profile.iban && (
                <div className="flex gap-2">
                  <dt>{td.iban}</dt>
                  <dd className="font-mono">{formatIban(profile.iban)}</dd>
                </div>
              )}
            </dl>
          </div>
          <div className="sm:text-right">
            <h2 className="text-3xl font-bold uppercase tracking-tight">{td.invoice}</h2>
            <dl className="mt-3 flex flex-col gap-1 text-sm">
              <div className="flex gap-3 sm:justify-end">
                <dt className="text-paper-muted">{td.invoiceNumber}</dt>
                <dd className="font-mono font-semibold">{invoiceNumber || "—"}</dd>
              </div>
              <div className="flex gap-3 sm:justify-end">
                <dt className="text-paper-muted">{td.invoiceDate}</dt>
                <dd className="font-medium">{invoiceDate ? formatEventDate(invoiceDate, locale, "short") : "—"}</dd>
              </div>
              <div className="flex gap-3 sm:justify-end">
                <dt className="text-paper-muted">{td.booking}</dt>
                <dd className="font-mono font-medium">{bookingNumber(booking.id)}</dd>
              </div>
              <div className="flex gap-3 sm:justify-end">
                <dt className="text-paper-muted">{td.eventDate}</dt>
                <dd className="font-medium">{formatEventDate(booking.eventDate, locale, "short")}</dd>
              </div>
            </dl>
          </div>
        </header>

        <section>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-paper-muted">{td.to}</p>
          <p className="mt-1 font-semibold">{clientName(booking)}</p>
          <address className="text-sm not-italic leading-relaxed text-paper-muted">
            {recipient.map((line) => (
              <div key={line}>{line}</div>
            ))}
            {booking.vatNumber && (
              <div>
                {td.vat} <span className="font-mono">{booking.vatNumber}</span>
              </div>
            )}
          </address>
        </section>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-paper-foreground text-left text-xs uppercase tracking-wide text-paper-muted">
              <th scope="col" className="py-2 pr-3 font-semibold">{t.invoice.colDescription}</th>
              <th scope="col" className="py-2 px-3 text-right font-semibold">{t.invoice.colQuantity}</th>
              <th scope="col" className="py-2 px-3 text-right font-semibold">{t.invoice.colRate}</th>
              <th scope="col" className="py-2 px-3 text-right font-semibold">{t.invoice.colVat}</th>
              <th scope="col" className="py-2 pl-3 text-right font-semibold">{t.invoice.colNet}</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line, index) => (
              <tr key={`${line.key}-${index}`} className="border-b border-paper-border">
                <td className="py-3 pr-3">{line.description}</td>
                <td className="whitespace-nowrap py-3 px-3 text-right tabular-nums">
                  {line.quantity} {t.invoice.unit[line.unitLabel] ?? line.unitLabel}
                </td>
                <td className="whitespace-nowrap py-3 px-3 text-right tabular-nums">{formatEuro(line.unitCents, locale)}</td>
                <td className="whitespace-nowrap py-3 px-3 text-right tabular-nums">{line.vatRate}%</td>
                <td className="whitespace-nowrap py-3 pl-3 text-right tabular-nums">{formatEuro(line.netCents, locale)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end">
          <dl className="flex w-full max-w-xs flex-col gap-1.5 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-paper-muted">{t.invoice.subtotalNet}</dt>
              <dd className="tabular-nums">{formatEuro(totals.netCents, locale)}</dd>
            </div>
            {totals.vatBreakdown.map((v) => (
              <div key={v.rate} className="flex justify-between gap-4">
                <dt className="text-paper-muted">
                  {t.invoice.vatOver(v.rate)} {formatEuro(v.netCents, locale)}
                </dt>
                <dd className="tabular-nums">{formatEuro(v.vatCents, locale)}</dd>
              </div>
            ))}
            <div className="mt-1 flex justify-between gap-4 border-t-2 border-paper-foreground pt-2">
              <dt className="font-semibold">{t.invoice.totalGross}</dt>
              <dd className="text-lg font-bold tabular-nums">{formatEuro(totals.totalCents, locale)}</dd>
            </div>
          </dl>
        </div>

        <footer className="flex flex-col gap-1 border-t border-paper-border pt-4 text-xs leading-relaxed text-paper-muted">
          {profile.vatScheme === "kor" && <p>{td.korLine}</p>}
          {method === "self_billing" && <p>{td.selfBillingLine}</p>}
          <p>{td.paymentLine}</p>
        </footer>
      </div>
    </article>
  )
}
