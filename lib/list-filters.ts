// The filters of the artist list and the photo & video list: one shape, one way to apply them.

import { canonicalCity, normalizeText } from "@/lib/city-names"
import { townDistance } from "@/lib/places"
import { demoEventLabel, demoStyleLabel } from "@/lib/demo-labels"
import type { Language } from "@/lib/i18n"
import { formatEventDate, todayIso } from "@/lib/bookings/format"
import { formatEuro, parseHourlyRateCents } from "@/lib/bookings/pricing"
import {
  ARTIST_TYPES,
  PHOTO_SPECIALTY_GROUPS,
  PHOTO_VIDEO_TYPES,
  canonicalEventType,
  canonicalGenre,
  eventTypeLabel,
  genreLabel,
  tagKey,
} from "@/lib/profile-options"
import type { Artist } from "@/lib/smart-search"

/** Which list: artists, or photographers and videographers. */
export type ProfessionalKind = "artist" | "photo-video"

export interface ListFilters {
  categories: string[]
  genres: string[]
  eventTypes: string[]
  /** YYYY-MM-DD, or empty. */
  selectedDate: string
  city: string
  /** Hours; not a filter (profiles do not list their hours here), only used to estimate a budget per hour. */
  duration: string
  /** Euros per hour, excl. VAT. */
  priceRange: [number, number]
  /** Total budget in euros, 0 when unknown. Not a filter: rates are per hour. */
  budget: number
}

export const PRICE_MIN = 0
/** The slider ends here; at this value there is no upper limit. */
export const PRICE_MAX = 5000

export const NO_FILTERS: ListFilters = {
  categories: [],
  genres: [],
  eventTypes: [],
  selectedDate: "",
  city: "",
  duration: "",
  priceRange: [PRICE_MIN, PRICE_MAX],
  budget: 0,
}

export type FilterKey = keyof ListFilters

/** The parts of an artist or photographer the lists filter and sort on. */
export type ListedProfessional = Pick<
  Artist,
  "id" | "name" | "price" | "location" | "specialty" | "rating" | "reviews" | "available" | "category" | "artistTypes" | "musicStyles" | "eventTypes" | "availableDates" | "unavailableDates" | "minHours" | "maxHours" | "rangeKm"
>

function hasPriceFilter([min, max]: [number, number]) {
  return min > PRICE_MIN || max < PRICE_MAX
}

/** True when the filter is set. */
export function isFilterSet(filters: ListFilters, key: FilterKey) {
  if (key === "priceRange") return hasPriceFilter(filters.priceRange)
  if (key === "budget") return filters.budget > 0
  const value = filters[key]
  return Array.isArray(value) ? value.length > 0 : value.trim() !== ""
}

function hourlyRate(professional: ListedProfessional) {
  return parseHourlyRateCents(professional.price) / 100
}

/** "Hip-Hop", "hiphop" and "Hip Hop" are one tag; a tag also matches when one contains the other. */
function sameTag(a: string, b: string) {
  const [x, y] = [tagKey(a), tagKey(b)]
  return x !== "" && y !== "" && (x.includes(y) || y.includes(x))
}

/** Someone who does both photo and video counts as a photographer and as a videographer. */
function hasCategory(professional: ListedProfessional, category: string) {
  return [professional.category ?? "", ...(professional.artistTypes ?? [])].some(
    (own) => own === category || own.split(" & ").includes(category),
  )
}

function isFreeOn(professional: ListedProfessional, date: string) {
  if (professional.unavailableDates?.includes(date)) return false
  return Boolean(professional.availableDates?.includes(date)) || professional.available
}

/** How far someone lives from the searched city; null when that is the same town or the distance is unknown. */
export function distanceToCity(professional: Pick<ListedProfessional, "location">, city: string): number | null {
  return city.trim() ? townDistance(professional.location, city) || null : null
}

