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
import {
  AccountHeading,
  BookingBadge,
  euro,
  eventDate,
} from "./account-common";
import { FavoriteButton } from "./favorite-button";
import type { CustomerBookingDetail } from "@/app/actions/customer";

export function AccountBookingDetail({
  booking: b,
  reviewToken,
  reviewDone,
}: {
  booking: CustomerBookingDetail;
  reviewToken?: string | null;
  reviewDone?: boolean;
}) {
  const nl = useLanguage().language === "nl";
  const payment = {
    unpaid: nl ? "Nog niet betaald" : "Not paid",
    deposit_paid: nl ? "Aanbetaling ontvangen" : "Deposit received",
    paid: nl ? "Betaald" : "Paid",
    refunded: nl ? "Terugbetaald" : "Refunded",
  };
  const lines = [
    [
      nl ? "Professional" : "Professional",
      `${b.hours} ${nl ? "uur" : "hours"} × ${euro(b.hourlyRateCents, nl)}`,
      Math.round(Number(b.hours) * b.hourlyRateCents),
    ],
    [nl ? "Apparatuur" : "Equipment", "", b.equipmentCents],
    [nl ? "Reiskosten" : "Travel", "", b.travelCents],
  ] as const;
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
        action={<BookingBadge status={b.status} />}
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
              <CardTitle>{nl ? "Jouw evenement" : "Your event"}</CardTitle>
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
                    b.eventTypes.join(", "),
                  )}
                  {detail(nl ? "Aantal gasten" : "Guests", b.capacity)}
                  {detail("Dresscode", b.dressCode)}
                  {detail(
                    nl ? "Muziekgenres" : "Music genres",
                    b.musicGenres.join(", "),
                  )}
                  {detail(
                    nl ? "Apparatuur" : "Equipment",
                    b.equipment.join(", "),
                  )}
                </dl>
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
                {nl
                  ? "Contact- en factuurgegevens"
                  : "Contact and billing details"}
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
          <Card>
            <CardHeader>
              <CardTitle>{nl ? "Prijsindicatie" : "Price estimate"}</CardTitle>
              <CardDescription>
                {nl
                  ? "Op basis van je ingediende aanvraag."
                  : "Based on your submitted request."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-5">
                {lines.map(([label, sub, cents]) => (
                  <div
                    key={label}
                    className="flex justify-between gap-4 text-sm"
                  >
                    <div>
                      <p>{label}</p>
                      {sub && <p className="text-muted-foreground">{sub}</p>}
                    </div>
                    <span>{euro(cents, nl)}</span>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>{nl ? "Totaal" : "Total"}</span>
                  <span>{euro(b.totalCents, nl)}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {nl ? "Betaalstatus" : "Payment status"}:{" "}
                  {payment[b.paymentStatus]}
                </p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {nl
                    ? "Dit overzicht is geen factuur. Online betalen is hier nog niet beschikbaar. Stem de definitieve afspraken af met de professional."
                    : "This overview is not an invoice. Online payment is not available here yet. Confirm the final arrangements with the professional."}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{b.professionalName}</CardTitle>
              <CardDescription>
                {nl
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
              <MessageButton
                variant={reviewToken ? "outline" : "default"}
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
