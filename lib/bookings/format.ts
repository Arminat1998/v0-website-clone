import type { Booking } from "@/lib/db/schema"

export function formatEventDate(iso: string, locale: string, style: "long" | "short" = "long") {
  const [y, m, d] = iso.split("-").map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString(locale, style === "long"
    ? { weekday: "long", day: "numeric", month: "long", year: "numeric" }
    : { day: "numeric", month: "short", year: "numeric" })
}

export function formatDateTime(value: Date | string | null | undefined, locale: string) {
  if (!value) return ""
  const date = typeof value === "string" ? new Date(value) : value
  return date.toLocaleString(locale, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
}

export function formatShortDate(value: Date | string | null | undefined, locale: string) {
  if (!value) return ""
  const date = typeof value === "string" ? new Date(value) : value
  return date.toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" })
}

export function daysUntil(iso: string) {
  const [y, m, d] = iso.split("-").map(Number)
  const target = new Date(y, m - 1, d)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - today.getTime()) / 86_400_000)
}

export function isTodayOrPast(iso: string) {
  return daysUntil(iso) <= 0
}

export function clientName(booking: Pick<Booking, "firstName" | "lastName">) {
  return `${booking.firstName} ${booking.lastName}`.trim()
}

export function eventAddress(booking: Pick<Booking, "street" | "houseNumber" | "houseNumberExt" | "postalCode" | "city" | "country">) {
  const line1 = [booking.street, [booking.houseNumber, booking.houseNumberExt].filter(Boolean).join("")].filter(Boolean).join(" ")
  const line2 = [booking.postalCode, booking.city].filter(Boolean).join(" ")
  return [line1, line2, booking.country].filter(Boolean)
}

export function billingAddress(booking: Pick<Booking, "companyName" | "billingStreet" | "billingHouseNumber" | "billingPostalCode" | "billingCity" | "billingCountry">) {
  const line1 = [booking.billingStreet, booking.billingHouseNumber].filter(Boolean).join(" ")
  const line2 = [booking.billingPostalCode, booking.billingCity].filter(Boolean).join(" ")
  return [booking.companyName, line1, line2, booking.billingCountry].filter(Boolean)
}

export function mapsUrl(booking: Pick<Booking, "street" | "houseNumber" | "houseNumberExt" | "postalCode" | "city" | "country">) {
  const query = eventAddress(booking).join(", ")
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`
}

/** Subtracts minutes from an "HH:MM" string, wrapping around midnight. */
export function shiftTime(time: string, minutes: number) {
  const [h, m] = time.split(":").map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return time
  const total = (((h * 60 + m + minutes) % 1440) + 1440) % 1440
  return `${Math.floor(total / 60).toString().padStart(2, "0")}:${(total % 60).toString().padStart(2, "0")}`
}

export function bookingNumber(id: number) {
  return `#${id.toString().padStart(5, "0")}`
}
