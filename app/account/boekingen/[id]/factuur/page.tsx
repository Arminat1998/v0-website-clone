import { notFound } from "next/navigation"
import { getCustomerInvoiceDocument } from "@/app/actions/customer"
import { InvoiceDocument } from "@/components/invoicing/invoice-document"
import { PrintToolbar } from "@/components/invoicing/print-toolbar"
import { requireCustomerUser } from "@/lib/session"

export const dynamic = "force-dynamic"

export default async function CustomerInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  await requireCustomerUser()
  const { id } = await params
  const bookingId = Number.parseInt(id, 10)
  if (!Number.isFinite(bookingId)) notFound()

  const found = await getCustomerInvoiceDocument(bookingId)
  if (!found) notFound()
  const { booking, profile, invoice } = found

  return (
    <div className="min-h-screen bg-paper-border pb-8 print:bg-paper">
      <PrintToolbar backHref={`/account/boekingen/${id}`} />
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
