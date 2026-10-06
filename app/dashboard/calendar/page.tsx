import { DashboardLayout } from "@/components/dashboard-layout"
import { CalendarView } from "@/components/dashboard/calendar-view"
import { getCalendarBookings } from "@/app/actions/bookings"

export const dynamic = "force-dynamic"

export default async function CalendarPage() {
  const bookings = await getCalendarBookings()

  return (
    <DashboardLayout>
      <CalendarView bookings={bookings} />
    </DashboardLayout>
  )
}
