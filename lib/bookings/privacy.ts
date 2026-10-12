import type { Booking } from "@/lib/db/schema"

/** Contact details are only shared once the professional has committed to the booking. */
export function isContactUnlocked(status: Booking["status"]) {
  return status === "accepted" || status === "completed"
}

/** "Sanne de Vries" -> "Sanne d." */
export function abbreviateLastName(lastName: string) {
  const initial = lastName.trim().charAt(0)
  return initial ? `${initial}.` : ""
}

/**
 * Strips everything a professional could use to contact the client off-platform
 * until the booking is accepted: name, email, phone, company, billing data and the
 * exact street address. Postal-code area and city stay so travel can still be judged.
 */
export function redactContactDetails<T extends Booking>(booking: T): T {
  if (isContactUnlocked(booking.status)) return booking

  return {
    ...booking,
    lastName: abbreviateLastName(booking.lastName),
    email: "",
    phone: "",
    companyName: null,
    vatNumber: null,
    billingStreet: null,
    billingHouseNumber: null,
    billingPostalCode: null,
    billingCity: null,
    billingCountry: null,
    street: null,
    houseNumber: null,
    houseNumberExt: null,
    postalCode: booking.postalCode ? booking.postalCode.trim().slice(0, 4) : null,
  }
}
