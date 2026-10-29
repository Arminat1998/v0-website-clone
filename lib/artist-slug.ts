import { enhancedArtists, type Artist } from "@/lib/smart-search"

export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " en ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

const nameCounts = enhancedArtists.reduce<Record<string, number>>((counts, artist) => {
  const base = slugify(artist.name)
  counts[base] = (counts[base] ?? 0) + 1
  return counts
}, {})

// Names that are shared by several artists get the id appended so every URL stays unique.
export function getArtistSlug(artist: Artist) {
  const base = slugify(artist.name) || "artiest"
  return nameCounts[base] > 1 ? `${base}-${artist.id}` : base
}

export function getArtistPath(artist: Artist) {
  return `/artiest/${getArtistSlug(artist)}`
}

export function getArtistBySlug(slug: string) {
  return enhancedArtists.find((artist) => getArtistSlug(artist) === slug)
}
