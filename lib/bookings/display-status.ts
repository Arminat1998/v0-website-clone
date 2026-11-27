import type { Booking, BookingStatus } from "@/lib/db/schema"
import { todayIso } from "@/lib/bookings/format"

/** What people see: an open request whose date has passed is over, although its status never changed. */
export type DisplayStatus = BookingStatus | "confirmed" | "expired"

export function displayStatus(
  booking: Pick<Booking, "status" | "eventDate"> & { paymentStatus?: string | null },
): DisplayStatus {
  if (booking.status === "pending" && booking.eventDate < todayIso()) return "expired"
  if (
    booking.status === "accepted" &&
    (booking.paymentStatus === "deposit_paid" || booking.paymentStatus === "paid")
  ) {
    return "confirmed"
  }
  return booking.status
}
