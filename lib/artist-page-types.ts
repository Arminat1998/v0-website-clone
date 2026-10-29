export interface ArtistPageVideo {
  id: string
  url: string
  title: string
}

export const SOCIAL_KEYS = ["instagram", "youtube", "spotify", "soundcloud", "deezer", "website"] as const
export type SocialKey = (typeof SOCIAL_KEYS)[number]
export type ArtistPageSocials = Partial<Record<SocialKey, string>>

export interface ArtistPageContent {
  bannerPath: string | null
  avatarPath: string | null
  tagline: string
  about: string
  eventTypes: string[]
  musicGenres: string[]
  gallery: string[]
  videos: ArtistPageVideo[]
  socials: ArtistPageSocials
}

export function emptyPageContent(): ArtistPageContent {
  return {
    bannerPath: null,
    avatarPath: null,
    tagline: "",
    about: "",
    eventTypes: [],
    musicGenres: [],
    gallery: [],
    videos: [],
    socials: {},
  }
}

export const PAGE_LIMITS = {
  tagline: 120,
  about: 3000,
  tag: 40,
  tags: 20,
  gallery: 24,
  videos: 6,
  videoTitle: 80,
  url: 300,
} as const

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"] as const

export const MEDIA_PREFIX = "artist-pages/"

export function mediaUrl(pathname: string) {
  return `/api/artist-media?pathname=${encodeURIComponent(pathname)}`
}

export function getVideoEmbed(url: string): { provider: "youtube" | "vimeo"; embedUrl: string } | null {
  try {
    const parsed = new URL(url)
    const host = parsed.hostname.replace(/^www\./, "")
    if (host === "youtu.be") {
      const id = parsed.pathname.slice(1)
      return id ? { provider: "youtube", embedUrl: `https://www.youtube-nocookie.com/embed/${id}` } : null
    }
    if (host === "youtube.com" || host === "m.youtube.com") {
      const id = parsed.searchParams.get("v") ?? parsed.pathname.match(/^\/(?:embed|shorts)\/([\w-]+)/)?.[1]
      return id ? { provider: "youtube", embedUrl: `https://www.youtube-nocookie.com/embed/${id}` } : null
    }
    if (host === "vimeo.com") {
      const id = parsed.pathname.match(/^\/(\d+)/)?.[1]
      return id ? { provider: "vimeo", embedUrl: `https://player.vimeo.com/video/${id}` } : null
    }
  } catch {
    return null
  }
  return null
}
