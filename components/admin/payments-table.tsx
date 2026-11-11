"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useLanguage } from "@/contexts/language-context"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { markPaymentReceived, type AdminPaymentRow } from "@/app/actions/admin-payments"
import { formatEuro } from "@/lib/bookings/pricing"
import { paymentReference } from "@/lib/bookings/payments"

export function PaymentsTable({ rows }: { rows: AdminPaymentRow[] }) {
  const nl = useLanguage().language === "nl"
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [busyId, setBusyId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const open = rows.filter((r) => r.summary.due)
  const rest = rows.filter((r) => !r.summary.due)

  function receive(row: AdminPaymentRow) {
    const due = row.summary.due
    if (!due) return
    const question = nl
      ? `${formatEuro(due.cents)} ontvangen voor boeking #${row.id}?`
      : `Received ${formatEuro(due.cents)} for booking #${row.id}?`
    if (!window.confirm(question)) return
    setError(null)
    setBusyId(row.id)
    startTransition(async () => {
      const result = await markPaymentReceived({ bookingId: row.id, part: due.part })
      if (!result.ok) setError(result.error)
      setBusyId(null)
      router.refresh()
    })
  }

  function status(row: AdminPaymentRow) {
    if (row.summary.paid) return nl ? "Betaald" : "Paid"
    if (row.paymentStatus === "refunded") return nl ? "Terugbetaald" : "Refunded"
    if (row.summary.depositPaid) return nl ? "Aanbetaling ontvangen" : "Deposit received"
    return nl ? "Nog niet betaald" : "Not paid"
  }

  function table(list: AdminPaymentRow[]) {
    return (
      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-left text-muted-foreground">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">{nl ? "Boeking" : "Booking"}</th>
              <th scope="col" className="px-4 py-3 font-medium">{nl ? "Klant" : "Client"}</th>
              <th scope="col" className="px-4 py-3 font-medium">Professional</th>
              <th scope="col" className="px-4 py-3 font-medium">Status</th>
              <th scope="col" className="px-4 py-3 font-medium">{nl ? "Open bedrag" : "Amount due"}</th>
              <th scope="col" className="px-4 py-3 font-medium">
                <span className="sr-only">{nl ? "Actie" : "Action"}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {list.map((row) => {
              const due = row.summary.due
              return (
                <tr key={row.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium">#{row.id} · {row.eventName}</p>
                    <p className="text-muted-foreground">
                      {new Date(row.eventDate).toLocaleDateString(nl ? "nl-NL" : "en-GB")}
                      {row.invoiceNumber && ` · ${nl ? "factuur" : "invoice"} ${row.invoiceNumber}`}
                    </p>
                  </td>
                  <td className="px-4 py-3">{row.customerName}</td>
                  <td className="px-4 py-3">{row.professionalName}</td>
                  <td className="px-4 py-3">
                    <Badge variant={row.summary.paid ? "default" : "secondary"}>{status(row)}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    {due ? (
                      <>
                        <p className="font-medium tabular-nums">{formatEuro(due.cents)}</p>
                        <p className="text-muted-foreground">
                          {due.part === "deposit" ? (nl ? "Aanbetaling" : "Deposit") : nl ? "Eindfactuur" : "Final invoice"} ·{" "}
                          {paymentReference(row.id, due.part)}
                        </p>
                      </>
                    ) : (
                      <span className="text-muted-foreground">
                        {row.summary.paid ? "–" : nl ? "Wacht op eindfactuur" : "Waiting for final invoice"}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {due && (
                      <Button size="sm" disabled={pending} onClick={() => receive(row)}>
                        {busyId === row.id ? (nl ? "Bezig…" : "Saving…") : nl ? "Ontvangen" : "Received"}
                      </Button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">{nl ? "Betalingen" : "Payments"}</h1>
        <p className="text-sm text-muted-foreground">
          {nl
            ? "Zet een betaling op ontvangen zodra de overboeking met het betaalkenmerk binnen is."
            : "Mark a payment as received once the bank transfer with the payment reference has arrived."}
        </p>
      </div>
      {error && (
        <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{nl ? "Openstaand" : "Outstanding"} ({open.length})</h2>
        {open.length > 0 ? (
          table(open)
        ) : (
          <p className="text-sm text-muted-foreground">{nl ? "Er staan geen betalingen open." : "No payments are outstanding."}</p>
        )}
      </section>
      {rest.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">{nl ? "Overig" : "Other"} ({rest.length})</h2>
          {table(rest)}
        </section>
      )}
    </div>
  )
}
