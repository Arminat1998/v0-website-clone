import type { Booking } from "@/lib/db/schema"

// Server renders in UTC, browsers in their own zone; one fixed zone keeps SSR and client output identical.
export const BOOKING_TIME_ZONE = "Europe/Amsterdam"

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
  return date.toLocaleString(locale, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: BOOKING_TIME_ZONE })
}

export function formatShortDate(value: Date | string | null | undefined, locale: string) {
  if (!value) return ""
  const date = typeof value === "string" ? new Date(value) : value
  return date.toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric", timeZone: BOOKING_TIME_ZONE })
}

/** Today's date as YYYY-MM-DD in the booking time zone. */
export function todayIso() {
  return new Date().toLocaleDateString("en-CA", { timeZone: BOOKING_TIME_ZONE })
}

/** How far ahead dates can be booked or blocked. */
export const MAX_YEARS_AHEAD = 3

/** The last date (YYYY-MM-DD) that can be booked or blocked. */
export function maxDateIso() {
  const [y, m, d] = todayIso().split("-").map(Number)
  return new Date(Date.UTC(y + MAX_YEARS_AHEAD, m - 1, d)).toISOString().slice(0, 10)
}

/** True for a date that exists, written as YYYY-MM-DD. */
export function isIsoDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

/** True for a date from today up to and including the last date that can be booked or blocked. */
export function isBookableDate(value: unknown): value is string {
  return isIsoDate(value) && value >= todayIso() && value <= maxDateIso()
}

export function daysUntil(iso: string) {
  const [y, m, d] = iso.split("-").map(Number)
  const [ty, tm, td] = todayIso().split("-").map(Number)
  return Math.round((Date.UTC(y, m - 1, d) - Date.UTC(ty, tm - 1, td)) / 86_400_000)
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
