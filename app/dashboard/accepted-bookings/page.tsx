import { DashboardLayout } from "@/components/dashboard-layout"
import { BookingList } from "@/components/dashboard/booking-list"
import { getBookingsByStatus } from "@/app/actions/bookings"

export const dynamic = "force-dynamic"

export default async function AcceptedBookingsPage() {
  const bookings = await getBookingsByStatus("accepted")

  return (
    <DashboardLayout>
      <BookingList variant="accepted" bookings={bookings} />
    </DashboardLayout>
  )
}
