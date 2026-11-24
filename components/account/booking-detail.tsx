"use client";

import { Fragment, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CalendarDays, CalendarX2, Clock3, MapPin, Star, XCircle } from "lucide-react";
import { MessageButton } from "@/components/chat/message-button";
import { useLanguage } from "@/contexts/language-context";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { cancelBookingRequest } from "@/app/actions/customer";
import { Separator } from "@/components/ui/separator";
import { AccountHeading, BookingBadge, eventDate } from "./account-common";
import { BookingPayment } from "./booking-payment";
import { FavoriteButton } from "./favorite-button";
import { ReplacementSuggestions } from "./replacement-suggestions";
import { BookingAudio } from "@/components/booking/booking-audio";
import { audioDisplayName, hasAudioFile, type AudioKind } from "@/lib/bookings/audio";
import { equipmentLabel } from "@/lib/bookings/pricing";
import { canonicalEventType, canonicalGenre, eventTypeLabel, genreLabel } from "@/lib/profile-options";
import { displayStatus } from "@/lib/bookings/display-status";
import type { CustomerBookingDetail } from "@/app/actions/customer";
import type { BankDetails, CustomerInvoice } from "@/lib/bookings/payments";
import { BOOKING_TIME_ZONE, todayIso } from "@/lib/bookings/format";

