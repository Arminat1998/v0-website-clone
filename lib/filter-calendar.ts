import { todayIso } from "@/lib/bookings/format"

/** Month names as used by the availability filters (their keys, not display labels). */
export const CALENDAR_MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]

function today() {
  const [year, month] = todayIso().split("-").map(Number)
  return { year, monthIndex: month - 1 }
}

/** The month the filter calendar opens on: a restored month if it is not in the past, otherwise this month. */
export function calendarStart(month?: string, year?: string) {
  const now = today()
  const restoredIndex = month ? CALENDAR_MONTHS.indexOf(month) : -1
  const restoredYear = Number(year)
  if (restoredIndex >= 0 && Number.isFinite(restoredYear) && restoredYear * 12 + restoredIndex >= now.year * 12 + now.monthIndex) {
    return { month: CALENDAR_MONTHS[restoredIndex], year: String(restoredYear) }
  }
  return { month: CALENDAR_MONTHS[now.monthIndex], year: String(now.year) }
}

/** This year and the next two. */
export function calendarYears() {
  const { year } = today()
  return [year, year + 1, year + 2].map(String)
}

/** Empty cells before day 1 in a calendar whose weeks start on Monday. */
export function mondayOffset(monthIndex: number, year: number) {
  return (new Date(year, monthIndex, 1).getDay() + 6) % 7
}

/** Keeps a selected date only when it is today or later. */
export function upcomingDate(iso?: string | null) {
  return iso && iso >= todayIso() ? iso : ""
}

export function isPastDate(iso: string) {
  return iso < todayIso()
}