/** Based in the city, or (real profiles) willing to travel there. */
function servesCity(professional: ListedProfessional, city: string) {
  if (normalizeText(canonicalCity(professional.location)).includes(normalizeText(canonicalCity(city)))) return true
  const distance = professional.rangeKm ? townDistance(professional.location, city) : null
  return distance !== null && distance <= (professional.rangeKm ?? 0)
}

export function filterProfessionals<T extends ListedProfessional>(list: T[], filters: ListFilters): T[] {
  const { categories, genres, eventTypes, selectedDate, priceRange } = filters
  const hours = Number(filters.duration) || 0
  const city = filters.city.trim()
  const [min, max] = priceRange[0] <= priceRange[1] ? priceRange : [priceRange[1], priceRange[0]]
  const found = list.filter((professional) => {
    if (categories.length > 0 && !categories.some((category) => hasCategory(professional, category))) return false
    const rate = hourlyRate(professional)
    if (rate < min || (max < PRICE_MAX && rate > max)) return false
    if (city && !servesCity(professional, city)) return false
    if (
      genres.length > 0 &&
      !genres.some(
        (genre) =>
          professional.musicStyles?.some((style) => sameTag(style, genre)) ||
          professional.specialty.toLowerCase().includes(genre.toLowerCase()),
      )
    ) {
      return false
    }
    if (eventTypes.length > 0 && !eventTypes.some((type) => professional.eventTypes?.some((own) => sameTag(own, type)))) return false
    if (selectedDate && !isFreeOn(professional, selectedDate)) return false
    if (hours > 0 && (hours < (professional.minHours ?? 1) || hours > (professional.maxHours ?? 8))) return false
    return true
  })
  // Nearest first; the sort is stable, so the rest of the order stays.
  return city ? found.sort((a, b) => (distanceToCity(a, city) ?? 0) - (distanceToCity(b, city) ?? 0)) : found
}

export const SORT_OPTIONS = ["relevance", "price-low", "price-high", "rating", "popularity", "availability"] as const

const SORTERS: Record<string, (a: ListedProfessional, b: ListedProfessional) => number> = {
  "price-low": (a, b) => hourlyRate(a) - hourlyRate(b),
  "price-high": (a, b) => hourlyRate(b) - hourlyRate(a),
  rating: (a, b) => b.rating - a.rating,
  popularity: (a, b) => b.reviews - a.reviews,
  // Available first, then the fewest booked dates.
  availability: (a, b) =>
    Number(b.available) - Number(a.available) || (a.unavailableDates?.length ?? 0) - (b.unavailableDates?.length ?? 0),
}

/** Real professionals always come before the sample profiles, whose ratings are made up. */
export function sortProfessionals<T extends ListedProfessional>(list: T[], sortBy: string, isSample: (id: T["id"]) => boolean): T[] {
  const sorter = SORTERS[sortBy] ?? (() => 0)
  return [...list].sort((a, b) => Number(isSample(a.id)) - Number(isSample(b.id)) || sorter(a, b))
}

// Labels

export function typeLabel(value: string, nl: boolean) {
  const type = [...ARTIST_TYPES, ...PHOTO_VIDEO_TYPES].find((option) => option.value === value)
  return type ? (nl ? type.nl : type.en) : value
}

/** The label of a genre or specialisation, however it is written on a profile. */
export function styleLabel(raw: string, nl: boolean) {
  const key = tagKey(raw)
  for (const group of PHOTO_SPECIALTY_GROUPS) {
    const option = group.options.find((item) => [item.value, item.nl, item.en].some((name) => tagKey(name) === key))
    if (option) return nl ? option.nl : option.en
  }
  return (nl && demoStyleLabel(raw)) || genreLabel(canonicalGenre(raw), nl)
}

/** The label of an event type, however it is written on a profile. */
export function eventLabel(raw: string, nl: boolean) {
  const label = eventTypeLabel(canonicalEventType(raw), nl)
  return (nl && label === raw && demoEventLabel(raw)) || label
}

