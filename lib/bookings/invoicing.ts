import type { BillingProfile, Booking, Invoice, InvoiceLine } from "@/lib/db/schema"
import { EQUIPMENT_OPTIONS, TRAVEL_RATE_CENTS_PER_KM, bookingVatCents, platformFeeCents, travelCents, vatOn } from "@/lib/bookings/pricing"
import { isSafeBlobPath } from "@/lib/blob-paths"
import { todayIso } from "@/lib/bookings/format"

/** Dutch VAT rates in percent. Equipment rental is always standard-rated; a live performance by a
 *  performing artist is reduced-rated; passed-on costs (travel) follow the rate of the main service. */
export const STANDARD_VAT_RATE = 21
export const REDUCED_VAT_RATE = 9
export const PERFORMANCE_VAT_RATES = [REDUCED_VAT_RATE, STANDARD_VAT_RATE] as const

export const MAX_INVOICE_FILE_BYTES = 10 * 1024 * 1024
export const INVOICE_FILE_TYPES = ["application/pdf", "image/jpeg", "image/png"] as const

/** Splits a VAT-inclusive amount into net and VAT, rounding to whole cents so the two always add up. */
export function splitGross(grossCents: number, vatRate: number) {
  const netCents = Math.round(grossCents / (1 + vatRate / 100))
  return { netCents, vatCents: grossCents - netCents }
}

export interface InvoiceTotals {
  netCents: number
  vatCents: number
  totalCents: number
  /** VAT grouped per rate, as required on a Dutch invoice. */
  vatBreakdown: { rate: number; netCents: number; vatCents: number }[]
}

export function sumInvoiceLines(lines: InvoiceLine[]): InvoiceTotals {
  const byRate = new Map<number, { rate: number; netCents: number; vatCents: number }>()
  for (const line of lines) {
    const entry = byRate.get(line.vatRate) ?? { rate: line.vatRate, netCents: 0, vatCents: 0 }
    entry.netCents += line.netCents
    entry.vatCents += line.vatCents
    byRate.set(line.vatRate, entry)
  }
  const vatBreakdown = [...byRate.values()].sort((a, b) => a.rate - b.rate)
  return {
    netCents: lines.reduce((sum, l) => sum + l.netCents, 0),
    vatCents: lines.reduce((sum, l) => sum + l.vatCents, 0),
    totalCents: lines.reduce((sum, l) => sum + l.grossCents, 0),
    vatBreakdown,
  }
}

type PricedBooking = Pick<
  Booking,
  "hourlyRateCents" | "hours" | "equipmentCents" | "travelCents" | "totalCents" | "equipment" | "distanceKm" | "eventName" | "eventDate" | "professionalType"
>
type VatProfile = Pick<BillingProfile, "vatScheme" | "performanceVatRate">

/** Costs the professional may correct or add while submitting the invoice. */
export type ReceiptFile = NonNullable<InvoiceLine["receipt"]>
export interface ExtraCost {
  description: string
  amountCents: number
  receipt?: ReceiptFile | null
}
export interface InvoiceAdjustments {
  /** One-way distance in km; the invoice line bills the return trip. */
  distanceKm: number
  parkingCents: number
  parkingReceipt?: ReceiptFile | null
  extras: ExtraCost[]
}

function cleanReceipt(receipt: unknown): ReceiptFile {
  const r = receipt as Partial<ReceiptFile> | null | undefined
  if (!r || typeof r.pathname !== "string" || typeof r.name !== "string" || typeof r.size !== "number" || typeof r.contentType !== "string" || !(INVOICE_FILE_TYPES as readonly string[]).includes(r.contentType) || r.size <= 0 || r.size > MAX_INVOICE_FILE_BYTES) {
    throw new Error("RECEIPT_REQUIRED")
  }
  return { pathname: r.pathname, name: r.name.slice(0, 200), size: r.size, contentType: r.contentType }
}

