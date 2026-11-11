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
import { AccountReviews } from "@/components/account/my-reviews";
import { AccountMessages } from "@/components/account/messages";
import { getInbox } from "@/app/actions/messages";
import { getMyReviews } from "@/app/actions/reviews";

export default async function AccountSection({
  params,
  searchParams,
}: {
  params: Promise<{ section: string }>;
  searchParams: Promise<{ c?: string }>;
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
    case "berichten": {
      const c = Number((await searchParams).c);
      return (
        <AccountMessages
          inbox={await getInbox()}
          initialId={Number.isSafeInteger(c) && c > 0 ? c : undefined}
        />
      );
    }
    case "reviews":
      return <AccountReviews reviews={await getMyReviews()} />;
    case "profiel":
      return <AccountProfileForm profile={await getCustomerProfile()} />;
    default:
      notFound();
  }
}
