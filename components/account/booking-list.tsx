"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowUpRight, CalendarDays, MapPin } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AccountEmpty,
  AccountHeading,
  BookingBadge,
  euro,
  eventDate,
  statusLabels,
} from "./account-common";
import type { CustomerBooking } from "@/app/actions/bookings";

export function BookingRows({ bookings }: { bookings: CustomerBooking[] }) {
  const nl = useLanguage().language === "nl";
  return (
    <div className="divide-y">
      {bookings.map((booking) => (
        <Link
          href={`/account/boekingen/${booking.id}`}
          key={booking.id}
          className="block rounded-lg py-4 transition-colors hover:bg-accent/50 focus-visible:outline-2 focus-visible:outline-ring"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex size-12 shrink-0 flex-col items-center justify-center rounded-lg border bg-background">
                <span className="text-sm text-muted-foreground">
                  {new Date(`${booking.eventDate}T12:00:00`).toLocaleDateString(
                    nl ? "nl-NL" : "en-GB",
                    { month: "short" },
                  )}
                </span>
                <span className="text-lg font-semibold">
                  {Number(booking.eventDate.slice(-2))}
                </span>
              </div>
              <div className="flex min-w-0 flex-col gap-1">
                <p className="break-words text-sm font-semibold">
                  {booking.eventName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {booking.professionalName}
                </p>
                <p className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="size-3.5 shrink-0" />
                  {booking.city}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end gap-2">
                <BookingBadge status={booking.status} />
                <span className="text-sm font-medium">
                  {euro(booking.totalCents, nl)}
                </span>
              </div>
              <ArrowUpRight className="size-4 text-muted-foreground" />
            </div>
          </div>
          <span className="sr-only">{eventDate(booking.eventDate, nl)}</span>
        </Link>
      ))}
    </div>
  );
}

export function AccountBookingList({
  bookings,
}: {
  bookings: CustomerBooking[];
}) {
  const { language } = useLanguage();
  const nl = language === "nl";
  const searchParams = useSearchParams();
  const [status, setStatus] = useState(searchParams.get("status") || "all");
  const [query, setQuery] = useState("");
  const filtered = bookings.filter(
    (booking) =>
      (status === "all" || booking.status === status) &&
      `${booking.eventName} ${booking.professionalName} ${booking.city}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <div className="flex flex-col gap-8">
      <AccountHeading
        title={nl ? "Mijn boekingen" : "My bookings"}
        description={
          nl
            ? "Van eerste aanvraag tot een onvergetelijk evenement."
            : "From your first request to an unforgettable event."
        }
        action={
          <Button asChild>
            <Link href="/">
              {nl ? "Nieuwe boeking" : "New booking"}
              <ArrowUpRight data-icon="inline-end" />
            </Link>
          </Button>
        }
      />
      <Card>
        <CardContent>
          <div className="flex flex-col gap-6">
            <Field className="max-w-sm">
              <FieldLabel htmlFor="booking-search">
                {nl ? "Zoek een boeking" : "Search bookings"}
              </FieldLabel>
              <Input
                id="booking-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={
                  nl
                    ? "Evenement, professional of plaats"
                    : "Event, professional or city"
                }
              />
            </Field>
            <Tabs value={status} onValueChange={setStatus}>
              <div className="overflow-x-auto">
                <TabsList className="h-auto flex-wrap justify-start">
                  <TabsTrigger value="all">
                    {nl ? "Alles" : "All"} ({bookings.length})
                  </TabsTrigger>
                  {Object.entries(statusLabels[language]).map(
                    ([key, label]) => (
                      <TabsTrigger key={key} value={key}>
                        {label}
                      </TabsTrigger>
                    ),
                  )}
                </TabsList>
              </div>
            </Tabs>
            {filtered.length ? (
              <BookingRows bookings={filtered} />
            ) : (
              <AccountEmpty
                icon={CalendarDays}
                title={nl ? "Geen boekingen gevonden" : "No bookings found"}
                description={
                  bookings.length
                    ? nl
                      ? "Probeer een andere zoekterm of status."
                      : "Try another search or status."
                    : nl
                      ? "Je aanvragen verschijnen hier zodra je een professional boekt."
                      : "Your requests appear here when you book a professional."
                }
                discover={!bookings.length}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
