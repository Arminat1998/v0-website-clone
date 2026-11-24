import { canonicalEventType, canonicalGenre } from "@/lib/profile-options"
import { parseHourlyRateCents } from "@/lib/bookings/pricing"

/** What the form needs to start over for a replacement: the wishes of an earlier request, without personal data or files. */
export interface BookingTemplate {
  fromBookingId: number
  professionalType: "artist" | "photographer"
  previousProfessionalName: string
  /** Empty when the earlier date has passed. */
  eventDate: string
  eventName: string
  startTime: string
  endTime: string
  eventTypes: string[]
  musicGenres: string[]
  capacity: string
  description: string
  specialRequests: string
  dressCode: string
  playlistLink: string
  openingDanceLink: string
  lastSongLink: string
  street: string
  houseNumber: string
  houseNumberExt: string
  postalCode: string
  city: string
  country: string
  /** The choice for the professional's own equipment package; extras differ per professional. */
  wantsPackage: boolean
  /** The earlier request had equipment chosen (the choice is not copied for another professional). */
  hadEquipment: boolean
  /** The earlier request had uploaded music files (files are never copied). */
  hadMusicFiles: boolean
}

export interface ReplacementSuggestion {
  id: string
  type: "artist" | "photographer"
  name: string
  specialty: string
  location: string
  hourlyRateCents: number
  rating: number
  reviews: number
  image: string | null
  /** 0-100. */
  match: number
  reasons: ReplacementReason[]
  /** The genres of the wishes (or the previous act) that this professional also plays, canonical keys. */
  sharedGenres: string[]
  /** Rate compared with the previous professional, in whole percent (negative = cheaper); null when unknown. */
  rateDiffPercent: number | null
  href: string
}

/** Qualitative label for a match score. */
export type MatchLevel = "strong" | "good" | "possible"
export const MIN_MATCH = 50
export function matchLevel(match: number): MatchLevel {
  return match >= 80 ? "strong" : match >= 60 ? "good" : "possible"
}

export type ReplacementReason = "type" | "genres" | "price" | "city" | "eventTypes"

/** The comparable facts of a professional. */
export interface ReplacementProfile {
  specialty: string
  genres: string[]
  allround: boolean
  eventTypes: string[]
  hourlyRateCents: number
  city: string
}

const norm = (value: string) => value.trim().toLowerCase()
const genreSet = (genres: string[]) => new Set(genres.map((genre) => norm(canonicalGenre(genre))))
const eventSet = (types: string[]) => new Set(types.map((type) => norm(canonicalEventType(type))))

function overlap(a: Set<string>, b: Set<string>) {
  if (!a.size || !b.size) return 0
  let shared = 0
  for (const value of a) if (b.has(value)) shared += 1
  return shared / Math.min(a.size, b.size)
}

/** How well a candidate replaces the previous professional: same kind of act, shared genres, similar rate, same area. */
export function scoreReplacement(
  previous: ReplacementProfile,
  candidate: ReplacementProfile,
  wishedGenres: string[] = [],
): { match: number; reasons: ReplacementReason[] } {
  const reasons: ReplacementReason[] = []
  let score = 0

  const sameType = !!previous.specialty && norm(previous.specialty) === norm(candidate.specialty)
  if (sameType) {
    score += 35
    reasons.push("type")
  }

  // The genres of the customer's wishes count as well as those of the previous act.
  const wanted = genreSet([...previous.genres, ...wishedGenres])
  let genreFit = 0
  if (candidate.allround && (wanted.size || previous.allround)) genreFit = 1
  else if (previous.allround && candidate.genres.length) genreFit = 0.5
  else genreFit = overlap(wanted, genreSet(candidate.genres))
  if (genreFit > 0) {
    score += Math.round(30 * genreFit)
    if (genreFit >= 0.34) reasons.push("genres")
  }

  if (previous.hourlyRateCents > 0 && candidate.hourlyRateCents > 0) {
    const gap = Math.abs(candidate.hourlyRateCents - previous.hourlyRateCents) / previous.hourlyRateCents
    const priceFit = Math.max(0, 1 - gap)
    score += Math.round(20 * priceFit)
    if (gap <= 0.25) reasons.push("price")
  }

  if (previous.city && norm(previous.city) === norm(candidate.city)) {
    score += 10
    reasons.push("city")
  }

  const eventFit = overlap(eventSet(previous.eventTypes), eventSet(candidate.eventTypes))
  if (eventFit > 0) {
    score += Math.round(5 * eventFit)
    if (eventFit >= 0.5) reasons.push("eventTypes")
  }

  return { match: Math.min(100, score), reasons }
}

/** The genres of the wishes and the previous act that the candidate also plays (canonical keys, in the order of the wishes). */
export function sharedGenres(previous: ReplacementProfile, candidate: ReplacementProfile, wishedGenres: string[] = []): string[] {
  const own = genreSet(candidate.genres)
  const seen = new Set<string>()
  const result: string[] = []
  for (const genre of [...wishedGenres, ...previous.genres]) {
    const key = canonicalGenre(genre)
    const n = norm(key)
    if (seen.has(n)) continue
    seen.add(n)
    if (own.has(n)) result.push(key)
  }
  return result
}

/** Rate difference in whole percent against the previous professional; null when either rate is unknown. */
export function rateDiffPercent(previous: ReplacementProfile, candidate: ReplacementProfile): number | null {
  if (previous.hourlyRateCents <= 0 || candidate.hourlyRateCents <= 0) return null
  return Math.round(((candidate.hourlyRateCents - previous.hourlyRateCents) / previous.hourlyRateCents) * 100)
}

export const rateCents = parseHourlyRateCents

/** The booking form link for a replacement; the template fills in the wishes. */
export function replacementHref(type: "artist" | "photographer", id: string, fromBookingId: number) {
  const professional = type === "artist" ? `artistId=${encodeURIComponent(id)}` : `professionalId=${encodeURIComponent(id)}&type=photographer`
  return `/booking?${professional}&fromBookingId=${fromBookingId}`
}
