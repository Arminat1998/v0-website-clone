"use client";

import Link from "next/link";
import useSWR from "swr";
import { Loader2, Sparkles, Star } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getReplacementSuggestions } from "@/app/actions/customer";
import { formatEuro } from "@/lib/bookings/pricing";
import type { ReplacementReason } from "@/lib/bookings/replacement";

const REASONS: Record<ReplacementReason, [string, string]> = {
  type: ["Zelfde soort act", "Same kind of act"],
  genres: ["Overeenkomende genres", "Matching genres"],
  price: ["Vergelijkbaar tarief", "Similar rate"],
  city: ["Zelfde plaats", "Same city"],
  eventTypes: ["Zelfde soort evenementen", "Same kind of events"],
};

/** The closest alternatives to a professional who declined or was cancelled; one click opens the form with the same wishes. */
export function ReplacementSuggestions({
  bookingId,
  professionalName,
  browseHref,
}: {
  bookingId: number;
  professionalName: string;
  browseHref: string;
}) {
  const nl = useLanguage().language === "nl";
  const { data, isLoading } = useSWR(["replacements", bookingId], () => getReplacementSuggestions(bookingId));
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2 className="flex items-center gap-2">
            <Sparkles className="size-5 text-brand" />
            {nl ? "Vind een vergelijkbare vervangende professional" : "Find a similar replacement"}
          </h2>
        </CardTitle>
        <CardDescription>
          {nl
            ? `De beste alternatieven voor ${professionalName}. Je ingevulde wensen worden meteen overgenomen, je hoeft niets opnieuw in te vullen.`
            : `The closest alternatives to ${professionalName}. Your wishes are carried over, so there is nothing to fill in again.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {isLoading && (
          <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            {nl ? "Zoeken naar passende professionals..." : "Looking for matching professionals..."}
          </p>
        )}
        {data && data.length === 0 && (
          <p className="text-sm text-muted-foreground">
            {nl
              ? "We vonden geen professional die goed past en op jouw datum beschikbaar is. Bekijk het hele aanbod."
              : "We found no close match who is free on your date. Browse everyone."}
          </p>
        )}
        {data?.map((item) => (
          <div key={item.id} className="flex flex-col gap-3 rounded-lg border p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="break-words font-medium">{item.name}</p>
                <p className="break-words text-sm text-muted-foreground">
                  {[item.specialty, item.location].filter(Boolean).join(" · ")}
                </p>
                <p className="mt-1 flex flex-wrap items-center gap-x-3 text-sm">
                  {item.hourlyRateCents > 0 && (
                    <span>
                      {formatEuro(item.hourlyRateCents)}
                      {nl ? " per uur" : " per hour"}
                    </span>
                  )}
                  {item.reviews > 0 && (
                    <span className="flex items-center gap-1">
                      <Star className="size-3.5 fill-current text-amber-500" />
                      {item.rating.toFixed(1)} ({item.reviews})
                    </span>
                  )}
                </p>
              </div>
              <Badge variant="secondary" className="shrink-0">
                {item.match}% {nl ? "match" : "match"}
              </Badge>
            </div>
            {item.reasons.length > 0 && (
              <ul className="flex flex-wrap gap-2">
                {item.reasons.map((reason) => (
                  <li key={reason} className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                    {REASONS[reason][nl ? 0 : 1]}
                  </li>
                ))}
              </ul>
            )}
            <Button variant="brand" asChild className="min-h-11">
              <Link href={item.href}>{nl ? "Boek direct met deze wensen" : "Book now with these wishes"}</Link>
            </Button>
          </div>
        ))}
        <Button variant="outline" asChild className="min-h-11">
          <Link href={browseHref}>{nl ? "Alle professionals bekijken" : "Browse all professionals"}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
