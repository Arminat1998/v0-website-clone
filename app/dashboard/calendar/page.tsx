import { DashboardLayout } from "@/components/dashboard-layout"
import { CalendarView } from "@/components/dashboard/calendar-view"
import { getMyUnavailableDates } from "@/app/actions/availability"
import { getCalendarBookings } from "@/app/actions/bookings"

export const dynamic = "force-dynamic"

export default async function CalendarPage() {
  const [bookings, unavailableDates] = await Promise.all([getCalendarBookings(), getMyUnavailableDates()])

  return (
    <DashboardLayout>
      <CalendarView bookings={bookings} unavailableDates={unavailableDates} />
    </DashboardLayout>
  )
}
