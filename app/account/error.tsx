"use client";

import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";

export default function AccountError({ reset }: { reset: () => void }) {
  const nl = useLanguage().language === "nl";
  return (
    <div role="alert" className="flex flex-col items-start gap-4 py-10">
      <h1 className="text-xl font-semibold">
        {nl
          ? "Je gegevens konden niet worden geladen"
          : "We could not load your details"}
      </h1>
      <p className="text-muted-foreground">
        {nl
          ? "Probeer het opnieuw. Je opgeslagen gegevens blijven behouden."
          : "Please try again. Your saved details are safe."}
      </p>
      <Button onClick={reset}>{nl ? "Opnieuw proberen" : "Try again"}</Button>
    </div>
  );
}
