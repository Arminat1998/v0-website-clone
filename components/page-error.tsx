"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/contexts/language-context"

/** What an error.tsx shows: a title in the chosen language, a second attempt and a way back. */
export function PageError({
  title,
  description,
  retry,
  backHref,
  backLabel,
}: {
  title?: string
  description?: string
  retry: () => void
  backHref?: string
  backLabel?: string
}) {
  const nl = useLanguage().language === "nl"
  return (
    <div role="alert" className="flex flex-col items-start gap-4 py-10">
      <h1 className="text-xl font-semibold text-foreground">
        {title ?? (nl ? "Deze pagina kon niet worden geladen" : "This page could not be loaded")}
      </h1>
      <p className="text-muted-foreground">
        {description ?? (nl ? "Controleer je verbinding en probeer het opnieuw." : "Check your connection and try again.")}
      </p>
      <div className="flex flex-wrap gap-3">
        <Button className="min-h-11" onClick={retry}>
          {nl ? "Opnieuw proberen" : "Try again"}
        </Button>
        {backHref && (
          <Button variant="outline" className="min-h-11" asChild>
            <Link href={backHref}>{backLabel}</Link>
          </Button>
        )}
      </div>
    </div>
  )
}
