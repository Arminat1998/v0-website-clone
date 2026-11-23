"use client";

import Link from "next/link";
import { ArrowLeft, CalendarDays, Clock3, MapPin, Star } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
import { AccountHeading, BookingBadge, eventDate } from "./account-common";
import { BookingPayment } from "./booking-payment";
import { FavoriteButton } from "./favorite-button";
import { BookingAudio } from "@/components/booking/booking-audio";
import { audioDisplayName, hasAudioFile, type AudioKind } from "@/lib/bookings/audio";
import { equipmentLabel } from "@/lib/bookings/pricing";
import { canonicalEventType, canonicalGenre, eventTypeLabel, genreLabel } from "@/lib/profile-options";
import { displayStatus } from "@/lib/bookings/display-status";
import type { CustomerBookingDetail } from "@/app/actions/customer";
import type { BankDetails, CustomerInvoice } from "@/lib/bookings/payments";

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
  const status = displayStatus(b);
  const closed = status === "rejected" || status === "cancelled" || status === "expired";
  const hasMusic =
    b.openingDanceLink || b.openingDanceFileName || b.lastSongLink || b.lastSongFileName;
  return (
    <div className="flex flex-col gap-6">
      <Button variant="ghost" asChild className="self-start">
        <Link href="/account/boekingen">
          <ArrowLeft />
          {nl ? "Alle boekingen" : "All bookings"}
        </Link>
      </Button>
      <AccountHeading
        title={b.eventName}
        description={`${nl ? "Boeking" : "Booking"} #${b.id} · ${b.professionalName}`}
        action={<BookingBadge status={status} />}
      />
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
      <div className="grid items-start gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="flex flex-col gap-6">
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
                <div className="flex flex-wrap gap-5 text-sm">
                  <span className="flex items-center gap-2">
                    <CalendarDays className="size-4 text-brand" />
                    {eventDate(b.eventDate, nl)}
                  </span>
                  <span className="flex items-center gap-2">
                    <Clock3 className="size-4 text-brand" />
                    {b.startTime} – {b.endTime}
                  </span>
                  <span className="flex items-center gap-2">
                    <MapPin className="size-4 text-brand" />
                    {b.city}
                  </span>
                </div>
                <Separator />
                <dl className="grid gap-5 sm:grid-cols-2">
                  {detail(
                    nl ? "Locatie" : "Location",
                    [
                      b.street,
                      b.houseNumber,
                      b.houseNumberExt,
                      b.postalCode,
                      b.city,
                      b.country,
                    ]
                      .filter(Boolean)
                      .join(" "),
                  )}
                  {detail(
                    nl ? "Type evenement" : "Event type",
                    b.eventTypes
                      .map((type) => eventTypeLabel(canonicalEventType(type), nl))
                      .join(", "),
                  )}
                  {detail(nl ? "Aantal gasten" : "Guests", b.capacity)}
                  {detail("Dresscode", b.dressCode)}
                  {detail(
                    nl ? "Muziekgenres" : "Music genres",
                    b.musicGenres.map((genre) => genreLabel(canonicalGenre(genre), nl)).join(", "),
                  )}
                  {detail(
                    nl ? "Apparatuur" : "Equipment",
                    b.equipment.map(equipmentLabel).join(", "),
                  )}
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
                <dl className="flex flex-col gap-5">
                  {detail(nl ? "Omschrijving" : "Description", b.description)}
                  {detail(
                    nl ? "Speciale wensen" : "Special requests",
                    b.specialRequests,
                  )}
                </dl>
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
        <div className="flex flex-col gap-6">
          <BookingPayment booking={b} invoice={invoice} bank={bank} />
          <Card>
            <CardHeader>
              <CardTitle>
              <h2>{b.professionalName}</h2>
            </CardTitle>
              <CardDescription>
                {status === "expired"
                  ? nl
                    ? "De datum van deze aanvraag is verstreken. Bekijk welke andere professionals bij je evenement passen."
                    : "The date of this request has passed. See which other professionals suit your event."
                  : closed
                  ? nl
                    ? "Deze boeking gaat niet door. Bekijk welke andere professionals bij je evenement passen."
                    : "This booking will not take place. See which other professionals suit your event."
                  : nl
                    ? "Stel je vragen of stem details af via de chat."
                    : "Ask questions or align details via chat."}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {reviewToken && (
                <Button asChild>
                  <Link href={`/review/${reviewToken}`}>
                    <Star />
                    {reviewDone
                      ? nl ? "Bekijk je review" : "View your review"
                      : nl ? "Review schrijven" : "Write a review"}
                  </Link>
                </Button>
              )}
              {closed && (
                <Button asChild className="min-h-11">
                  <Link href={b.professionalType === "photographer" ? "/photo-video" : "/artiesten"}>
                    {nl ? "Andere professionals bekijken" : "See other professionals"}
                  </Link>
                </Button>
              )}
              <MessageButton
                variant={closed || reviewToken ? "outline" : "default"}
                professionalId={b.professionalId}
                label={nl ? "Stuur een bericht" : "Send a message"}
              />
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
          <p className="text-sm text-muted-foreground">
            {nl ? "Aangevraagd op" : "Requested on"}{" "}
            {new Date(b.createdAt).toLocaleDateString(nl ? "nl-NL" : "en-GB")}
          </p>
        </div>
      </div>
    </div>
  );
}
