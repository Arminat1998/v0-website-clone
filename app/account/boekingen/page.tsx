import { requireCustomerUser } from "@/lib/session";
import { getMyBookings } from "@/app/actions/bookings";
import { AccountBookingList } from "@/components/account/booking-list";

export default async function CustomerBookingsPage() {
  await requireCustomerUser();
  return <AccountBookingList bookings={await getMyBookings()} />;
}
