"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AccountHeading, AccountEmpty, euro } from "./account-common";
import {
  markCustomerNotificationsRead,
  type CustomerNotice,
} from "@/app/actions/customer";
import { cn } from "@/lib/utils";

/** What happened, in one sentence what it means, and where to go next. */
function noticeText(notice: CustomerNotice, nl: boolean) {
  const { professionalName: name, dueCents } = notice;
  const amount = euro(dueCents, nl);
  switch (notice.kind) {
    case "pending":
      return {
        title: nl ? "Aanvraag verstuurd" : "Request sent",
        body: nl ? `${name} heeft je aanvraag ontvangen.` : `${name} has received your request.`,
      };
    case "accepted":
      return {
        title: nl ? "Geaccepteerd" : "Accepted",
        body:
          dueCents > 0
            ? nl
              ? `${name} heeft je aanvraag geaccepteerd. Betaal ${amount} om verder te gaan.`
              : `${name} accepted your request. Pay ${amount} to continue.`
            : nl
              ? `${name} heeft je aanvraag geaccepteerd.`
              : `${name} accepted your request.`,
      };
    case "rejected":
      return {
        title: nl ? "Afgewezen" : "Declined",
        body: nl
          ? `${name} kan je aanvraag niet aannemen. Bekijk de reactie en zoek verder naar een andere professional.`
          : `${name} cannot take your request. Read the response and look for another professional.`,
      };
    case "cancelled":
      return {
        title: nl ? "Geannuleerd" : "Cancelled",
        body: nl ? "Deze boeking gaat niet door." : "This booking will not take place.",
      };
    case "completed":
      return {
        title: nl ? "Afgerond" : "Completed",
        body:
          dueCents > 0
            ? nl
              ? `Er staat nog ${amount} open. Bekijk je boeking om te betalen.`
              : `${amount} is still due. Open your booking to pay.`
            : nl
              ? "Het optreden is afgerond. Bekijk je boeking of schrijf een review."
              : "The event is completed. View your booking or write a review.",
      };
    case "deposit_received":
      return {
        title: nl ? "Aanbetaling ontvangen, boeking definitief" : "Deposit received, booking final",
        body: nl
          ? "Je hoeft nu niets te doen. De factuur volgt na het optreden."
          : "There is nothing to do now. The invoice follows after the event.",
      };
    case "invoice_ready":
      return {
        title:
          dueCents > 0
            ? nl
              ? `Factuur klaar: ${amount} te betalen`
              : `Invoice ready: ${amount} to pay`
            : nl
              ? "Factuur klaar"
              : "Invoice ready",
        body:
          dueCents > 0
            ? nl
              ? "Open de betaalkaart en maak het bedrag over."
              : "Open the payment card and transfer the amount."
            : nl
              ? "Er staat niets meer open. Bekijk de factuur bij je boeking."
              : "Nothing is due anymore. View the invoice with your booking.",
      };
    case "payment_received":
      return {
        title: nl ? "Betaling ontvangen" : "Payment received",
        body: nl
          ? "De factuur is volledig betaald. Je hoeft niets meer te doen."
          : "The invoice is fully paid. There is nothing left to do.",
      };
  }
}

/** A notification that opens its booking, and is read once it is opened. */
export function NoticeLink({ notice, className }: { notice: CustomerNotice; className?: string }) {
  const nl = useLanguage().language === "nl";
  const router = useRouter();
  const { title, body } = noticeText(notice, nl);
  const toPayment = notice.dueCents > 0 && notice.kind !== "rejected" && notice.kind !== "cancelled";

  function open() {
    if (notice.read) return;
    // Opening the booking may not wait for this; a failure leaves the notification unread.
    markCustomerNotificationsRead(notice.id).then(() => router.refresh(), () => {});
  }

  return (
    <Link
      href={`/account/boekingen/${notice.bookingId}${toPayment ? "#betaling" : ""}`}
      onClick={open}
      className={cn("flex flex-col gap-2", className)}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge
          variant={notice.read ? "secondary" : "default"}
          className="h-auto max-w-full whitespace-normal text-left"
        >
          {title}
        </Badge>
        {!notice.read && (
          <span className="text-sm font-medium text-brand">
            {nl ? "Nieuw" : "New"}
          </span>
        )}
      </div>
      <p className="font-medium">{notice.eventName}</p>
      <p className="text-sm">{body}</p>
      <p className="text-sm text-muted-foreground">
        {notice.professionalName} ·{" "}
        {new Date(notice.createdAt).toLocaleString(nl ? "nl-NL" : "en-GB", {
          dateStyle: "medium",
          timeStyle: "short",
        })}
      </p>
    </Link>
  );
}

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
                    <NoticeLink notice={notice} className="min-w-0 flex-1 basis-64" />
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
                  ? "Je krijgt hier een melding als een professional reageert, je factuur klaar is of je betaling is ontvangen."
                  : "You get a notification here when a professional responds, your invoice is ready or your payment has been received."
              }
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
