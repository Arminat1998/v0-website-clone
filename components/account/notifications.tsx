"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AccountHeading, AccountEmpty, BookingBadge } from "./account-common";
import {
  markCustomerNotificationsRead,
  type CustomerNotice,
} from "@/app/actions/customer";
import { cn } from "@/lib/utils";

export function AccountNotifications({
  notices,
}: {
  notices: CustomerNotice[];
}) {
  const nl = useLanguage().language === "nl";
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function markRead(id?: number) {
    setBusy(true);
    setError("");
    try {
      await markCustomerNotificationsRead(id);
      router.refresh();
    } catch {
      setError(
        nl
          ? "Bijwerken is niet gelukt. Probeer opnieuw."
          : "Could not update. Try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="flex flex-col gap-8">
      <AccountHeading
        title={nl ? "Meldingen" : "Notifications"}
        description={
          nl
            ? "Reacties en statusupdates van je boekingen. Je ziet de laatste 100 meldingen."
            : "Responses and booking updates. Showing your latest 100 notifications."
        }
        action={
          <Button
            variant="outline"
            disabled={busy || !notices.some((n) => !n.read)}
            onClick={() => markRead()}
          >
            {busy ? <Loader2 className="animate-spin" /> : <CheckCheck />}
            {nl ? "Alles als gelezen" : "Mark all as read"}
          </Button>
        }
      />
      {error && (
        <p role="alert" className="text-sm text-red-700 dark:text-red-400">
          {error}
        </p>
      )}
      <Card>
        <CardContent>
          {notices.length ? (
            <div className="divide-y">
              {notices.map((notice) => (
                <article
                  key={notice.id}
                  className={cn(
                    "rounded-lg px-3 py-5",
                    !notice.read && "bg-brand/5",
                  )}
                >
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <Link
                      href={`/account/boekingen/${notice.bookingId}`}
                      className="flex flex-col gap-2"
                    >
                      <div className="flex items-center gap-2">
                        <BookingBadge status={notice.status} />
                        {!notice.read && (
                          <span className="text-sm font-medium text-brand">
                            {nl ? "Nieuw" : "New"}
                          </span>
                        )}
                      </div>
                      <p className="font-medium">{notice.eventName}</p>
                      <p className="text-sm text-muted-foreground">
                        {notice.professionalName} ·{" "}
                        {new Date(notice.createdAt).toLocaleString(
                          nl ? "nl-NL" : "en-GB",
                          { dateStyle: "medium", timeStyle: "short" },
                        )}
                      </p>
                    </Link>
                    {!notice.read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={busy}
                        onClick={() => markRead(notice.id)}
                      >
                        {nl ? "Markeer als gelezen" : "Mark as read"}
                      </Button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <AccountEmpty
              icon={Bell}
              title={nl ? "Nog geen meldingen" : "No notifications yet"}
              description={
                nl
                  ? "Je ontvangt hier automatisch een update wanneer je een aanvraag verstuurt of de status verandert."
                  : "You will receive an update here when you send a request or its status changes."
              }
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
