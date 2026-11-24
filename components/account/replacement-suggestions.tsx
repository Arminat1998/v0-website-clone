"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { AlertCircle, Loader2, Sparkles } from "lucide-react";
import { ReplacementCard } from "@/components/account/replacement-card";
import { ArtiestProfileModal } from "@/components/artiest-profile-modal";
import { photographerAsArtist } from "@/lib/photographer-as-artist";
import type { Artist, Photographer } from "@/lib/smart-search";
import type { ReplacementSuggestion } from "@/lib/bookings/replacement";
import { useLanguage } from "@/contexts/language-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getReplacementSuggestions } from "@/app/actions/customer";
import { genreLabel } from "@/lib/profile-options";
import { matchLevel, type ReplacementReason } from "@/lib/bookings/replacement";

const LEVELS = {
  strong: ["Sterke match", "Strong match", "bg-emerald-100 text-emerald-800 hover:bg-emerald-100"],
  good: ["Goede match", "Good match", "bg-sky-100 text-sky-800 hover:bg-sky-100"],
  possible: ["Mogelijke match", "Possible match", "bg-muted text-muted-foreground hover:bg-muted"],
} as const;

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
  datePassed = false,
}: {
  bookingId: number;
  professionalName: string;
  browseHref: string;
  datePassed?: boolean;
}) {
  const nl = useLanguage().language === "nl";
  const [selected, setSelected] = useState<ReplacementSuggestion | null>(null);
  const [open, setOpen] = useState(false);
  const show = (item: ReplacementSuggestion) => {
    setSelected(item);
    setOpen(true);
  };
  const { data, isLoading, error } = useSWR(["replacements", bookingId], () => getReplacementSuggestions(bookingId));
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
        {error && !isLoading && (
          <p role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            {nl
              ? "Alternatieven laden lukt nu niet. Ververs de pagina of bekijk zelf het hele aanbod."
              : "We can't load alternatives right now. Refresh the page or browse everyone yourself."}
          </p>
        )}
        {!error && data && data.length === 0 && (
          <p className="text-sm text-muted-foreground">
            {datePassed
              ? nl
                ? "We vonden geen professional die goed past bij je wensen. Je datum is verstreken, dus kies in het formulier een nieuwe datum en bekijk het hele aanbod."
                : "We found no close match for your wishes. Your date has passed, so pick a new date in the form and browse everyone."
              : nl
                ? "Op jouw datum is niemand beschikbaar die goed past. Probeer een andere datum of bekijk het hele aanbod."
                : "Nobody who fits is free on your date. Try another date or browse everyone."}
          </p>
        )}
        {data && data.length > 0 && (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-1">
        {data.map((item) => {
          const level = LEVELS[matchLevel(item.match)];
          const genres = item.sharedGenres.map((genre) => genreLabel(genre, nl));
          const shared = new Set<ReplacementReason>(item.reasons);
          const rateNote =
            item.rateDiffPercent === null || Math.abs(item.rateDiffPercent) < 3
              ? null
              : item.rateDiffPercent < 0
                ? nl ? `${Math.abs(item.rateDiffPercent)}% goedkoper` : `${Math.abs(item.rateDiffPercent)}% cheaper`
                : nl ? `${item.rateDiffPercent}% duurder` : `${item.rateDiffPercent}% more expensive`;
          const reasons: string[] = [];
          if (shared.has("type")) reasons.push(REASONS.type[nl ? 0 : 1]);
          if (genres.length) reasons.push(`${nl ? "Gedeeld" : "Shared"}: ${genres.join(", ")}`);
          else if (shared.has("genres")) reasons.push(REASONS.genres[nl ? 0 : 1]);
          if (shared.has("price") || rateNote) {
            reasons.push(rateNote ? `${REASONS.price[nl ? 0 : 1]} (${rateNote})` : REASONS.price[nl ? 0 : 1]);
          }
          if (shared.has("city")) reasons.push(REASONS.city[nl ? 0 : 1]);
          if (shared.has("eventTypes")) reasons.push(REASONS.eventTypes[nl ? 0 : 1]);
          const badge = (
            <Badge variant="secondary" className={`shadow-lg ${level[2]}`}>
              {level[nl ? 0 : 1]}
            </Badge>
          );
          return (
            <ReplacementCard key={item.id} item={item} nl={nl} badge={badge} reasons={reasons} onView={() => show(item)} />
          );
        })}
          </div>
        )}
        {data && data.length > 0 && (
          <p className="text-center text-xs text-muted-foreground">
            {nl ? "Je controleert alles nog voordat je verstuurt." : "You review everything before you send."}
          </p>
        )}
        <Button variant="outline" asChild className="min-h-11">
          <Link href={browseHref}>{nl ? "Alle professionals bekijken" : "Browse all professionals"}</Link>
        </Button>
      </CardContent>
      <ArtiestProfileModal
        artist={selected ? (selected.type === "photographer" ? photographerAsArtist(selected.profile as Photographer) : (selected.profile as Artist)) : null}
        open={open}
        onOpenChange={setOpen}
        fullPageHref={selected?.profileHref ?? null}
        bookHref={selected?.href}
        bookLabel={selected ? (nl ? `Boek ${selected.name} met je wensen` : `Book ${selected.name} with your wishes`) : undefined}
      />
    </Card>
  );
}
