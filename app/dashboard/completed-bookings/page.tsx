import { DashboardLayout } from "@/components/dashboard-layout"
import { BookingList } from "@/components/dashboard/booking-list"
import { getBookingsByStatus } from "@/app/actions/bookings"

export const dynamic = "force-dynamic"

export default async function CompletedBookingsPage() {
  const bookings = await getBookingsByStatus("completed")

  return (
    <DashboardLayout>
      <BookingList variant="completed" bookings={bookings} />
    </DashboardLayout>
  )
}
