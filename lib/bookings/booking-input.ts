import { z } from "zod"
import { isBookableDate } from "@/lib/bookings/format"
import { linkFromInput } from "@/lib/http-url"

export type BookingErrorCode =
  | "UNAUTHORIZED"
  | "INVALID_DETAILS"
  | "UNAVAILABLE"
  | "DATE_TAKEN"
  | "INVALID_HOURS"
  | "OUT_OF_RANGE"
  | "RETRY"

export type CreateBookingResult =
  | { ok: true; id: number }
  /** `field` is the name of the first invalid input field, when there is one. */
  | { ok: false; error: BookingErrorCode; field?: string }
  | { ok: false; error: "PRICE_CHANGED"; totalCents: number }

/** A reason to refuse a booking request that the customer gets to see. */
export class BookingError extends Error {
  constructor(
    readonly code: BookingErrorCode,
    readonly field?: string,
  ) {
    super(code)
  }
}

// Postgres refuses NUL characters in text.
const text = (max: number) => z.string().transform((value) => value.replaceAll("\u0000", "").trim()).pipe(z.string().max(max))
const required = (max: number) => text(max).pipe(z.string().min(1))
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)
const labels = (max: number) =>
  z
    .array(text(120))
    .max(max)
    .transform((values) => [...new Set(values.filter(Boolean))])
const link = text(300).transform((value, ctx) => {
  if (!value) return ""
  const url = linkFromInput(value)
  if (url && url.length <= 300) return url
  ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Not a link" })
  return z.NEVER
})

/** Everything the server stores of a booking request. Prices and names are looked up, never taken from here. */
const bookingInputSchema = z
  .object({
    professionalId: required(100),
    professionalType: z.enum(["artist", "photographer"]),
    eventName: text(300),
    eventDate: z.string().refine(isBookableDate),
    startTime: time,
    endTime: time,
    eventTypes: labels(30),
    musicGenres: labels(30),
    capacity: z.string().max(300).transform((value) => {
      const guests = Number.parseInt(value, 10)
      return guests >= 1 && guests <= 1_000_000 ? guests : null
    }),
    description: text(5000),
    specialRequests: text(5000),
    dressCode: text(300),
    playlistLink: link,
    openingDanceLink: link,
    openingDanceFileName: text(500),
    lastSongLink: link,
    lastSongFileName: text(500),
    street: text(300),
    houseNumber: text(300),
    houseNumberExt: text(300),
    postalCode: text(300),
    city: text(300),
    country: text(300),
    distanceKm: z.number().finite().min(0).max(2000),
    eventLocation: text(300),
    equipment: labels(20),
    firstName: required(300),
    lastName: required(300),
    email: text(254).pipe(z.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)),
    phone: text(60).refine((value) => value.replace(/\D/g, "").length >= 6),
    customerType: z.enum(["private", "business"]),
    companyName: text(300),
    billingStreet: required(300),
    billingHouseNumber: required(300),
    billingPostalCode: required(300),
    billingCity: required(300),
    billingCountry: text(300),
    vatNumber: text(300),
    paymentMethod: z.enum(["ideal", "card", "invoice"]),
    expectedTotalCents: z.number().int().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.customerType !== "business") return
    for (const field of ["companyName", "vatNumber"] as const) {
      if (!value[field]) ctx.addIssue({ code: z.ZodIssueCode.custom, path: [field], message: "Required" })
    }
  })

export type BookingInput = z.infer<typeof bookingInputSchema>

export function parseBookingInput(input: unknown): BookingInput {
  const parsed = bookingInputSchema.safeParse(input)
  if (parsed.success) return parsed.data
  throw new BookingError("INVALID_DETAILS", String(parsed.error.issues[0]?.path[0] ?? ""))
}

/** A booking id from the client that fits the database column. */
export function isBookingId(id: unknown): id is number {
  return typeof id === "number" && Number.isSafeInteger(id) && id > 0 && id <= 2_147_483_647
}

/** Free text from the client, trimmed and capped; null when empty. */
export function optionalText(value: unknown, max: number) {
  if (typeof value !== "string") return null
  return value.replaceAll("\u0000", "").trim().slice(0, max) || null
}