/** Every parking and extra cost needs a receipt stored under this booking's own blob prefix. */
export function assertReceiptsOwned(adjustments: InvoiceAdjustments, prefix: string) {
  const receipts = [adjustments.parkingCents > 0 ? adjustments.parkingReceipt : undefined, ...adjustments.extras.map((e) => e.receipt)].filter((r) => r !== undefined)
  if (receipts.some((r) => !r || !isSafeBlobPath(r.pathname, prefix))) throw new Error("RECEIPT_REQUIRED")
}

export const MAX_DISTANCE_KM = 1500
export const MAX_PARKING_CENTS = 50_000
export const MAX_EXTRA_CENTS = 250_000
export const MAX_EXTRA_COSTS = 5

export function defaultAdjustments(booking: Pick<Booking, "distanceKm">): InvoiceAdjustments {
  return { distanceKm: booking.distanceKm, parkingCents: 0, extras: [] }
}

const clampInt = (value: unknown, max: number) => {
  const n = Math.round(Number(value))
  return Number.isFinite(n) ? Math.min(Math.max(n, 0), max) : 0
}

/** Normalises untrusted adjustment input: clamps ranges, drops empty extras, limits the list. */
export function sanitizeAdjustments(input: Partial<InvoiceAdjustments> | undefined, booking: Pick<Booking, "distanceKm">): InvoiceAdjustments {
  if (!input) return defaultAdjustments(booking)
  const valid = (n: unknown, max: number) => typeof n === "number" && Number.isSafeInteger(n) && n >= 0 && n <= max
  if (!valid(input.distanceKm, MAX_DISTANCE_KM) || !valid(input.parkingCents, MAX_PARKING_CENTS) || !Array.isArray(input.extras) || input.extras.length > MAX_EXTRA_COSTS || input.extras.some((e) => !e || typeof e.description !== "string" || !e.description.trim() || e.description.length > 120 || !valid(e.amountCents, MAX_EXTRA_CENTS) || e.amountCents === 0)) {
    throw new Error("INVALID_INVOICE_COSTS")
  }
  const extras = (Array.isArray(input.extras) ? input.extras : [])
    .map((e) => ({ description: String(e?.description ?? "").trim().slice(0, 120), amountCents: clampInt(e?.amountCents, MAX_EXTRA_CENTS), receipt: cleanReceipt(e?.receipt) }))
    .filter((e) => e.description && e.amountCents > 0)
    .slice(0, MAX_EXTRA_COSTS)
  const parkingCents = clampInt(input.parkingCents, MAX_PARKING_CENTS)
  return {
    distanceKm: clampInt(input.distanceKm ?? booking.distanceKm, MAX_DISTANCE_KM),
    parkingCents,
    parkingReceipt: parkingCents > 0 ? cleanReceipt(input.parkingReceipt) : null,
    extras,
  }
}

/**
 * The platform fee is a percentage of the invoiced amount, so added costs raise the fee too. For bookings
 * priced excl. VAT the fee is taken from the amount excl. VAT; older bookings take it from the total.
 */
export function payoutFor(totals: Pick<InvoiceTotals, "totalCents" | "netCents">, vatExclusive: boolean) {
  const feeCents = platformFeeCents(vatExclusive ? totals.netCents : totals.totalCents)
  return { feeCents, payoutCents: totals.totalCents - feeCents }
}

/** True for bookings priced excl. VAT: their stored total is higher than the sum of its parts. */
export function isVatExclusive(booking: Pick<Booking, "hours" | "hourlyRateCents" | "equipmentCents" | "travelCents" | "totalCents">) {
  return bookingVatCents(booking) > 0
}

function line(
  key: InvoiceLine["key"],
  description: string,
  quantity: number,
  unitLabel: string,
  unitCents: number,
  grossCents: number,
  vatRate: number,
): InvoiceLine {
  const { netCents, vatCents } = splitGross(grossCents, vatRate)
  return { key, description, quantity, unitLabel, unitCents, vatRate, grossCents, vatCents, netCents }
}