export function AccountBookingDetail({
  booking: b,
  invoice,
  bank,
  reviewToken,
  reviewDone,
}: {
  booking: CustomerBookingDetail;
  invoice: CustomerInvoice | null;
  bank: BankDetails | null;
  reviewToken?: string | null;
  reviewDone?: boolean;
}) {
  const nl = useLanguage().language === "nl";
  const router = useRouter();
  const { toast } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cancelling, startCancel] = useTransition();
  function cancelRequest() {
    startCancel(async () => {
      let ok = false;
      try {
        ok = (await cancelBookingRequest(b.id)).ok;
      } catch {
        ok = false;
      }
      setConfirmOpen(false);
      if (ok) {
        toast({ title: nl ? "Aanvraag geannuleerd" : "Request cancelled" });
        router.refresh();
      } else {
        toast({
          title: nl ? "Annuleren is niet gelukt" : "Could not cancel",
          description: nl
            ? "De aanvraag is al beantwoord of niet meer open."
            : "The request has already been answered or is no longer open.",
          variant: "destructive",
        });
        router.refresh();
      }
    });
  }
  function detail(label: string, value: string | number | null) {
    return (
      <div className="flex flex-col gap-1">
        <dt className="text-sm text-muted-foreground">{label}</dt>
        <dd className="whitespace-pre-wrap break-words text-sm leading-relaxed">
          {value || (nl ? "Niet opgegeven" : "Not provided")}
        </dd>
      </div>
    );
  }
  function song(
    label: string,
    kind: AudioKind,
    link?: string | null,
    stored?: string | null,
  ) {
    if (!link && !stored) return null;
    return (
      <div className="flex min-w-0 flex-col gap-1">
        <dt className="text-sm text-muted-foreground">{label}</dt>
        <dd className="min-w-0 break-words text-sm leading-relaxed">
          {link ? (
            /^https?:\/\//i.test(link) ? (
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center break-all text-red-700 underline-offset-4 hover:underline dark:text-red-400"
              >
                {link}
              </a>
            ) : (
              link
            )
          ) : stored && hasAudioFile(stored) ? (
            <BookingAudio bookingId={b.id} kind={kind} stored={stored} />
          ) : (
            stored && audioDisplayName(stored)
          )}
        </dd>
      </div>
    );
  }
  // Only what the customer filled in is listed; the empty fields are named once on a single line.
  const eventFields = (() => {
    const location = [
      [b.street, b.houseNumber, b.houseNumberExt].filter(Boolean).join(" "),
      [b.postalCode, b.city].filter(Boolean).join(" "),
      b.country,
    ]
      .filter(Boolean)
      .join(", ");
    const short: [string, string | number | null][] = [
      [nl ? "Locatie" : "Location", location],
      [nl ? "Type evenement" : "Event type", b.eventTypes.map((type) => eventTypeLabel(canonicalEventType(type), nl)).join(", ")],
      [nl ? "Aantal gasten" : "Guests", b.capacity],
      ["Dresscode", b.dressCode],
      [nl ? "Muziekgenres" : "Music genres", b.musicGenres.map((genre) => genreLabel(canonicalGenre(genre), nl)).join(", ")],
      [nl ? "Apparatuur" : "Equipment", b.equipment.map(equipmentLabel).join(", ")],
    ];
    const longer: [string, string | number | null][] = [
      [nl ? "Omschrijving" : "Description", b.description],
      [nl ? "Speciale wensen" : "Special requests", b.specialRequests],
    ];
    const isFilled = ([, value]: [string, string | number | null]) => Boolean(value);
    return {
      filled: short.filter(isFilled),
      long: longer.filter(isFilled),
      missing: [...short, ...longer].filter((field) => !isFilled(field)).map(([label]) => label.toLowerCase()),
    };
  })();
  const status = displayStatus(b);
  const closed = status === "rejected" || status === "cancelled" || status === "expired";
  const hasMusic =
    b.openingDanceLink || b.openingDanceFileName || b.lastSongLink || b.lastSongFileName;
  return (
    <div className="flex flex-col gap-6">
      <Button variant="ghost" asChild className="-ml-3 min-h-11 self-start">
        <Link href="/account/boekingen">
          <ArrowLeft />
          {nl ? "Alle boekingen" : "All bookings"}
        </Link>
      </Button>
      <AccountHeading
        title={b.eventName}
        description={`${nl ? "Boeking" : "Booking"} #${b.id} · ${b.professionalName} · ${nl ? "aangevraagd op" : "requested on"} ${new Date(b.createdAt).toLocaleDateString(nl ? "nl-NL" : "en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: BOOKING_TIME_ZONE })}`}
        // On a phone the banner below already says the booking is closed, so the badge would only repeat it
        action={<span className={closed ? "hidden sm:block" : undefined}><BookingBadge status={status} /></span>}
      />
      {closed && (
        <section
          aria-labelledby="closed-title"
          className="flex gap-3 rounded-xl border border-border bg-muted/40 p-4 sm:p-5"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-background text-brand" aria-hidden="true">
            <CalendarX2 className="size-5" />
          </span>
          <div className="flex min-w-0 flex-col gap-1">
            <h2 id="closed-title" className="font-semibold leading-snug text-foreground">
              {status === "expired"
                ? nl ? "De datum van deze aanvraag is verstreken" : "The date of this request has passed"
                : status === "rejected"
                  ? nl ? "Deze aanvraag is afgewezen" : "This request was declined"
                  : nl ? "Deze boeking gaat niet door" : "This booking will not take place"}
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {b.paymentStatus === "unpaid" && (nl ? "Je hoeft niets te betalen. " : "You do not have to pay anything. ")}
              {nl ? "Hieronder vind je vergelijkbare professionals; je wensen gaan mee." : "Below you find similar professionals; your wishes come along."}
            </p>
            <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-foreground">
              <span className="flex items-center gap-1.5">
                <CalendarDays className="size-4 text-muted-foreground" aria-hidden="true" />
                {eventDate(b.eventDate, nl)}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock3 className="size-4 text-muted-foreground" aria-hidden="true" />
                {b.startTime} – {b.endTime}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="size-4 text-muted-foreground" aria-hidden="true" />
                {b.city}
              </span>
            </p>
          </div>
        </section>
      )}
      {(b.responseMessage || b.rejectionReason) && (
        <Alert>
          <AlertTitle>
            {nl
              ? "Reactie van de professional"
              : "Response from the professional"}
          </AlertTitle>
          <AlertDescription className="whitespace-pre-wrap">
            {b.status === "rejected" ? b.rejectionReason : b.responseMessage}
          </AlertDescription>
        </Alert>
      )}
      <div className="grid items-start gap-6 lg:grid-cols-[1.6fr_1fr] lg:grid-rows-[auto_1fr]">
        {/* On mobile the payment comes first (what the customer has to act on), then the replacement card when the booking is closed */}
        {(!closed || b.paymentStatus !== "unpaid") && (
          <div className="min-w-0 lg:col-start-2 lg:row-start-1">
            <BookingPayment booking={b} invoice={invoice} bank={bank} />
          </div>
        )}
        <div className={`flex min-w-0 flex-col gap-6 lg:order-none lg:col-start-1 lg:row-span-2 lg:row-start-1${closed ? " order-3" : ""}`}>
          <Card>
            <CardHeader>
              <CardTitle>
              <h2>{nl ? "Jouw evenement" : "Your event"}</h2>
            </CardTitle>
              <CardDescription>
                {nl
                  ? "De gegevens zoals je ze hebt aangevraagd."
                  : "The details as you requested them."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-6">
                {!closed && (<>
                <div className="flex flex-wrap gap-5 text-sm">
                  <span className="flex items-center gap-2">
                    <CalendarDays className="size-4 text-brand" />
                    {eventDate(b.eventDate, nl)}
                  </span>
                  <span className="flex items-center gap-2">
                    <Clock3 className="size-4 text-brand" />
                    {b.startTime} – {b.endTime}
                    {b.endTime <= b.startTime && (
                      <span className="text-muted-foreground">{nl ? "(+1 dag)" : "(+1 day)"}</span>
                    )}
                  </span>
                  <span className="flex items-center gap-2">
                    <MapPin className="size-4 text-brand" />
                    {b.city}
                  </span>
                </div>
                <Separator />
                </>)}
                <dl className="grid grid-cols-2 gap-x-4 gap-y-5">
                  {eventFields.filled.map(([label, value]) => (
                    <Fragment key={label}>{detail(label, value)}</Fragment>
                  ))}
                </dl>
                {hasMusic && (
                  <dl className="grid gap-5 sm:grid-cols-2">
                    {song(
                      nl ? "Openingsdans" : "Opening dance",
                      "opening-dance",
                      b.openingDanceLink,
                      b.openingDanceFileName,
                    )}
                    {song(
                      nl ? "Laatste nummer" : "Last song",
                      "last-song",
                      b.lastSongLink,
                      b.lastSongFileName,
                    )}
                  </dl>
                )}
                {eventFields.long.length > 0 && (
                  <dl className="flex flex-col gap-5">
                    {eventFields.long.map(([label, value]) => (
                      <Fragment key={label}>{detail(label, value)}</Fragment>
                    ))}
                  </dl>
                )}
                {eventFields.missing.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">{nl ? "Niet ingevuld:" : "Not provided:"}</span>{" "}
                    {eventFields.missing.join(", ")}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>
              <h2>{nl
                  ? "Contact- en factuurgegevens"
                  : "Contact and billing details"}</h2>
            </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-5 sm:grid-cols-2">
                {detail(nl ? "Naam" : "Name", `${b.firstName} ${b.lastName}`)}
                {detail(nl ? "E-mailadres" : "Email", b.email)}
                {detail(nl ? "Telefoon" : "Phone", b.phone)}
                {b.customerType === "business" &&
                  detail(nl ? "Bedrijf" : "Company", b.companyName)}
                {detail(
                  nl ? "Factuuradres" : "Billing address",
                  [
                    b.billingStreet,
                    b.billingHouseNumber,
                    b.billingPostalCode,
                    b.billingCity,
                    b.billingCountry,
                  ]
                    .filter(Boolean)
                    .join(" "),
                )}
                {b.vatNumber &&
                  detail(nl ? "Btw-nummer" : "VAT number", b.vatNumber)}
              </dl>
            </CardContent>
          </Card>
        </div>
        {/* Without a payment card (closed and nothing paid) this column starts at the top on desktop */}
        <div className={`flex min-w-0 flex-col gap-6 lg:order-none lg:col-start-2 ${closed && b.paymentStatus === "unpaid" ? "lg:row-start-1" : "lg:row-start-2"}${closed ? " order-2" : ""}`}>
          {closed && (
            <ReplacementSuggestions
              bookingId={b.id}
              professionalName={b.professionalName}
              datePassed={status === "expired" || b.eventDate < todayIso()}
              browseHref={b.professionalType === "photographer" ? "/photo-video" : "/artiesten"}
            />
          )}
          <Card>
            <CardHeader>
              <CardTitle>
              <h2>{b.professionalName}</h2>
            </CardTitle>
              <CardDescription>
                {closed
                  ? nl
                    ? "Toch liever deze professional? Vraag een andere datum aan of stuur een bericht."
                    : "Still prefer this professional? Request another date or send a message."
                  : nl
                      ? "Stel je vragen of stem details af via de chat."
                      : "Ask questions or align details via chat."}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {reviewToken && (
                <Button variant="brand" asChild>
                  <Link href={`/review/${reviewToken}`}>
                    <Star />
                    {reviewDone
                      ? nl ? "Bekijk je review" : "View your review"
                      : nl ? "Review schrijven" : "Write a review"}
                  </Link>
                </Button>
              )}
              {(status === "expired" || status === "cancelled" || status === "rejected") && (
                <Button variant="outline" asChild className="min-h-11 h-auto whitespace-normal py-2 text-center">
                  <Link
                    href={`/booking?${
                      b.professionalType === "photographer"
                        ? `professionalId=${encodeURIComponent(b.professionalId)}&type=photographer`
                        : `artistId=${encodeURIComponent(b.professionalId)}`
                    }&fromBookingId=${b.id}&newDate=1`}
                  >
                    {nl ? `Vraag ${b.professionalName} aan voor een andere datum` : `Request ${b.professionalName} for another date`}
                  </Link>
                </Button>
              )}
              {status === "pending" && (
                <p className="text-sm text-muted-foreground">
                  {nl ? "De professional reageert meestal binnen 48 uur." : "The professional usually replies within 48 hours."}
                </p>
              )}
              <MessageButton
                // While the customer still has to pay, the payment card holds the main action
                variant={closed || reviewToken || b.status === "accepted" ? "outline" : "brand"}
                professionalId={b.professionalId}
                label={nl ? "Stuur een bericht" : "Send a message"}
              />
              {status === "pending" && (
                <Button
                  variant="outline"
                  className="min-h-11"
                  onClick={() => setConfirmOpen(true)}
                >
                  <XCircle />
                  {nl ? "Aanvraag annuleren" : "Cancel request"}
                </Button>
              )}
              <FavoriteButton
                professionalId={b.professionalId}
                professionalType={
                  b.professionalType === "photographer"
                    ? "photographer"
                    : "artist"
                }
              />
            </CardContent>
          </Card>
        </div>
      </div>
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {nl ? "Aanvraag annuleren?" : "Cancel this request?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {nl
                ? `Je aanvraag "${b.eventName}" bij ${b.professionalName} wordt ingetrokken. Dit kun je niet ongedaan maken.`
                : `Your request "${b.eventName}" with ${b.professionalName} will be withdrawn. This cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>
              {nl ? "Nee, behouden" : "No, keep it"}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={cancelling}
              onClick={(e) => {
                e.preventDefault();
                cancelRequest();
              }}
            >
              {cancelling
                ? nl ? "Bezig..." : "Cancelling..."
                : nl ? "Ja, annuleren" : "Yes, cancel"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
