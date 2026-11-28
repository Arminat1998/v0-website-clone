"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Search, ExternalLink, FileText, CheckCircle2, XCircle, Send, Eye, Download } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { formatEuro } from "@/lib/bookings/pricing"
import { BOOKING_TIME_ZONE } from "@/lib/bookings/format"
import {
  type AdminInvoiceListItem,
  getAdminInvoiceDetail,
  setInvoiceStatus,
  sendPaymentReminder,
} from "@/app/actions/admin-invoices"

interface Props {
  initialItems: AdminInvoiceListItem[]
  totalCount: number
}

export function InvoicesTable({ initialItems, totalCount }: Props) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null)
  const [detailData, setDetailData] = useState<any | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [actionMessage, setActionMessage] = useState<string | null>(null)

  // Client-side filtering for fast interactive feedback
  const filteredItems = initialItems.filter((item) => {
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "submitted" && item.status === "submitted") ||
      (statusFilter === "approved" && item.status === "approved") ||
      (statusFilter === "rejected" && item.status === "rejected")

    const query = searchTerm.toLowerCase().trim()
    const matchesSearch =
      !query ||
      item.invoiceNumber.toLowerCase().includes(query) ||
      item.eventName.toLowerCase().includes(query) ||
      item.artistName.toLowerCase().includes(query) ||
      item.customerName.toLowerCase().includes(query) ||
      String(item.bookingId).includes(query)

    return matchesStatus && matchesSearch
  })

  async function openDetail(invoiceId: number) {
    setSelectedInvoiceId(invoiceId)
    setLoadingDetail(true)
    setActionMessage(null)
    try {
      const data = await getAdminInvoiceDetail(invoiceId)
      setDetailData(data)
    } finally {
      setLoadingDetail(false)
    }
  }

  function handleStatusUpdate(newStatus: "approved" | "rejected") {
    if (!selectedInvoiceId) return
    startTransition(async () => {
      const res = await setInvoiceStatus({ invoiceId: selectedInvoiceId, status: newStatus })
      if (res.ok) {
        setActionMessage(`Status succesvol bijgewerkt naar ${newStatus === "approved" ? "goedgekeurd" : "afgewezen"}.`)
        const refreshed = await getAdminInvoiceDetail(selectedInvoiceId)
        setDetailData(refreshed)
        router.refresh()
      }
    })
  }

  function handleSendReminder(part: "deposit" | "balance") {
    if (!detailData?.booking?.id) return
    startTransition(async () => {
      const res = await sendPaymentReminder({ bookingId: detailData.booking.id, part })
      if (res.ok) {
        setActionMessage(`Betaalherinnering voor ${part === "deposit" ? "aanbetaling (25%)" : "restant (75%)"} verstuurd naar boeker.`)
      }
    })
  }

  function invoiceStatusBadge(status: string) {
    switch (status) {
      case "approved":
        return <Badge className="bg-emerald-600/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30">Goedgekeurd</Badge>
      case "rejected":
        return <Badge variant="destructive">Afgewezen</Badge>
      default:
        return <Badge className="bg-amber-600/15 text-amber-700 dark:text-amber-400 border-amber-500/30">In behandeling</Badge>
    }
  }

  function paymentStatusBadge(status: string) {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-600 text-white font-medium">Volledig betaald</Badge>
      case "deposit_paid":
        return <Badge className="bg-blue-600 text-white font-medium">Aanbetaling voldaan</Badge>
      case "refunded":
        return <Badge variant="outline" className="text-rose-600 border-rose-300">Terugbetaald</Badge>
      default:
        return <Badge variant="secondary">Nog niet betaald</Badge>
    }
  }

  return (
    <div className="space-y-4">
      {/* Search and filters bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-card p-4 rounded-xl border border-border shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Zoek op factuurnr, boeking, artiest of boeker..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-10"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 text-sm rounded-md border border-input bg-background px-3 py-1 shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="all">Alle facturen</option>
            <option value="submitted">In behandeling</option>
            <option value="approved">Goedgekeurd</option>
            <option value="rejected">Afgewezen</option>
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/40 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th scope="col" className="px-5 py-3.5">Factuurnr</th>
                <th scope="col" className="px-5 py-3.5">Datum</th>
                <th scope="col" className="px-5 py-3.5">Boeking</th>
                <th scope="col" className="px-5 py-3.5">Partijen</th>
                <th scope="col" className="px-5 py-3.5">Totaal (incl. btw)</th>
                <th scope="col" className="px-5 py-3.5">Factuurstatus</th>
                <th scope="col" className="px-5 py-3.5">Betaling</th>
                <th scope="col" className="px-5 py-3.5 text-right">Acties</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-muted-foreground">
                    <FileText className="mx-auto h-8 w-8 mb-2 opacity-50" />
                    Geen facturen gevonden die voldoen aan de filters.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-4 font-mono font-medium text-foreground">
                      {item.invoiceNumber}
                      <span className="block text-[11px] font-sans text-muted-foreground mt-0.5">
                        {item.method === "self_billing" ? "Self-billing (ARSI)" : "Upload"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground whitespace-nowrap">
                      {new Date(item.invoiceDate).toLocaleDateString("nl-NL", { timeZone: BOOKING_TIME_ZONE })}
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-foreground">#{item.bookingId}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[140px]">{item.eventName}</p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-xs">
                        <span className="font-medium text-foreground">{item.artistName}</span>
                        <span className="block text-muted-foreground truncate max-w-[160px]">Klant: {item.customerName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-semibold tabular-nums text-foreground">
                      {formatEuro(item.totalCents)}
                      <span className="block text-[11px] font-normal text-muted-foreground">
                        btw: {formatEuro(item.vatCents)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {invoiceStatusBadge(item.status)}
                    </td>
                    <td className="px-5 py-4">
                      {paymentStatusBadge(item.paymentStatus)}
                    </td>
                    <td className="px-5 py-4 text-right space-x-2 whitespace-nowrap">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openDetail(item.id)}
                        className="h-8 gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Details
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        asChild
                        className="h-8 gap-1"
                      >
                        <Link href={`/admin/betalingen/${item.bookingId}/factuur`} target="_blank">
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span className="sr-only">Bekijk document</span>
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-over Detail Drawer */}
      <Sheet open={selectedInvoiceId !== null} onOpenChange={(open) => !open && setSelectedInvoiceId(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader className="pb-4 border-b border-border">
            <SheetTitle className="text-xl flex items-center justify-between">
              <span>Factuur {detailData?.invoiceNumber}</span>
              {detailData && invoiceStatusBadge(detailData.status)}
            </SheetTitle>
            <SheetDescription>
              Uitgebracht op {detailData?.invoiceDate ? new Date(detailData.invoiceDate).toLocaleDateString("nl-NL") : "—"} · Methode: {detailData?.method === "self_billing" ? "Self-billing door ARSI" : "Geüpload door artiest"}
            </SheetDescription>
          </SheetHeader>

          {loadingDetail ? (
            <div className="py-16 text-center text-muted-foreground animate-pulse">
              Factuurgegevens laden...
            </div>
          ) : detailData ? (
            <div className="py-6 space-y-6">
              {actionMessage && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-sm rounded-lg">
                  {actionMessage}
                </div>
              )}

              {/* Financial Summary */}
              <div className="bg-muted/40 p-4 rounded-xl border border-border space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Netto subtotaal</span>
                  <span className="font-medium tabular-nums">{formatEuro(detailData.netCents)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Btw</span>
                  <span className="font-medium tabular-nums">{formatEuro(detailData.vatCents)}</span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between items-center font-bold text-base">
                  <span>Totaal factuurbedrag</span>
                  <span className="tabular-nums text-foreground">{formatEuro(detailData.totalCents)}</span>
                </div>
              </div>

              {/* Booking & Cashflow Status */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Boeking & Betalingsstroom</h4>
                <div className="p-4 rounded-xl border border-border bg-card space-y-2 text-sm">
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                    <span className="text-muted-foreground shrink-0">Boeking:</span>
                    <span className="font-medium break-words sm:text-right">#{detailData.booking.id} ({detailData.booking.eventName})</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                    <span className="text-muted-foreground shrink-0">Klant:</span>
                    <span className="font-medium break-words sm:text-right">{detailData.booking.customerFullName} ({detailData.booking.email})</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Aanbetaling (25%):</span>
                    <span className="font-medium tabular-nums">{formatEuro(detailData.booking.depositCents)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Openstaand restbedrag:</span>
                    <span className="font-medium tabular-nums">{formatEuro(detailData.booking.balanceCents)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-border">
                    <span className="text-muted-foreground">Betalingsstatus:</span>
                    {paymentStatusBadge(detailData.booking.paymentStatus)}
                  </div>
                </div>
              </div>

              {/* Professional Billing Profile */}
              {detailData.profile && (
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Artiest Gegevens</h4>
                  <div className="p-4 rounded-xl border border-border bg-card text-xs space-y-1">
                    <p className="font-bold text-sm text-foreground">{detailData.profile.businessName || "Geen bedrijfsnaam"}</p>
                    <p className="text-muted-foreground">KVK: {detailData.profile.kvkNumber || "—"} · BTW: {detailData.profile.vatNumber || "—"}</p>
                    <p className="text-muted-foreground">IBAN: {detailData.profile.iban || "—"}</p>
                    <p className="text-muted-foreground">Regeling: {detailData.profile.vatScheme === "kor" ? "KOR (Vrijgesteld)" : "Standaard BTW"}</p>
                  </div>
                </div>
              )}

              {/* Invoice Lines Breakdown */}
              {detailData.lines && detailData.lines.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Factuurspecificatie</h4>
                  <div className="border border-border rounded-xl overflow-hidden divide-y divide-border">
                    {detailData.lines.map((line: any, idx: number) => (
                      <div key={idx} className="p-3 text-xs flex justify-between items-start bg-card">
                        <div>
                          <p className="font-medium text-foreground">{line.description}</p>
                          <p className="text-muted-foreground">{line.quantity} × {formatEuro(line.unitCents)} ({line.vatRate}% btw)</p>
                        </div>
                        <span className="font-bold tabular-nums text-foreground">{formatEuro(line.grossCents)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Admin Actions */}
              <div className="space-y-3 pt-4 border-t border-border">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Beheerdersacties</h4>
                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="outline" size="sm" className="gap-1.5">
                    <Link href={`/admin/betalingen/${detailData.booking.id}/factuur`} target="_blank">
                      <Download className="w-4 h-4" />
                      Afdrukweergave / PDF openen
                    </Link>
                  </Button>

                  {detailData.status === "submitted" && (
                    <>
                      <Button
                        size="sm"
                        disabled={isPending}
                        onClick={() => handleStatusUpdate("approved")}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Goedkeuren
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={isPending}
                        onClick={() => handleStatusUpdate("rejected")}
                        className="gap-1"
                      >
                        <XCircle className="w-4 h-4" />
                        Afwijzen
                      </Button>
                    </>
                  )}

                  {detailData.booking.paymentStatus === "unpaid" && (
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={isPending}
                      onClick={() => handleSendReminder("deposit")}
                      className="gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Stuur herinnering aanbetaling (25%)
                    </Button>
                  )}

                  {detailData.booking.paymentStatus === "deposit_paid" && (
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={isPending}
                      onClick={() => handleSendReminder("balance")}
                      className="gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Stuur herinnering restant (75%)
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  )
}
