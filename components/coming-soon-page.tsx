"use client"

import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/contexts/language-context"
import { useHomeServices } from "@/components/home-services"

type Category = "location" | "catering" | "entertainment" | "decoration" | "security"

/** Same order as the categories on the homepage (see home-services). */
const INDEX: Record<Category, number> = { location: 2, catering: 3, entertainment: 4, decoration: 5, security: 6 }

/**
 * A category without professionals yet. Uses the title, icon and description from the homepage,
 * so both places say the same, and points to the categories that can be booked.
 */
export function ComingSoonPage({ category }: { category: Category }) {
  const nl = useLanguage().language === "nl"
  const { services, soonLabel } = useHomeServices()
  const { icon: Icon, title, description } = services[INDEX[category]]

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center px-4 py-16 text-center sm:py-24">
        <span className="mb-6 flex size-16 items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/50 sm:size-20">
          <Icon className="size-7 text-muted-foreground sm:size-8" aria-hidden />
        </span>
        <p className="text-sm font-semibold text-muted-foreground">{soonLabel}</p>
        <h1 className="mt-2 text-3xl font-bold text-balance text-foreground">{title}</h1>
        <p className="mt-3 text-pretty text-muted-foreground">{description}</p>
        <p className="mt-6 text-pretty text-foreground">
          {nl
            ? "Deze categorie is nog niet te boeken. Artiesten, fotografen en videografen wel."
            : "This category cannot be booked yet. Artists, photographers and videographers can."}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild variant="brand" className="h-11">
            <Link href="/artiesten">{nl ? "Bekijk artiesten" : "Browse artists"}</Link>
          </Button>
          <Button asChild variant="outline" className="h-11">
            <Link href="/photo-video">{nl ? "Fotografen en videografen" : "Photographers and videographers"}</Link>
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  )
}