/** A line for an amount excl. VAT: the VAT is added on top. */
function netLine(
  key: InvoiceLine["key"],
  description: string,
  quantity: number,
  unitLabel: string,
  unitCents: number,
  netCents: number,
  vatRate: number,
): InvoiceLine {
  const vatCents = vatOn(netCents, vatRate)
  return { key, description, quantity, unitLabel, unitCents, vatRate, grossCents: netCents + vatCents, vatCents, netCents }
}

/**
 * Builds the invoice lines for a booking. Bookings priced excl. VAT get the VAT added per line, so the
 * invoice total equals the quoted total incl. VAT. Older bookings stored amounts incl. VAT; for those the
 * VAT is extracted per line. Costs the professional adds follow the same convention as the booking.
 */
export function buildInvoiceLines(booking: PricedBooking, profile: VatProfile, adjustments: InvoiceAdjustments = defaultAdjustments(booking)): InvoiceLine[] {
  if (isVatExclusive(booking)) return buildNetInvoiceLines(booking, profile, adjustments)
  const kor = profile.vatScheme === "kor"
  const performanceRate = kor ? 0 : profile.performanceVatRate
  const equipmentRate = kor ? 0 : STANDARD_VAT_RATE
  const hours = Number(booking.hours)
  const performanceGross = Math.round(hours * booking.hourlyRateCents)

  const lines: InvoiceLine[] = [
    line(
      "performance",
      booking.professionalType === "photographer" ? `Fotografie ${booking.eventName}` : `DJ-optreden ${booking.eventName}`,
      hours,
      "uur",
      booking.hourlyRateCents,
      performanceGross,
      performanceRate,
    ),
  ]

  let equipmentAccounted = 0
  for (const id of booking.equipment) {
    const option = EQUIPMENT_OPTIONS.find((o) => o.id === id)
    if (!option) continue
    equipmentAccounted += option.priceCents
    lines.push(line("equipment", `Huur ${option.label}`, 1, "stuk", option.priceCents, option.priceCents, equipmentRate))
  }
  const equipmentRemainder = booking.equipmentCents - equipmentAccounted
  if (equipmentRemainder !== 0) {
    lines.push(line("equipment", "Huur apparatuur", 1, "stuk", equipmentRemainder, equipmentRemainder, equipmentRate))
  }

  if (adjustments.distanceKm > 0) {
    const km = adjustments.distanceKm * 2
    lines.push(line("travel", `Reiskosten ${km} km retour`, km, "km", TRAVEL_RATE_CENTS_PER_KM, travelCents(adjustments.distanceKm), performanceRate))
  }

  if (adjustments.parkingCents > 0) {
    const parking = line("parking", "Parkeerkosten", 1, "stuk", adjustments.parkingCents, adjustments.parkingCents, performanceRate)
    lines.push(adjustments.parkingReceipt ? { ...parking, receipt: adjustments.parkingReceipt } : parking)
  }

  for (const extra of adjustments.extras) {
    const extraLine = line("extra", extra.description, 1, "stuk", extra.amountCents, extra.amountCents, performanceRate)
    lines.push(extra.receipt ? { ...extraLine, receipt: extra.receipt } : extraLine)
  }

  return lines
}

/** Proposes the next number in the professional's own sequence, e.g. "DJM-2026-007". */
export function proposeInvoiceNumber(profile: Pick<BillingProfile, "invoicePrefix" | "nextInvoiceNumber">, year = todayIso().slice(0, 4)) {
  return `${profile.invoicePrefix}${year}-${profile.nextInvoiceNumber.toString().padStart(3, "0")}`
}

