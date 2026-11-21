import "server-only"

// OpenStreetMap's public geocoder; its usage policy asks for an identifying user agent and at most one
// request per second, which booking traffic stays well under.
const GEOCODER = "https://nominatim.openstreetmap.org/search"

async function geocode(place: string): Promise<{ lat: number; lon: number } | null> {
  const url = `${GEOCODER}?format=json&limit=1&countrycodes=nl,be,de&q=${encodeURIComponent(place)}`
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "ARSIEvents-Booking-App" },
      signal: AbortSignal.timeout(5000),
      next: { revalidate: 60 * 60 * 24 * 30 },
    })
    if (!response.ok) return null
    const [hit] = (await response.json()) as { lat: string; lon: string }[]
    if (!hit) return null
    const lat = Number.parseFloat(hit.lat)
    const lon = Number.parseFloat(hit.lon)
    return Number.isFinite(lat) && Number.isFinite(lon) ? { lat, lon } : null
  } catch {
    return null
  }
}

/** Straight-line distance in whole km between two places, or null when one of them cannot be found. */
export async function distanceBetween(from: string, to: string): Promise<number | null> {
  const [a, b] = await Promise.all([geocode(from), geocode(to)])
  if (!a || !b) return null
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLon = ((b.lon - a.lon) * Math.PI) / 180
  const h = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2
  return Math.round(R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)))
}
