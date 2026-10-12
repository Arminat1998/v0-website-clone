import type { BillingProfile, Booking, Invoice, InvoiceLine } from "@/lib/db/schema"
import { EQUIPMENT_OPTIONS, TRAVEL_RATE_CENTS_PER_KM } from "@/lib/bookings/pricing"

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

/**
 * Builds the invoice lines for a booking. Booking amounts are what the client pays (VAT inclusive),
 * so the invoice total always equals the booking total; VAT is extracted per line.
 */
export function buildInvoiceLines(booking: PricedBooking, profile: VatProfile): InvoiceLine[] {
  const kor = profile.vatScheme === "kor"
  const performanceRate = kor ? 0 : profile.performanceVatRate
  const equipmentRate = kor ? 0 : STANDARD_VAT_RATE
  const hours = Number(booking.hours)
  const performanceGross = booking.totalCents - booking.equipmentCents - booking.travelCents

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

  if (booking.travelCents > 0) {
    const km = booking.distanceKm * 2
    lines.push(line("travel", `Reiskosten ${km} km retour`, km, "km", TRAVEL_RATE_CENTS_PER_KM, booking.travelCents, performanceRate))
  }

  return lines
}

/** Proposes the next number in the professional's own sequence, e.g. "DJM-2026-007". */
export function proposeInvoiceNumber(profile: Pick<BillingProfile, "invoicePrefix" | "nextInvoiceNumber">, year = new Date().getFullYear()) {
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
  return Boolean(profile.businessName.trim() && profile.iban?.trim() && profile.street?.trim() && profile.postalCode?.trim() && profile.city?.trim())
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
