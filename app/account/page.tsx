import { getMyBookings } from "@/app/actions/bookings";
import {
  getCustomerProfile,
  getFavoriteKeys,
  getCustomerNotifications,
  getCustomerUnreadCount,
} from "@/app/actions/customer";
import { requireCustomerUser } from "@/lib/session";
import { AccountOverview } from "@/components/account/account-overview";

export default async function AccountPage() {
  const user = await requireCustomerUser();
  const [bookings, favorites, notices, profile, unread] = await Promise.all([
    getMyBookings(),
    getFavoriteKeys(),
    getCustomerNotifications(),
    getCustomerProfile(),
    getCustomerUnreadCount(),
  ]);
  return (
    <AccountOverview
      name={profile.firstName || user.name}
      bookings={bookings}
      favoritesCount={favorites.length}
      unread={unread}
      notices={notices}
      profileReady={Boolean(
        profile.firstName && profile.lastName && profile.phone,
      )}
      today={new Date().toISOString().slice(0, 10)}
    />
  );
}
