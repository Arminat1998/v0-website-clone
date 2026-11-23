"use client"

import { useState } from "react"
import { Check, Copy, Info } from "lucide-react"
import { useBookingT } from "@/lib/booking-i18n"
import type { Booking, BillingProfile, InvoiceLine } from "@/lib/db/schema"
import { formatEuro } from "@/lib/bookings/pricing"
import type { InvoiceTotals } from "@/lib/bookings/invoicing"

interface Props {
  lines: InvoiceLine[]
  totals: InvoiceTotals
  booking: Pick<Booking, "platformFeeCents" | "payoutCents">
  profile: Pick<BillingProfile, "vatScheme" | "performanceVatRate">
}

export function InvoiceSpecification({ lines, totals, booking, profile }: Props) {
  const { t, locale } = useBookingT()
  const ti = t.invoice
  const [copied, setCopied] = useState(false)

  async function copySpecification() {
    const rows = lines.map((l) =>
      [l.description, `${l.quantity} ${ti.unit[l.unitLabel] ?? l.unitLabel}`, formatEuro(l.unitCents, locale), `${l.vatRate}%`, formatEuro(l.netCents, locale), formatEuro(l.vatCents, locale), formatEuro(l.grossCents, locale)].join("\t"),
    )
    const text = [
      [ti.colDescription, ti.colQuantity, ti.colRate, ti.colVat, ti.colNet, ti.colVatAmount, ti.colGross].join("\t"),
      ...rows,
      "",
      `${ti.subtotalNet}\t${formatEuro(totals.netCents, locale)}`,
      ...totals.vatBreakdown.map((v) => `${ti.vatOver(v.rate)} ${formatEuro(v.netCents, locale)}\t${formatEuro(v.vatCents, locale)}`),
      `${ti.totalGross}\t${formatEuro(totals.totalCents, locale)}`,
    ].join("\n")
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <section aria-labelledby="spec-heading" className="rounded-lg border border-border bg-card">
      <div className="flex flex-col gap-3 border-b border-border p-5 sm:flex-row sm:items-start sm:justify-between md:p-6">
        <div>
          <h2 id="spec-heading" className="text-base font-semibold text-foreground">
            {ti.specTitle}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{ti.specSubtitle}</p>
        </div>
        <button
          type="button"
          onClick={copySpecification}
          className="inline-flex flex-shrink-0 items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
        >
          {copied ? <Check className="h-4 w-4 text-green-800 dark:text-green-500" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
          {copied ? ti.copied : ti.copySpec}
        </button>
      </div>

      {/* Phone: one block per line instead of a table that has to scroll sideways */}
      <ul className="divide-y divide-border sm:hidden">
        {lines.map((line, index) => (
          <li key={`${line.key}-${index}`} className="flex items-start justify-between gap-4 px-5 py-3 text-sm">
            <div className="min-w-0">
              <p className="text-foreground">{line.description}</p>
              <p className="mt-0.5 tabular-nums text-muted-foreground">
                {line.quantity} {ti.unit[line.unitLabel] ?? line.unitLabel} × {formatEuro(line.unitCents, locale)} · {ti.colVat} {line.vatRate}%
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="whitespace-nowrap font-medium tabular-nums text-foreground">{formatEuro(line.grossCents, locale)}</p>
              <p className="whitespace-nowrap text-xs tabular-nums text-muted-foreground">{ti.colGross}</p>
            </div>
          </li>
        ))}
      </ul>

      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th scope="col" className="px-5 py-3 font-medium md:px-6">{ti.colDescription}</th>
              <th scope="col" className="px-3 py-3 text-right font-medium">{ti.colQuantity}</th>
              <th scope="col" className="px-3 py-3 text-right font-medium">{ti.colRate}</th>
              <th scope="col" className="px-3 py-3 text-right font-medium">{ti.colVat}</th>
              <th scope="col" className="px-3 py-3 text-right font-medium">{ti.colNet}</th>
              <th scope="col" className="px-3 py-3 text-right font-medium">{ti.colVatAmount}</th>
              <th scope="col" className="px-5 py-3 text-right font-medium md:px-6">{ti.colGross}</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line, index) => (
              <tr key={`${line.key}-${index}`} className="border-t border-border">
                <td className="px-5 py-3 text-foreground md:px-6">{line.description}</td>
                <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums text-muted-foreground">
                  {line.quantity} {ti.unit[line.unitLabel] ?? line.unitLabel}
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums text-muted-foreground">{formatEuro(line.unitCents, locale)}</td>
                <td className="px-3 py-3 text-right">
                  <span className="inline-flex rounded-md bg-muted px-2 py-0.5 text-xs font-medium tabular-nums text-foreground">{line.vatRate}%</span>
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums text-foreground">{formatEuro(line.netCents, locale)}</td>
                <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums text-muted-foreground">{formatEuro(line.vatCents, locale)}</td>
                <td className="whitespace-nowrap px-5 py-3 text-right font-medium tabular-nums text-foreground md:px-6">{formatEuro(line.grossCents, locale)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 gap-6 border-t border-border p-5 md:grid-cols-2 md:p-6">
        <div className="flex items-start gap-2 text-sm text-muted-foreground">
          <Info className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden />
          <p className="leading-relaxed">{profile.vatScheme === "kor" ? ti.korNote : ti.rateNotes(profile.performanceVatRate)}</p>
        </div>
        <dl className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">{ti.subtotalNet}</dt>
            <dd className="tabular-nums text-foreground">{formatEuro(totals.netCents, locale)}</dd>
          </div>
          {totals.vatBreakdown.map((v) => (
            <div key={v.rate} className="flex justify-between gap-4">
              <dt className="text-muted-foreground">
                {ti.vatOver(v.rate)} {formatEuro(v.netCents, locale)}
              </dt>
              <dd className="tabular-nums text-foreground">{formatEuro(v.vatCents, locale)}</dd>
            </div>
          ))}
          <div className="flex justify-between gap-4 border-t border-border pt-2">
            <dt className="font-semibold text-foreground">{ti.totalGross}</dt>
            <dd className="text-lg font-bold tabular-nums text-foreground">{formatEuro(totals.totalCents, locale)}</dd>
          </div>
          <div className="mt-2 flex justify-between gap-4 text-xs">
            <dt className="text-muted-foreground">
              {ti.serviceFee} <span className="hidden sm:inline">· {ti.serviceFeeNote}</span>
            </dt>
            <dd className="whitespace-nowrap tabular-nums text-muted-foreground">− {formatEuro(booking.platformFeeCents, locale)}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-sm font-medium text-foreground">{ti.payout}</dt>
            <dd className="text-xl font-bold tabular-nums text-green-800 dark:text-green-500">{formatEuro(booking.payoutCents, locale)}</dd>
          </div>
        </dl>
      </div>
    </section>
  )
}
