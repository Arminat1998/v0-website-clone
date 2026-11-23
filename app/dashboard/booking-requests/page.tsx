import { DashboardLayout } from "@/components/dashboard-layout"
import { BookingList } from "@/components/dashboard/booking-list"
import { getBookingsByStatus } from "@/app/actions/bookings"

export const dynamic = "force-dynamic"

export default async function BookingRequestsPage() {
  const bookings = await getBookingsByStatus(["pending", "rejected", "cancelled"])

  return (
    <DashboardLayout>
      <BookingList variant="requests" bookings={bookings} />
    </DashboardLayout>
  )
}
