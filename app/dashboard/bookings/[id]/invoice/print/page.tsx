import { notFound } from "next/navigation"
import { getInvoiceContext } from "@/app/actions/invoices"
import { InvoiceDocument } from "@/components/invoicing/invoice-document"
import { PrintToolbar } from "@/components/invoicing/print-toolbar"

export const dynamic = "force-dynamic"

export default async function InvoicePrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const bookingId = Number.parseInt(id, 10)
  if (!Number.isFinite(bookingId)) notFound()

  const context = await getInvoiceContext(bookingId)
  if (!context?.invoice) notFound()
  const { booking, profile, invoice } = context

  return (
    <div className="min-h-screen bg-paper-border print:bg-paper">
      <PrintToolbar bookingId={bookingId} />
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