/** The tags of a profile in the current language, without doubles ("club" and "Club Night" are both "Clubavond"). */
export function tagLabels(tags: string[] | undefined, label: (raw: string, nl: boolean) => string, nl: boolean) {
  const labels = (tags ?? []).map((tag) => label(tag, nl))
  return [...new Set(labels.map((text) => text.charAt(0).toUpperCase() + text.slice(1)))]
}

export function formatHours(hours: string, nl: boolean) {
  const value = Number(hours.replace(",", "."))
  if (!Number.isFinite(value)) return hours
  return `${value.toLocaleString(nl ? "nl-NL" : "en-GB")} ${nl ? "uur" : value === 1 ? "hour" : "hours"}`
}

function priceLabel([min, max]: [number, number], nl: boolean) {
  const euro = (amount: number) => formatEuro(amount * 100, nl ? "nl-NL" : "en-GB")
  const perHour = nl ? "per uur" : "per hour"
  if (max >= PRICE_MAX) return `${nl ? "vanaf" : "from"} ${euro(min)} ${perHour}`
  if (min <= PRICE_MIN) return `max. ${euro(max)} ${perHour}`
  return `${euro(min)}–${euro(max)} ${perHour}`
}

/** The value of a filter in words, or null when it is not set. */
export function filterLabel(filters: ListFilters, key: FilterKey, language: Language): string | null {
  if (!isFilterSet(filters, key)) return null
  const nl = language === "nl"
  switch (key) {
    case "categories":
      return filters.categories.map((value) => typeLabel(value, nl)).join(", ")
    case "genres":
      return filters.genres.map((value) => styleLabel(value, nl)).join(", ")
    case "eventTypes":
      return filters.eventTypes.map((value) => eventLabel(value, nl)).join(", ")
    case "selectedDate":
      return formatEventDate(filters.selectedDate, nl ? "nl-NL" : "en-GB", "short")
    case "city":
      return filters.city
    case "duration":
      return formatHours(filters.duration, nl)
    case "priceRange":
      return priceLabel(filters.priceRange, nl)
    case "budget":
      return `budget ${formatEuro(filters.budget * 100, nl ? "nl-NL" : "en-GB")}`
  }
}

const LABEL_ORDER: FilterKey[] = ["categories", "eventTypes", "selectedDate", "city", "duration", "priceRange", "budget", "genres"]

/** Everything that is set, in words and in a fixed order. */
export function activeFilters(filters: ListFilters, language: Language): { key: FilterKey; label: string }[] {
  return LABEL_ORDER.flatMap((key) => {
    const label = filterLabel(filters, key, language)
    return label ? [{ key, label }] : []
  })
}

/** Filters that decide which professionals are shown; the total budget does not. */
export const RESULT_FILTERS: FilterKey[] = ["categories", "eventTypes", "selectedDate", "city", "duration", "priceRange", "genres"]

export function withoutFilter(filters: ListFilters, key: FilterKey): ListFilters {
  return { ...filters, [key]: NO_FILTERS[key] }
}

function sameValue(a: unknown, b: unknown) {
  return JSON.stringify(a) === JSON.stringify(b)
}

/**
 * Lets the filters follow the search text while it is typed. A filter that came from the text changes or
 * disappears with it; a filter the user set or changed stays as it is.
 */
export function followText(current: ListFilters, before: Partial<ListFilters>, after: Partial<ListFilters>): ListFilters {
  const next: Record<string, unknown> = { ...current }
  for (const key of Object.keys(NO_FILTERS) as FilterKey[]) {
    if (sameValue(before[key], after[key])) continue
    if (after[key] !== undefined) next[key] = after[key]
    else if (sameValue(current[key], before[key])) next[key] = NO_FILTERS[key]
  }
  return next as unknown as ListFilters
}

