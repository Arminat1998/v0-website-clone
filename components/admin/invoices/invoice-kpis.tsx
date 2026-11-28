"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatEuro } from "@/lib/bookings/pricing"
import type { AdminFinancialKpis } from "@/app/actions/admin-invoices"
import { Banknote, FileCheck, Clock, AlertCircle, Percent, RotateCcw } from "lucide-react"

export function InvoiceKpis({ kpis }: { kpis: AdminFinancialKpis }) {
  const cards = [
    {
      title: "Totaal Gefactureerd",
      value: formatEuro(kpis.totalInvoicedCents),
      subtext: `${kpis.invoicesCount} facturen uitgebracht`,
      icon: FileCheck,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      title: "Ontvangen Betalingen",
      value: formatEuro(kpis.totalReceivedCents),
      subtext: "Aanbetalingen & restbedragen voldaan",
      icon: Banknote,
      color: "text-green-600 dark:text-green-400",
      bg: "bg-green-500/10",
    },
    {
      title: "Open Aanbetalingen (25%)",
      value: formatEuro(kpis.openDepositsCents),
      subtext: "Wacht op eerste betaling klant",
      icon: Clock,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-500/10",
    },
    {
      title: "Open Restantbedragen (75%)",
      value: formatEuro(kpis.openBalancesCents),
      subtext: "Opeisbaar voor/na evenement",
      icon: AlertCircle,
      color: "text-orange-600 dark:text-orange-400",
      bg: "bg-orange-500/10",
    },
    {
      title: "Platformcommissie",
      value: formatEuro(kpis.totalCommissionCents),
      subtext: "Gerealiseerde ARSI fee inkomsten",
      icon: Percent,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-500/10",
    },
    {
      title: "Terugbetalingen",
      value: formatEuro(kpis.totalRefundedCents),
      subtext: "Geannuleerd of gerestitueerd",
      icon: RotateCcw,
      color: "text-rose-600 dark:text-rose-400",
      bg: "bg-rose-500/10",
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <Card key={card.title} className="border-border/60 shadow-sm transition-all hover:border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
              <div className={`p-2 rounded-lg ${card.bg}`}>
                <Icon className={`w-4 h-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight tabular-nums text-foreground">{card.value}</div>
              <p className="mt-1 text-xs text-muted-foreground">{card.subtext}</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
