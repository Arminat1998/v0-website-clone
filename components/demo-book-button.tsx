"use client"

import { Button } from "@/components/ui/button"
import { useLanguage } from "@/contexts/language-context"
import { cn } from "@/lib/utils"

/** Takes the place of a "Book" button on sample profiles, which cannot be booked. */
export function DemoBookButton({ className, short = false }: { className?: string; short?: boolean }) {
  const nl = useLanguage().language !== "en"
  return (
    <Button type="button" variant="secondary" disabled className={cn("font-medium", className)}>
      {short ? (nl ? "Voorbeeldprofiel" : "Sample profile") : nl ? "Voorbeeldprofiel, niet boekbaar" : "Sample profile, not bookable"}
    </Button>
  )
}
