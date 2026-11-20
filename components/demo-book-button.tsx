"use client"

import { Button } from "@/components/ui/button"
import { useLanguage } from "@/contexts/language-context"
import { cn } from "@/lib/utils"

/** Takes the place of a "Book" button on sample profiles, which cannot be booked. */
export function DemoBookButton({ className }: { className?: string }) {
  const nl = useLanguage().language !== "en"
  return (
    <Button type="button" variant="secondary" disabled className={cn("font-medium", className)}>
      {nl ? "Voorbeeldprofiel, niet boekbaar" : "Sample profile, not bookable"}
    </Button>
  )
}
