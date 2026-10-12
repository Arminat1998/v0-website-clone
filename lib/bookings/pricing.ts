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
  const fee = Math.round(total * PLATFORM_FEE_RATE)
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

export function formatEuro(cents: number, locale = "nl-NL") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(cents / 100)
}
