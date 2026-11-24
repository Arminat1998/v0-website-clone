"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ReplacementSuggestion } from "@/lib/bookings/replacement";

/**
 * Compact card for the replacement list in the side column: one row of facts, at most two reasons and two buttons.
 * Everything else (equipment, all genres, event types) lives in the profile window.
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
  const photo = item.profile.avatar || item.profile.image || item.image || `/placeholder.svg?height=96&width=96&query=${encodeURIComponent(item.name)}`;
  const rate = `€ ${Math.round(item.hourlyRateCents / 100).toLocaleString("nl-NL")}`;
  return (
    <article className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3 shadow-xs transition-shadow hover:shadow-md">
      <div className="flex items-start gap-3">
        <img src={photo} alt="" className="size-16 shrink-0 rounded-xl object-cover object-[50%_25%]" />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-2 min-w-0 text-base font-semibold leading-tight text-foreground">{item.name}</h3>
            <div className="shrink-0">{badge}</div>
          </div>
          <p className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">{item.location}</span>
          </p>
          <p className="truncate text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{item.specialty}</span>
            {" · "}
            {nl ? "vanaf" : "from"} <span className="font-semibold text-foreground">{rate}</span>
            {nl ? " p/u excl. btw" : "/h excl. VAT"}
          </p>
        </div>
      </div>

      {reasons.length > 0 && (
        <ul className="flex flex-wrap gap-1.5" aria-label={nl ? "Waarom dit past" : "Why this fits"}>
          {reasons.slice(0, 2).map((reason) => (
            <li key={reason} className="max-w-full truncate rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
              {reason}
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-col gap-2">
        <Button asChild variant="brand" className="min-h-11">
          <Link href={item.href}>{nl ? "Boek met je wensen" : "Book with your wishes"}</Link>
        </Button>
        <Button type="button" variant="outline" className="min-h-11" onClick={onView}>
          {nl ? "Bekijk profiel" : "View profile"}
        </Button>
      </div>
    </article>
  );
}
