"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/contexts/language-context"

export function NotFoundContent() {
  const nl = useLanguage().language !== "en"
  return (
    <main className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
      <p className="text-sm font-semibold text-red-600">404</p>
      <h1 className="mt-2 text-3xl font-bold text-foreground text-balance">
        {nl ? "Deze pagina bestaat niet (meer)" : "This page does not exist (anymore)"}
      </h1>
      <p className="mt-3 text-muted-foreground text-pretty">
        {nl
          ? "Misschien is het profiel offline gehaald of klopt de link niet. Zoek verder tussen onze professionals."
          : "The profile may have been taken offline, or the link is wrong. Keep looking among our professionals."}
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button asChild className="bg-red-700 text-white hover:bg-red-600">
          <Link href="/artiesten">{nl ? "Bekijk artiesten" : "Browse artists"}</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/photo-video">{nl ? "Fotografen en videografen" : "Photographers and videographers"}</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href="/">{nl ? "Naar de homepage" : "Go to the homepage"}</Link>
        </Button>
      </div>
    </main>
  )
}
