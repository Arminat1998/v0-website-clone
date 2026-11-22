"use client";

import Link from "next/link";
import { Heart, MapPin, UserRound, ArrowUpRight } from "lucide-react";
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
import { AccountEmpty, AccountHeading } from "./account-common";
import { FavoriteButton } from "./favorite-button";
import type { FavoriteItem } from "@/lib/customer-types";

export function AccountFavorites({ favorites }: { favorites: FavoriteItem[] }) {
  const nl = useLanguage().language === "nl";
  return (
    <div className="flex flex-col gap-8">
      <AccountHeading
        title={nl ? "Mijn favorieten" : "My favorites"}
        description={
          nl
            ? "Een shortlist voor jouw volgende evenement. Bewaar nu, boek wanneer jij er klaar voor bent."
            : "A shortlist for your next event. Save now, book when you are ready."
        }
      />
      {favorites.length ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {favorites.map((favorite) => (
            <Card
              key={`${favorite.professionalType}:${favorite.professionalId}`}
              className="overflow-hidden"
            >
              {favorite.image ? (
                <img
                  src={favorite.image}
                  alt={favorite.name}
                  className="aspect-[16/10] w-full object-cover"
                />
              ) : (
                <div className="flex aspect-[16/10] items-center justify-center bg-accent text-muted-foreground">
                  <UserRound className="size-12" />
                </div>
              )}
              <CardHeader>
                <CardTitle>
                  <h2>{favorite.available
                    ? favorite.name
                    : nl
                      ? "Niet meer beschikbaar"
                      : "No longer available"}</h2>
                </CardTitle>
                <CardDescription>
                  {favorite.available
                    ? favorite.specialty
                    : nl
                      ? "Dit profiel is niet meer openbaar."
                      : "This profile is no longer public."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {favorite.available && (
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <MapPin className="size-4" />
                      {favorite.location ||
                        (nl
                          ? "Locatie niet opgegeven"
                          : "Location not provided")}
                    </span>
                    <span className="font-medium">
                      {favorite.price} / {nl ? "uur" : "hour"}
                    </span>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex-wrap gap-2">
                <FavoriteButton
                  professionalId={favorite.professionalId}
                  professionalType={favorite.professionalType}
                  initialSaved
                />
                {favorite.available && (
                  <Button asChild>
                    <Link href={favorite.href}>
                      {favorite.professionalType === "photographer"
                        ? nl
                          ? "Boeken"
                          : "Book"
                        : nl
                          ? "Bekijk profiel"
                          : "View profile"}
                      <ArrowUpRight data-icon="inline-end" />
                    </Link>
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent>
            <AccountEmpty
              icon={Heart}
              title={
                nl
                  ? "Wie past bij jouw evenement?"
                  : "Who is right for your event?"
              }
              description={
                nl
                  ? "Klik op Bewaren bij een artiest of fotograaf. Je vindt je favorieten daarna hier terug, ook op een ander apparaat."
                  : "Select Save on an artist or photographer profile. Your favorites will appear here, on any device."
              }
              discover
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
