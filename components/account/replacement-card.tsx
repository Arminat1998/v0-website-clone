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
 * in a compact size, with a match badge on the photo and the booking actions as footer.
 */
export function ReplacementCard({
  item,
  nl,
  badge,
  onView,
}: {
  item: ReplacementSuggestion;
  nl: boolean;
  badge: ReactNode;
  onView: () => void;
}) {
  const footer = (
    <div className="flex gap-2">
      <Button variant="brand" asChild className="h-9 flex-1" onClick={(event) => event.stopPropagation()}>
        <Link href={item.href}>{nl ? "Boek met je wensen" : "Book with your wishes"}</Link>
      </Button>
      <Button
        type="button"
        variant="outline"
        className="h-9 flex-1"
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
    <PhotoVideoCard professional={item.profile as Photographer} onClick={onView} badge={badge} compact footer={footer} />
  ) : (
    <ArtiestCard artist={item.profile as Artist} onClick={onView} badge={badge} compact footer={footer} />
  );
}
