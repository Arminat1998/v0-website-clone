"use client";

import { PageError } from "@/components/page-error";
import { useLanguage } from "@/contexts/language-context";

export default function AccountError({ retry }: { retry: () => void }) {
  const nl = useLanguage().language === "nl";
  return (
    <PageError
      retry={retry}
      title={nl ? "Je gegevens konden niet worden geladen" : "We could not load your details"}
      description={
        nl
          ? "Probeer het opnieuw. Je opgeslagen gegevens blijven behouden."
          : "Please try again. Your saved details are safe."
      }
      backHref="/account"
      backLabel={nl ? "Naar je account" : "Go to your account"}
    />
  );
}
