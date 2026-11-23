"use client";

import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Check,
  Clock3,
  Heart,
  MapPin,
  Plus,
  Bell,
  UserRound,
} from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AccountEmpty,
  AccountHeading,
  BookingBadge,
  eventDate,
} from "./account-common";
import { BookingRows } from "./booking-list";
import type { CustomerBooking } from "@/app/actions/bookings";
import type { CustomerNotice } from "@/app/actions/customer";
import { NoticeLink } from "./notifications";

export function AccountOverview({
  name,
  bookings,
  favoritesCount,
  unread,
  notices,
  profileReady,
  today,
}: {
  name: string;
  bookings: CustomerBooking[];
  favoritesCount: number;
  unread: number;
  notices: CustomerNotice[];
  profileReady: boolean;
  today: string;
}) {
  const nl = useLanguage().language === "nl";
  const upcoming = bookings
    .filter((b) => b.status === "accepted" && b.eventDate >= today)
    .sort((a, b) => a.eventDate.localeCompare(b.eventDate));
  const next = upcoming[0];
  const recent = [...bookings]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 4);
  const stats = [
    {
      label: nl ? "Komende boekingen" : "Upcoming bookings",
      value: upcoming.length,
      icon: CalendarDays,
      href: "/account/boekingen?status=accepted",
    },
    {
      label: nl ? "Openstaande aanvragen" : "Pending requests",
      value: bookings.filter((b) => b.status === "pending").length,
      icon: Clock3,
      href: "/account/boekingen?status=pending",
    },
    {
      label: nl ? "Bewaarde favorieten" : "Saved favorites",
      value: favoritesCount,
      icon: Heart,
      href: "/account/favorieten",
    },
    {
      label: nl ? "Nieuwe meldingen" : "New notifications",
      value: unread,
      icon: Bell,
      href: "/account/meldingen",
    },
  ];
  return (
    <div className="flex flex-col gap-8">
      <AccountHeading
        title={`${nl ? "Welkom terug" : "Welcome back"}, ${name.split(" ")[0]}`}
        description={
          nl
            ? "Jouw volgende mooie moment begint hier. Alles voor je evenement, op één plek."
            : "Your next memorable moment starts here. Everything for your event, in one place."
        }
        action={
          <Button asChild>
            <Link href="/">
              <Plus data-icon="inline-start" />
              {nl ? "Nieuwe boeking" : "New booking"}
            </Link>
          </Button>
        }
      />
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, href }) => (
          <Link
            key={href}
            href={href}
            className="rounded-xl focus-visible:outline-2 focus-visible:outline-ring"
          >
            <Card className="h-full transition-colors hover:border-brand/40">
              <CardContent>
                <div className="flex items-start justify-between">
                  <div className="flex flex-col gap-3">
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className="text-3xl font-semibold tabular-nums">
                      {value}
                    </p>
                  </div>
                  <Icon className="size-5 shrink-0 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>
              <h2>{nl ? "Je volgende evenement" : "Your next event"}</h2>
            </CardTitle>
            <CardDescription>
              {nl
                ? "Iets om naar uit te kijken."
                : "Something to look forward to."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {next ? (
              <div className="flex flex-col gap-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-col gap-2">
                    <h3 className="text-2xl font-semibold text-balance">
                      {next.eventName}
                    </h3>
                    <p className="text-muted-foreground">
                      {next.professionalName}
                    </p>
                  </div>
                  <BookingBadge status={next.status} />
                </div>
                <div className="flex flex-wrap gap-5 text-sm">
                  <span className="flex items-center gap-2">
                    <CalendarDays className="size-4 text-brand" />
                    {eventDate(next.eventDate, nl)}
                  </span>
                  <span className="flex items-center gap-2">
                    <Clock3 className="size-4 text-brand" />
                    {next.startTime} – {next.endTime}
                  </span>
                  <span className="flex items-center gap-2">
                    <MapPin className="size-4 text-brand" />
                    {next.city}
                  </span>
                </div>
                <Button variant="outline" asChild>
                  <Link href={`/account/boekingen/${next.id}`}>
                    {nl ? "Bekijk je boeking" : "View your booking"}
                    <ArrowRight data-icon="inline-end" />
                  </Link>
                </Button>
              </div>
            ) : (
              <AccountEmpty
                title={
                  nl
                    ? "Maak ruimte voor een mooi moment"
                    : "Make room for a memorable moment"
                }
                description={
                  nl
                    ? "Zodra een professional je aanvraag accepteert, verschijnt je volgende evenement hier."
                    : "Once a professional accepts your request, your next event appears here."
                }
                discover
              />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>
              <h2>{nl ? "Klaar voor je evenement?" : "Ready for your event?"}</h2>
            </CardTitle>
            <CardDescription>
              {nl
                ? "Een goede voorbereiding begint klein."
                : "A little preparation goes a long way."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            {[
              {
                label: nl
                  ? "Vul je contactgegevens aan"
                  : "Complete your contact details",
                sub: nl
                  ? "Sneller boeken, minder invullen"
                  : "Book faster with saved details",
                href: "/account/profiel",
                done: profileReady,
                icon: UserRound,
              },
              {
                label: nl
                  ? "Bewaar je favoriete professionals"
                  : "Save your favorite professionals",
                sub: nl
                  ? "Vergelijk en kies op je gemak"
                  : "Compare and choose at your own pace",
                href: "/account/favorieten",
                done: favoritesCount > 0,
                icon: Heart,
              },
              {
                label: nl
                  ? "Verstuur je eerste aanvraag"
                  : "Send your first request",
                sub: nl
                  ? "Vind de juiste match voor jouw dag"
                  : "Find the right match for your day",
                href: "/",
                done: bookings.length > 0,
                icon: CalendarDays,
              },
            ].map(({ label, sub, href, done, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex min-h-11 items-center gap-3 rounded-md focus-visible:outline-2 focus-visible:outline-ring"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent">
                  {done ? (
                    <Check
                      className="size-5 text-brand"
                      aria-label={nl ? "Voltooid" : "Completed"}
                    />
                  ) : (
                    <Icon className="size-5 text-muted-foreground" />
                  )}
                </span>
                <div className="flex flex-1 flex-col gap-1">
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-sm text-muted-foreground">{sub}</p>
                </div>
                <ArrowRight className="size-4 text-muted-foreground" />
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>
              <h2>{nl ? "Recente aanvragen" : "Recent requests"}</h2>
            </CardTitle>
            <CardDescription>
              {nl
                ? "Volg de voortgang van je boekingen."
                : "Keep track of your bookings."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recent.length ? (
              <BookingRows bookings={recent} />
            ) : (
              <AccountEmpty
                title={nl ? "Nog geen aanvragen" : "No requests yet"}
                description={
                  nl
                    ? "Je hoeft nog niets te regelen. Ontdek eerst wie bij jouw evenement past."
                    : "Take your time discovering the right professional for your event."
                }
              />
            )}
          </CardContent>
          <CardFooter>
            <Button variant="ghost" asChild>
              <Link href="/account/boekingen">
                {nl ? "Alle boekingen bekijken" : "View all bookings"}
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>
              <h2>{nl ? "Laatste updates" : "Latest updates"}</h2>
            </CardTitle>
            <CardDescription>
              {nl ? "Je blijft hier op de hoogte." : "Stay up to date here."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {notices.length ? (
              <div className="flex flex-col gap-5">
                {notices.slice(0, 3).map((notice) => (
                  <NoticeLink key={notice.id} notice={notice} />
                ))}
              </div>
            ) : (
              <AccountEmpty
                icon={Bell}
                title={nl ? "Helemaal bij" : "All caught up"}
                description={
                  nl
                    ? "Nieuwe reacties op je aanvragen vind je hier."
                    : "New responses to your requests will appear here."
                }
              />
            )}
          </CardContent>
          <CardFooter>
            <Button variant="ghost" asChild>
              <Link href="/account/meldingen">
                {nl ? "Alle meldingen" : "All notifications"}
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
