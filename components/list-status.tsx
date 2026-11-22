"use client"

import { RotateCcw, TriangleAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/contexts/language-context"

/** Shown when the registered professionals could not be fetched, with a button to try again. */
export function LiveListError({ onRetry, retrying }: { onRetry: () => void; retrying: boolean }) {
  const nl = useLanguage().language !== "en"
  return (
    <div role="alert" className="mb-4 flex flex-col gap-3 rounded-lg border border-red-500/40 bg-red-500/10 p-4 sm:flex-row sm:items-center">
      <TriangleAlert className="size-5 shrink-0 text-red-600 dark:text-red-400" aria-hidden />
      <p className="flex-1 text-sm text-foreground">
        {nl
          ? "De professionals konden niet worden geladen. Controleer je verbinding en probeer het opnieuw."
          : "The professionals could not be loaded. Check your connection and try again."}
      </p>
      <Button type="button" variant="outline" className="h-11" onClick={onRetry} disabled={retrying}>
        <RotateCcw className={`size-4 ${retrying ? "animate-spin motion-reduce:animate-none" : ""}`} aria-hidden />
        {nl ? "Opnieuw proberen" : "Try again"}
      </Button>
    </div>
  )
}

/** Placeholder cards while the list loads. */
export function ListSkeleton() {
  const nl = useLanguage().language !== "en"
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5" aria-busy="true" aria-live="polite">
      <span className="sr-only">{nl ? "Professionals laden" : "Loading professionals"}</span>
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="h-[520px] animate-pulse motion-reduce:animate-none rounded-xl border border-border bg-card" />
      ))}
    </div>
  )
}
