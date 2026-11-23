import { notFound } from "next/navigation"
import { getInvoiceForAdmin } from "@/app/actions/admin-payments"
import { InvoiceDocument } from "@/components/invoicing/invoice-document"
import { PrintToolbar } from "@/components/invoicing/print-toolbar"

export const dynamic = "force-dynamic"

export default async function AdminInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const found = await getInvoiceForAdmin(Number(id))
  if (!found) notFound()
  const { booking, profile, invoice } = found

  return (
    <div className="min-h-screen bg-paper-border pb-8 print:bg-paper">
      <PrintToolbar backHref="/admin/betalingen" />
      <main className="mx-auto max-w-[210mm] bg-paper shadow-lg print:shadow-none">
        <InvoiceDocument
          booking={booking}
          profile={profile}
          lines={invoice.lines}
          invoiceNumber={invoice.invoiceNumber}
          invoiceDate={invoice.invoiceDate}
          method={invoice.method}
        />
      </main>
    </div>
  )
}
