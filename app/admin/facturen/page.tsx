import { getAdminFinancialKpis, listAdminInvoices } from "@/app/actions/admin-invoices"
import { InvoiceKpis } from "@/components/admin/invoices/invoice-kpis"
import { InvoicesTable } from "@/components/admin/invoices/invoices-table"
import { requireAdmin } from "@/lib/session"

export const dynamic = "force-dynamic"

export default async function AdminInvoicesPage() {
  await requireAdmin()

  const [kpis, invoiceResult] = await Promise.all([
    getAdminFinancialKpis(),
    listAdminInvoices({ pageSize: 50 }),
  ])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Facturen & Financieel Beheer</h1>
        <p className="text-sm text-muted-foreground">
          Overzicht van alle gegenereerde self-billing facturen, geüploade artiestfacturen, betalingen en openstaande vorderingen.
        </p>
      </div>

      {/* Financial KPIs Overview */}
      <InvoiceKpis kpis={kpis} />

      {/* Invoices List & Management */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Facturenoverzicht</h2>
          <span className="text-xs text-muted-foreground">{invoiceResult.totalCount} facturen geregistreerd</span>
        </div>
        <InvoicesTable initialItems={invoiceResult.items} totalCount={invoiceResult.totalCount} />
      </div>
    </div>
  )
}
