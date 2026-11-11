import { notFound } from "next/navigation";
import { requireCustomerUser } from "@/lib/session";
import { getMyBookings } from "@/app/actions/bookings";
import {
  getCustomerFavorites,
  getCustomerNotifications,
  getCustomerProfile,
} from "@/app/actions/customer";
import { AccountBookingList } from "@/components/account/booking-list";
import { AccountFavorites } from "@/components/account/favorites";
import { AccountNotifications } from "@/components/account/notifications";
import { AccountProfileForm } from "@/components/account/profile-form";

export default async function AccountSection({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  await requireCustomerUser();
  const { section } = await params;
  switch (section) {
    case "boekingen":
      return <AccountBookingList bookings={await getMyBookings()} />;
    case "favorieten":
      return <AccountFavorites favorites={await getCustomerFavorites()} />;
    case "meldingen":
      return (
        <AccountNotifications notices={await getCustomerNotifications()} />
      );
    case "profiel":
      return <AccountProfileForm profile={await getCustomerProfile()} />;
    default:
      notFound();
  }
}
