export const EQUIPMENT_OPTIONS = [
  { id: "basic", label: "Basic DJ Package", priceCents: 45000 },
  { id: "cdj3000", label: "Pioneer CDJ-3000 (paar)", priceCents: 15000 },
  { id: "mixer", label: "DJM-900NXS2 Mixer", priceCents: 8000 },
  { id: "speakers", label: "QSC K12.2 Speakers (paar)", priceCents: 12000 },
  { id: "lighting", label: "Complete Lighting Package", priceCents: 18000 },
] as const

export type EquipmentId = (typeof EQUIPMENT_OPTIONS)[number]["id"]

export const TRAVEL_RATE_CENTS_PER_KM = 25
export const PLATFORM_FEE_RATE = 0.3

export function equipmentLabel(id: string) {
  return EQUIPMENT_OPTIONS.find((option) => option.id === id)?.label ?? id
}

export function parseHourlyRateCents(price: string | number | undefined) {
  if (typeof price === "number") return Math.round(price * 100)
  if (!price) return 0
  const digits = price.replace(/[^\d.,]/g, "").replace(",", ".")
  const value = Number.parseFloat(digits)
  return Number.isFinite(value) ? Math.round(value * 100) : 0
}

/** Hours between two "HH:MM" strings; an end time earlier than the start rolls over midnight. */
export function hoursBetween(startTime: string, endTime: string) {
  const [sh, sm] = startTime.split(":").map(Number)
  const [eh, em] = endTime.split(":").map(Number)
  if ([sh, sm, eh, em].some((n) => Number.isNaN(n))) return 0
  let minutes = eh * 60 + em - (sh * 60 + sm)
  if (minutes <= 0) minutes += 24 * 60
  return Math.round((minutes / 60) * 100) / 100
}

export function equipmentCents(ids: readonly string[]) {
  return ids.reduce((sum, id) => {
    const option = EQUIPMENT_OPTIONS.find((o) => o.id === id)
    return sum + (option?.priceCents ?? 0)
  }, 0)
}

export function travelCents(distanceKm: number) {
  return Math.round(distanceKm * 2 * TRAVEL_RATE_CENTS_PER_KM)
}

export function platformFeeCents(totalCents: number) {
  return Math.round(totalCents * PLATFORM_FEE_RATE)
}

export interface PricingInput {
  hourlyRateCents: number
  startTime: string
  endTime: string
  equipment: readonly string[]
  distanceKm: number
}

export interface Pricing {
  hours: number
  hourlyRateCents: number
  performanceCents: number
  equipmentCents: number
  travelCents: number
  totalCents: number
  platformFeeCents: number
  payoutCents: number
}

export function calculatePricing(input: PricingInput): Pricing {
  const hours = hoursBetween(input.startTime, input.endTime)
  const performance = Math.round(hours * input.hourlyRateCents)
  const equipment = equipmentCents(input.equipment)
  const travel = travelCents(input.distanceKm)
  const total = performance + equipment + travel
  const fee = platformFeeCents(total)
  return {
    hours,
    hourlyRateCents: input.hourlyRateCents,
    performanceCents: performance,
    equipmentCents: equipment,
    travelCents: travel,
    totalCents: total,
    platformFeeCents: fee,
    payoutCents: total - fee,
  }
}

/** One bookable item from the professional's own profile: their equipment package or one of their extras. */
export interface BookingOption {
  id: string
  label: string
  priceCents: number
  description?: string
  /** URL of the photo from the profile. */
  imageUrl?: string
  /** The parts of the equipment package, as listed on the profile. */
  items?: { label: string; description?: string; imageUrl?: string; priceCents: number }[]
}

/** Everything the price of a booking depends on, taken from the professional's profile and billing settings. */
export interface BookingOptions {
  hourlyRateCents: number
  minHours: number
  maxHours: number
  rangeKm: number
  /** The equipment package (artists); null when the professional has none, e.g. photographers. */
  package: BookingOption | null
  extras: BookingOption[]
  /** VAT in percent on top of the prices; both 0 for professionals under the KOR scheme. */
  vat: { performanceRate: number; equipmentRate: number }
}

export const PACKAGE_OPTION_ID = "package"

export interface Quote extends Pricing {
  netCents: number
  vatCents: number
  /** Labels of the chosen equipment, as stored on the booking. */
  equipmentLabels: string[]
}

export function vatOn(netCents: number, rate: number) {
  return Math.round((netCents * rate) / 100)
}

/** "min" or "max" when the booked hours fall outside the professional's limits. */
export function hoursProblem(options: Pick<BookingOptions, "minHours" | "maxHours">, hours: number): "min" | "max" | null {
  if (hours < options.minHours) return "min"
  if (hours > options.maxHours) return "max"
  return null
}

/**
 * Prices are excl. VAT. VAT follows the invoice rules: the performance rate on the performance and travel,
 * the standard rate on equipment rental. The platform fee is a share of the amount excl. VAT.
 */
export function priceBooking(options: BookingOptions, input: Omit<PricingInput, "hourlyRateCents">): Quote {
  const hours = hoursBetween(input.startTime, input.endTime)
  const performance = Math.round(hours * options.hourlyRateCents)
  const chosen = [options.package, ...options.extras].filter(
    (option): option is BookingOption => option !== null && input.equipment.includes(option.id),
  )
  const equipment = chosen.reduce((sum, option) => sum + option.priceCents, 0)
  const travel = travelCents(input.distanceKm)
  const net = performance + equipment + travel
  const vat =
    vatOn(performance, options.vat.performanceRate) +
    vatOn(travel, options.vat.performanceRate) +
    vatOn(equipment, options.vat.equipmentRate)
  const fee = platformFeeCents(net)
  return {
    hours,
    hourlyRateCents: options.hourlyRateCents,
    performanceCents: performance,
    equipmentCents: equipment,
    travelCents: travel,
    netCents: net,
    vatCents: vat,
    totalCents: net + vat,
    platformFeeCents: fee,
    payoutCents: net + vat - fee,
    equipmentLabels: chosen.map((option) => option.label),
  }
}

/**
 * VAT included in a stored booking. Bookings made since prices are excl. VAT store the parts excl. VAT and
 * the total incl. VAT; older bookings stored a total that already contained VAT, so the difference is 0.
 */
export function bookingVatCents(booking: { hours: string | number; hourlyRateCents: number; equipmentCents: number; travelCents: number; totalCents: number }) {
  const parts = Math.round(Number(booking.hours) * booking.hourlyRateCents) + booking.equipmentCents + booking.travelCents
  return Math.max(0, booking.totalCents - parts)
}

export function formatEuro(cents: number, locale = "nl-NL") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(cents / 100)
}
