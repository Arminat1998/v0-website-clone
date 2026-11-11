import type { Metadata } from "next";
import { requireCustomerUser } from "@/lib/session";
import { getCustomerUnreadCount } from "@/app/actions/customer";
import { AccountShell } from "@/components/account/account-shell";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Mijn account | ARSI Events",
  description: "Beheer je boekingen, favorieten en gegevens bij ARSI Events.",
  robots: { index: false, follow: false },
};

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireCustomerUser();
  const unread = await getCustomerUnreadCount();
  return (
    <AccountShell name={user.name} email={user.email} unread={unread}>
      {children}
    </AccountShell>
  );
}
