"use client"

import Link from "next/link"
import { ExternalLink, EyeOff, Globe, UserRound } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

interface ProfileLinksProps {
  current: "profile" | "website"
  /** The page visitors see; null until the profile has been approved. Only for "profile": the website editor shows it itself. */
  publicPath?: string | null
}

const linkClass =
  "inline-flex min-h-11 items-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-foreground transition-colors hover:bg-accent"

export function ProfileLinks({ current, publicPath = null }: ProfileLinksProps) {
  const nl = useLanguage().language === "nl"
  return (
    <nav aria-label={nl ? "Gerelateerde pagina's" : "Related pages"} className={`flex flex-wrap gap-2 ${current === "profile" ? "mx-auto max-w-4xl" : ""}`}>
      {current === "profile" ? (
        <Link href="/dashboard/my-page" className={linkClass}>
          <Globe className="h-4 w-4" aria-hidden />
          {nl ? "Mijn website bewerken" : "Edit my website"}
        </Link>
      ) : (
        <Link href="/dashboard/edit-profile" className={linkClass}>
          <UserRound className="h-4 w-4" aria-hidden />
          {nl ? "Profiel bewerken" : "Edit profile"}
        </Link>
      )}
      {current === "profile" &&
        (publicPath ? (
          <Link href={publicPath} target="_blank" className={linkClass}>
            <ExternalLink className="h-4 w-4" aria-hidden />
            {nl ? "Bekijk openbare pagina" : "View public page"}
          </Link>
        ) : (
          <span className="inline-flex min-h-11 items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
            <EyeOff className="h-4 w-4" aria-hidden />
            {nl ? "Openbare pagina: zichtbaar na goedkeuring" : "Public page: visible after approval"}
          </span>
        ))}
    </nav>
  )
}
