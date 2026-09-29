import { Camera, Drum, Guitar, Headphones, Mic, Music, Music2, Piano, Users, Video, type LucideIcon } from "lucide-react"

type ArtistTypeKey =
  | "dj"
  | "saxophonist"
  | "band"
  | "singer"
  | "pianist"
  | "guitarist"
  | "violinist"
  | "drummer"
  | "photographer"
  | "videographer"

const ARTIST_TYPES: Record<ArtistTypeKey, { icon: LucideIcon; nl: string; en: string }> = {
  dj: { icon: Headphones, nl: "DJ", en: "DJ" },
  saxophonist: { icon: Music2, nl: "Saxofonist", en: "Saxophonist" },
  band: { icon: Users, nl: "Band", en: "Band" },
  singer: { icon: Mic, nl: "Zanger", en: "Singer" },
  pianist: { icon: Piano, nl: "Pianist", en: "Pianist" },
  guitarist: { icon: Guitar, nl: "Gitarist", en: "Guitarist" },
  violinist: { icon: Music, nl: "Violist", en: "Violinist" },
  drummer: { icon: Drum, nl: "Drummer", en: "Drummer" },
  photographer: { icon: Camera, nl: "Fotograaf", en: "Photographer" },
  videographer: { icon: Video, nl: "Videograaf", en: "Videographer" },
}

export interface ArtistTypeLabel {
  key: string
  label: string
  icon: LucideIcon
}

export function getArtistTypeLabels(
  types: string[] | undefined,
  category: string | undefined,
  language: string,
): ArtistTypeLabel[] {
  const source = types && types.length > 0 ? types : (category ?? "").split(/\s*&\s*|\s*,\s*/)
  const seen = new Set<string>()

  return source
    .map((raw) => raw.trim())
    .filter(Boolean)
    .flatMap((raw) => {
      const key = raw.toLowerCase() as ArtistTypeKey
      if (seen.has(key)) return []
      seen.add(key)
      const def = ARTIST_TYPES[key]
      return [
        {
          key,
          label: def ? (language === "en" ? def.en : def.nl) : raw,
          icon: def?.icon ?? Music,
        },
      ]
    })
}