/** Parses "1.234,56", "1234.56" or "1234" into cents; returns null for anything unparseable. */
export function parseEuroInput(value: string): number | null {
  const trimmed = value.replace(/[^\d.,-]/g, "").trim()
  if (!trimmed) return null
  const lastComma = trimmed.lastIndexOf(",")
  const lastDot = trimmed.lastIndexOf(".")
  const decimalSeparator = lastComma > lastDot ? "," : lastDot > lastComma ? "." : null
  let normalized = trimmed
  if (decimalSeparator) {
    const thousands = decimalSeparator === "," ? "." : ","
    normalized = trimmed.split(thousands).join("").replace(decimalSeparator, ".")
  }
  const amount = Number.parseFloat(normalized)
  return Number.isFinite(amount) ? Math.round(amount * 100) : null
}

export function isBillingProfileComplete(profile: Pick<BillingProfile, "businessName" | "iban" | "street" | "postalCode" | "city">) {
  return Boolean(hasPayoutDetails(profile) && profile.street?.trim() && profile.postalCode?.trim() && profile.city?.trim())
}

/** The least ARSI Events needs to pay out, also when the professional uploads an own invoice. */
export function hasPayoutDetails(profile: Pick<BillingProfile, "businessName" | "iban">) {
  return Boolean(profile.businessName.trim()) && isValidIban(profile.iban ?? "")
}

/** Checks the shape and the two check digits (ISO 13616), so a typing mistake is caught. */
export function isValidIban(value: string) {
  const iban = value.replace(/\s+/g, "").toUpperCase()
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(iban)) return false
  let remainder = 0
  for (const char of iban.slice(4) + iban.slice(0, 4)) {
    const value = Number.parseInt(char, 36)
    remainder = (remainder * (value > 9 ? 100 : 10) + value) % 97
  }
  return remainder === 1
}

export function formatIban(iban: string) {
  return iban.replace(/\s+/g, "").replace(/(.{4})/g, "$1 ").trim()
}

export function invoiceFileUrl(invoice: Pick<Invoice, "filePathname">) {
  return invoice.filePathname ? `/api/invoices/file?pathname=${encodeURIComponent(invoice.filePathname)}` : null
}

export function invoiceBlobPrefix(professionalId: string, bookingId: number) {
  return `invoices/${professionalId}/${bookingId}/`
}

function buildNetInvoiceLines(booking: PricedBooking, profile: VatProfile, adjustments: InvoiceAdjustments): InvoiceLine[] {
  const kor = profile.vatScheme === "kor"
  const performanceRate = kor ? 0 : profile.performanceVatRate
  const equipmentRate = kor ? 0 : STANDARD_VAT_RATE
  const hours = Number(booking.hours)
  const performanceNet = Math.round(hours * booking.hourlyRateCents)

  const lines: InvoiceLine[] = [
    netLine(
      "performance",
      booking.professionalType === "photographer" ? `Fotografie ${booking.eventName}` : `DJ-optreden ${booking.eventName}`,
      hours,
      "uur",
      booking.hourlyRateCents,
      performanceNet,
      performanceRate,
    ),
  ]
  if (booking.equipmentCents > 0) {
    const what = booking.equipment.length ? `: ${booking.equipment.join(", ")}` : ""
    lines.push(netLine("equipment", `Huur apparatuur${what}`, 1, "stuk", booking.equipmentCents, booking.equipmentCents, equipmentRate))
  }
  if (adjustments.distanceKm > 0) {
    const km = adjustments.distanceKm * 2
    lines.push(netLine("travel", `Reiskosten ${km} km retour`, km, "km", TRAVEL_RATE_CENTS_PER_KM, travelCents(adjustments.distanceKm), performanceRate))
  }
  if (adjustments.parkingCents > 0) {
    const parking = netLine("parking", "Parkeerkosten", 1, "stuk", adjustments.parkingCents, adjustments.parkingCents, performanceRate)
    lines.push(adjustments.parkingReceipt ? { ...parking, receipt: adjustments.parkingReceipt } : parking)
  }
  for (const extra of adjustments.extras) {
    const extraLine = netLine("extra", extra.description, 1, "stuk", extra.amountCents, extra.amountCents, performanceRate)
    lines.push(extra.receipt ? { ...extraLine, receipt: extra.receipt } : extraLine)
  }
  return lines
}
