import "server-only"

// OpenStreetMap's public geocoder; its usage policy asks for an identifying user agent and at most one
// request per second, which booking traffic stays well under.
const GEOCODER = "https://nominatim.openstreetmap.org/search"

interface Hit {
  lat: string
  lon: string
  class?: string
  name?: string
}
type Point = { lat: number; lon: number }

const plain = (value: string) => value.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim()

/**
 * A place abroad ("Londen", "New York") is not in the searched countries, but a street, shop or building with
 * that name is. Such a hit only counts when the text says more than the name, like the town it is in.
 */
function isOnlyNamesake(place: string, hit: Hit) {
  return ["highway", "shop", "building"].includes(hit.class ?? "") && plain(hit.name ?? "") === plain(place)
}

/** The coordinates of a place; null when there is no such place and "unavailable" when the geocoder fails. */
async function geocode(place: string): Promise<Point | null | "unavailable"> {
  const url = `${GEOCODER}?format=json&limit=1&countrycodes=nl,be,de&q=${encodeURIComponent(place)}`
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "ARSIEvents-Booking-App" },
      signal: AbortSignal.timeout(5000),
      next: { revalidate: 60 * 60 * 24 * 30 },
    })
    if (!response.ok) return "unavailable"
    const [hit] = (await response.json()) as Hit[]
    if (!hit || isOnlyNamesake(place, hit)) return null
    const lat = Number.parseFloat(hit.lat)
    const lon = Number.parseFloat(hit.lon)
    return Number.isFinite(lat) && Number.isFinite(lon) ? { lat, lon } : null
  } catch {
    return "unavailable"
  }
}

/**
 * Straight-line distance in whole km from the professional's town to the event. Null when the event place does
 * not exist; "unavailable" when it cannot be determined now.
 */
export async function distanceBetween(from: string, to: string): Promise<number | null | "unavailable"> {
  const [a, b] = await Promise.all([geocode(from), geocode(to)])
  if (b === null) return null
  if (a === null || a === "unavailable" || b === "unavailable") return "unavailable"
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLon = ((b.lon - a.lon) * Math.PI) / 180
  const h = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2
  return Math.round(R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)))
}
