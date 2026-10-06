import { notFound } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { BookingDetail } from "@/components/dashboard/booking-detail"
import { getBooking } from "@/app/actions/bookings"

export const dynamic = "force-dynamic"

export default async function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const bookingId = Number.parseInt(id, 10)
  if (!Number.isFinite(bookingId)) notFound()

  const booking = await getBooking(bookingId)
  if (!booking) notFound()

  return (
    <DashboardLayout>
      <BookingDetail booking={booking} />
    </DashboardLayout>
  )
}
