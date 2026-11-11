import { notFound } from "next/navigation";
import { getCustomerBooking } from "@/app/actions/customer";
import { requireCustomerUser } from "@/lib/session";
import { AccountBookingDetail } from "@/components/account/booking-detail";

export default async function BookingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireCustomerUser();
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const booking = await getCustomerBooking(Number(id));
  if (!booking) notFound();
  return <AccountBookingDetail booking={booking} />;
}
