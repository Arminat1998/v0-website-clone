import type { Booking, BookingStatus } from "@/lib/db/schema"
import { todayIso } from "@/lib/bookings/format"

/** What people see: an open request whose date has passed is over, although its status never changed. */
export type DisplayStatus = BookingStatus | "expired"

export function displayStatus(booking: Pick<Booking, "status" | "eventDate">): DisplayStatus {
  return booking.status === "pending" && booking.eventDate < todayIso() ? "expired" : booking.status
}
