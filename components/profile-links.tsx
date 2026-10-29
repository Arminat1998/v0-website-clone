import Link from "next/link"
import { ExternalLink, Globe, UserRound } from "lucide-react"

interface ProfileLinksProps {
  current: "profile" | "website"
  publicPath: string
}

const linkClass =
  "inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-foreground transition-colors hover:bg-accent"

export function ProfileLinks({ current, publicPath }: ProfileLinksProps) {
  return (
    <nav aria-label="Gerelateerde pagina's" className="mx-auto flex max-w-4xl flex-wrap gap-2">
      {current === "profile" ? (
        <Link href="/dashboard/my-page" className={linkClass}>
          <Globe className="h-4 w-4" />
          Mijn website bewerken
        </Link>
      ) : (
        <Link href="/dashboard/edit-profile" className={linkClass}>
          <UserRound className="h-4 w-4" />
          Profiel bewerken
        </Link>
      )}
      <Link href={publicPath} target="_blank" className={linkClass}>
        <ExternalLink className="h-4 w-4" />
        Bekijk openbare pagina
      </Link>
    </nav>
  )
}