/** Filters from outside (the URL or an earlier visit): unknown keys are dropped, invalid values ignored. */
export function cleanFilters(raw: Partial<Record<FilterKey, unknown>>): ListFilters {
  const texts = (value: unknown) => (Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item !== "") : [])
  const text = (value: unknown) => (typeof value === "string" ? value.trim().slice(0, 60) : "")
  const date = text(raw.selectedDate)
  const [min, max] = Array.isArray(raw.priceRange) ? raw.priceRange.map(Number) : [Number.NaN, Number.NaN]
  const limit = (value: number, fallback: number) => (Number.isFinite(value) ? Math.min(PRICE_MAX, Math.max(PRICE_MIN, Math.round(value))) : fallback)
  const range = [limit(min, PRICE_MIN), limit(max, PRICE_MAX)].sort((a, b) => a - b) as [number, number]
  const budget = Number(raw.budget)
  return {
    categories: texts(raw.categories),
    genres: [...new Set(texts(raw.genres).map(canonicalGenre))],
    eventTypes: [...new Set(texts(raw.eventTypes).map(canonicalEventType))],
    selectedDate: isRealDate(date) && date >= todayIso() ? date : "",
    city: canonicalCity(text(raw.city)),
    duration: cleanDuration(text(raw.duration)),
    priceRange: range,
    budget: Number.isFinite(budget) && budget > 0 ? Math.round(budget) : 0,
  }
}

/** Hours between 1 and 24, in halves; anything else is empty. */
export function cleanDuration(raw: string) {
  const value = Number(raw.replace(",", "."))
  if (!Number.isFinite(value) || value <= 0) return ""
  return String(Math.min(24, Math.max(1, Math.round(value * 2) / 2)))
}

export function isRealDate(iso: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!match) return false
  const [year, month, day] = match.slice(1).map(Number)
  const date = new Date(year, month - 1, day)
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
}

// The filters in the address bar, so a list can be shared and restored.

function typesParam(kind: ProfessionalKind) {
  return kind === "artist" ? "artistTypes" : "serviceTypes"
}

export function filtersToParams(kind: ProfessionalKind, query: string, filters: ListFilters) {
  const params = new URLSearchParams()
  const set = (name: string, value: string) => value && params.set(name, value)
  set("q", query.trim())
  set(typesParam(kind), filters.categories.join(","))
  set("genres", filters.genres.join(","))
  set("eventTypes", filters.eventTypes.join(","))
  set("date", filters.selectedDate)
  set("location", filters.city)
  set("duration", filters.duration)
  if (filters.priceRange[0] > PRICE_MIN) set("minPrice", String(filters.priceRange[0]))
  if (filters.priceRange[1] < PRICE_MAX) set("maxPrice", String(filters.priceRange[1]))
  if (filters.budget > 0) set("budget", String(filters.budget))
  return params
}

/** Null for the filters when the address only holds a search text (or nothing). */
export function filtersFromParams(kind: ProfessionalKind, params: URLSearchParams): { query: string; filters: ListFilters | null } {
  const list = (name: string) => params.get(name)?.split(",") ?? []
  const names = [typesParam(kind), "genres", "eventTypes", "date", "location", "duration", "minPrice", "maxPrice", "budget"]
  const query = params.get("q") ?? params.get("search") ?? ""
  if (!names.some((name) => params.get(name))) return { query, filters: null }
  return {
    query,
    filters: cleanFilters({
      categories: list(typesParam(kind)),
      genres: kind === "artist" ? list("genres") : [],
      eventTypes: list("eventTypes"),
      selectedDate: params.get("date") ?? "",
      city: params.get("location") ?? "",
      duration: params.get("duration") ?? "",
      priceRange: [params.get("minPrice") ?? Number.NaN, params.get("maxPrice") ?? Number.NaN].map(Number),
      budget: params.get("budget"),
    }),
  }
}
