import "server-only"

// PDOK Locatieserver: the Dutch government's free address register (BAG), no key needed.
const LOCATIESERVER = "https://api.pdok.nl/bzk/locatieserver/search/v3_1/free"

export interface DutchAddress {
  street: string
  houseNumber: string
  houseNumberExt: string
  postalCode: string
  city: string
  country: "Nederland"
  lat: number
  lon: number
}

interface Doc {
  straatnaam?: string
  huisnummer?: number
  huisletter?: string
  huisnummertoevoeging?: string
  postcode?: string
  woonplaatsnaam?: string
  centroide_ll?: string
}

/** "3511 ab" → "3511AB"; null when it is not a Dutch postal code. */
export function normalizePostcode(value: string) {
  const compact = String(value ?? "").toUpperCase().replace(/\s+/g, "")
  return /^[1-9]\d{3}[A-Z]{2}$/.test(compact) ? compact : null
}

const plainExt = (value: string) => String(value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "")

/**
 * The exact address for a Dutch postal code and house number (with an optional letter or addition).
 * Null when there is no such address, "unavailable" when the register does not answer.
 */
export async function lookupDutchAddress(postalCode: string, houseNumber: string, houseNumberExt = ""): Promise<DutchAddress | null | "unavailable"> {
  const postcode = normalizePostcode(postalCode)
  const number = String(houseNumber ?? "").trim()
  if (!postcode || !/^\d{1,5}$/.test(number)) return null
  const params = new URLSearchParams({
    q: `postcode:${postcode} AND huisnummer:${Number(number)}`,
    fq: "type:adres",
    rows: "50",
    fl: "straatnaam,huisnummer,huisletter,huisnummertoevoeging,postcode,woonplaatsnaam,centroide_ll",
  })
  let docs: Doc[]
  try {
    const response = await fetch(`${LOCATIESERVER}?${params}`, {
      signal: AbortSignal.timeout(5000),
      next: { revalidate: 60 * 60 * 24 * 30 },
    })
    if (!response.ok) return "unavailable"
    docs = ((await response.json()) as { response?: { docs?: Doc[] } }).response?.docs ?? []
  } catch {
    return "unavailable"
  }
  const wanted = plainExt(houseNumberExt)
  const extOf = (doc: Doc) => plainExt(`${doc.huisletter ?? ""}${doc.huisnummertoevoeging ?? ""}`)
  // Without an addition the plain number is meant; with one, it has to exist at this address.
  const doc = docs.find((d) => extOf(d) === wanted) ?? (wanted ? undefined : docs[0])
  if (!doc?.straatnaam || !doc.woonplaatsnaam || !doc.centroide_ll) return null
  const point = /POINT\(([-\d.]+) ([-\d.]+)\)/.exec(doc.centroide_ll)
  if (!point) return null
  return {
    street: doc.straatnaam,
    houseNumber: String(doc.huisnummer ?? number),
    houseNumberExt: `${doc.huisletter ?? ""}${doc.huisnummertoevoeging ? (doc.huisletter ? "-" : "") + doc.huisnummertoevoeging : ""}`,
    postalCode: `${postcode.slice(0, 4)} ${postcode.slice(4)}`,
    city: doc.woonplaatsnaam,
    country: "Nederland",
    lon: Number.parseFloat(point[1]),
    lat: Number.parseFloat(point[2]),
  }
}
