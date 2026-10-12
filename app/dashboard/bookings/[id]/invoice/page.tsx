import { notFound, redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { InvoiceFlow } from "@/components/invoicing/invoice-flow"
import { getInvoiceContext } from "@/app/actions/invoices"
import { getBooking } from "@/app/actions/bookings"

export const dynamic = "force-dynamic"

export default async function BookingInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const bookingId = Number.parseInt(id, 10)
  if (!Number.isFinite(bookingId)) notFound()

  const context = await getInvoiceContext(bookingId)
  if (!context) {
    // Only completed bookings can be invoiced; send everything else back to its detail page.
    const booking = await getBooking(bookingId)
    if (!booking) notFound()
    redirect(`/dashboard/bookings/${bookingId}`)
  }

  return (
    <DashboardLayout>
      <InvoiceFlow context={context} />
    </DashboardLayout>
  )
}
