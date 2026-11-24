"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArtiestCard } from "@/components/artiest-card";
import { PhotoVideoCard } from "@/components/photo-video-card";
import { Button } from "@/components/ui/button";
import type { Artist, Photographer } from "@/lib/smart-search";
import type { ReplacementSuggestion } from "@/lib/bookings/replacement";

/**
 * A replacement suggestion shown with the same card as the artist overview (cover banner, round avatar, badges, fees),
 * with a match badge on the photo and the "why this fits" chips and booking actions as footer.
 */
export function ReplacementCard({
  item,
  nl,
  badge,
  reasons,
  onView,
}: {
  item: ReplacementSuggestion;
  nl: boolean;
  badge: ReactNode;
  reasons: string[];
  onView: () => void;
}) {
  const footer = (
    <div className="flex flex-col gap-2">
      {reasons.length > 0 && (
        <ul className="flex flex-wrap gap-1.5" aria-label={nl ? "Waarom dit past" : "Why this fits"}>
          {reasons.map((reason) => (
            <li key={reason} className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
              {reason}
            </li>
          ))}
        </ul>
      )}
      <Button variant="brand" asChild className="h-auto min-h-11 whitespace-normal py-2" onClick={(event) => event.stopPropagation()}>
        <Link href={item.href}>{nl ? "Boek met je wensen" : "Book with your wishes"}</Link>
      </Button>
      <Button
        type="button"
        variant="outline"
        className="min-h-11 whitespace-normal"
        onClick={(event) => {
          event.stopPropagation();
          onView();
        }}
      >
        {nl ? "Bekijk profiel" : "View profile"}
      </Button>
    </div>
  );
  return item.type === "photographer" ? (
    <PhotoVideoCard professional={item.profile as Photographer} onClick={onView} badge={badge} footer={footer} />
  ) : (
    <ArtiestCard artist={item.profile as Artist} onClick={onView} badge={badge} footer={footer} />
  );
}
