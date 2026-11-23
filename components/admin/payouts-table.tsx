"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { ExternalLink } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { markPayoutPaid, type AdminPayoutRow } from "@/app/actions/admin-payments"
import { formatEuro } from "@/lib/bookings/pricing"
import { formatIban } from "@/lib/bookings/invoicing"

/** Registers payouts made by bank transfer outside the platform; nothing is transferred from here. */
export function PayoutsTable({ rows }: { rows: AdminPayoutRow[] }) {
  const nl = useLanguage().language === "nl"
  const locale = nl ? "nl-NL" : "en-GB"
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [busyId, setBusyId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const open = rows.filter((row) => row.payoutStatus !== "paid")
  const done = rows.filter((row) => row.payoutStatus === "paid")

  function clientStatus(row: AdminPayoutRow) {
    if (row.paymentStatus === "paid") return nl ? "Klant heeft betaald" : "Client has paid"
    if (row.paymentStatus === "refunded") return nl ? "Terugbetaald aan klant" : "Refunded to client"
    if (row.paymentStatus === "deposit_paid") return nl ? "Alleen aanbetaling ontvangen" : "Deposit received only"
    return nl ? "Klant heeft niet betaald" : "Client has not paid"
  }

  function payOut(row: AdminPayoutRow) {
    const amount = formatEuro(row.payoutCents)
    const question = nl
      ? `${amount} uitbetaald aan ${row.professionalName} voor boeking #${row.id}?`
      : `Paid out ${amount} to ${row.professionalName} for booking #${row.id}?`
    const warning = row.paymentStatus === "paid" ? "" : `\n\n${nl ? "Let op" : "Note"}: ${clientStatus(row)}.`
    if (!window.confirm(question + warning)) return
    setError(null)
    setBusyId(row.id)
    startTransition(async () => {
      try {
        const result = await markPayoutPaid({ bookingId: row.id, payoutCents: row.payoutCents })
        if (!result.ok) setError(result.error)
      } catch {
        setError(nl ? "Opslaan is mislukt. Controleer je verbinding en probeer het opnieuw." : "Saving failed. Check your connection and try again.")
      }
      setBusyId(null)
      router.refresh()
    })
  }

  function table(list: AdminPayoutRow[], isOpen: boolean) {
    return (
      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-left text-muted-foreground">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">{nl ? "Boeking" : "Booking"}</th>
              <th scope="col" className="px-4 py-3 font-medium">Professional</th>
              <th scope="col" className="px-4 py-3 font-medium">{nl ? "Factuur" : "Invoice"}</th>
              <th scope="col" className="px-4 py-3 font-medium">{nl ? "Betaling klant" : "Client payment"}</th>
              <th scope="col" className="px-4 py-3 font-medium">{isOpen ? (nl ? "Uit te betalen" : "Payout") : nl ? "Bedrag" : "Amount"}</th>
              <th scope="col" className="px-4 py-3 font-medium">
                {isOpen ? <span className="sr-only">{nl ? "Actie" : "Action"}</span> : nl ? "Uitbetaald op" : "Paid out on"}
              </th>
            </tr>
          </thead>
          <tbody>
            {list.map((row) => (
              <tr key={row.id} className="border-b border-border align-top last:border-0">
                <td className="px-4 py-3">
                  <p className="font-medium">#{row.id} · {row.eventName}</p>
                  <p className="text-muted-foreground">{new Date(row.eventDate).toLocaleDateString(locale)}</p>
                </td>
                <td className="px-4 py-3">
                  <p>{row.professionalName}</p>
                  {isOpen && (
                    <>
                      {row.accountName && <p className="text-muted-foreground">{row.accountName}</p>}
                      {row.iban ? (
                        <p className="whitespace-nowrap font-mono text-muted-foreground">{formatIban(row.iban)}</p>
                      ) : (
                        <p className="text-red-700 dark:text-red-400">{nl ? "IBAN ontbreekt" : "IBAN missing"}</p>
                      )}
                      {row.iban && !row.ibanValid && <p className="text-red-700 dark:text-red-400">{nl ? "IBAN klopt niet" : "IBAN is not correct"}</p>}
                    </>
                  )}
                </td>
                <td className="px-4 py-3">
                  {row.invoiceUrl ? (
                    <a
                      href={row.invoiceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 underline underline-offset-4"
                    >
                      {row.invoiceNumber}
                      <ExternalLink className="size-3.5" aria-hidden />
                      <span className="sr-only">{nl ? "(opent in nieuw tabblad)" : "(opens in a new tab)"}</span>
                    </a>
                  ) : (
                    row.invoiceNumber
                  )}
                  {row.receipts.map((receipt, index) => (
                    <p key={index}>
                      <a
                        href={receipt.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground underline underline-offset-4"
                      >
                        {nl ? "Bon" : "Receipt"}: {receipt.label}
                      </a>
                    </p>
                  ))}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={row.paymentStatus === "paid" ? "default" : "secondary"}>{clientStatus(row)}</Badge>
                </td>
                <td className="px-4 py-3 font-medium tabular-nums">{formatEuro(row.payoutCents)}</td>
                <td className={isOpen ? "px-4 py-3 text-right" : "px-4 py-3"}>
                  {isOpen ? (
                    <Button size="sm" disabled={pending || !row.ibanValid} onClick={() => payOut(row)}>
                      {busyId === row.id ? (nl ? "Bezig…" : "Saving…") : nl ? "Uitbetaald" : "Paid out"}
                    </Button>
                  ) : (
                    row.paidOutAt && new Date(row.paidOutAt).toLocaleDateString(locale)
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold">{nl ? "Uitbetalingen" : "Payouts"}</h2>
        <p className="text-sm text-muted-foreground">
          {nl
            ? "Zet een uitbetaling op uitbetaald nadat je het bedrag zelf hebt overgemaakt. Hier wordt alleen geregistreerd, er wordt geen geld overgemaakt."
            : "Mark a payout as paid out after you transferred the amount yourself. This only registers it, no money is transferred."}
        </p>
      </div>
      {error && (
        <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}
      <section className="space-y-3">
        <h3 className="text-lg font-semibold">{nl ? "Nog uit te betalen" : "To pay out"} ({open.length})</h3>
        {open.length > 0 ? (
          table(open, true)
        ) : (
          <p className="text-sm text-muted-foreground">{nl ? "Er staan geen uitbetalingen open." : "No payouts are outstanding."}</p>
        )}
      </section>
      {done.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-lg font-semibold">{nl ? "Uitbetaald" : "Paid out"} ({done.length})</h3>
          {table(done, false)}
        </section>
      )}
    </div>
  )
}
