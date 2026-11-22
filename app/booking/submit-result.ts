// What the server answers to a booking request, and how the booking page explains a refusal.

export type BookingSubmitError =
  | "UNAUTHORIZED"
  | "INVALID_DETAILS"
  | "UNAVAILABLE"
  | "DATE_TAKEN"
  | "INVALID_HOURS"
  | "OUT_OF_RANGE"
  | "PRICE_CHANGED"
  | "RETRY"

export type BookingSubmitResult =
  | { ok: true; id: number }
  | { ok: false; error: BookingSubmitError; totalCents?: number; field?: string }

/**
 * Reads the answer of createBooking. The older form ({ id }, thrown errors) is understood as well, so the page
 * works with both; `{ ok: true, id } | { ok: false, error }` is the lasting one.
 */
export function readBookingResult(answer: unknown): BookingSubmitResult {
  const result = (answer ?? {}) as { ok?: boolean; id?: number; error?: BookingSubmitError; totalCents?: number; field?: string }
  if (result.ok !== false && typeof result.id === "number") return { ok: true, id: result.id }
  return { ok: false, error: result.error ?? "RETRY", totalCents: result.totalCents, field: result.field }
}

/** The message for a refused request and the step where it can be solved. Price changes have their own block. */
export function bookingErrorMessage(
  error: BookingSubmitError,
  nl: boolean,
  details: { field?: string; audioSent?: boolean } = {},
): { text: string; step?: number } {
  const { field = "" } = details
  switch (error) {
    case "UNAUTHORIZED":
      return {
        text: nl
          ? "Je bent niet ingelogd. Log in of maak een account aan via de knoppen bovenaan en verstuur je aanvraag opnieuw."
          : "You are not logged in. Log in or create an account with the buttons at the top and send your request again.",
      }
    case "DATE_TAKEN":
      return {
        text: nl
          ? "Deze datum is niet meer beschikbaar. Kies in stap 1 een andere datum; je andere gegevens blijven staan."
          : "This date is no longer available. Choose another date in step 1; your other details are kept.",
        step: 1,
      }
    case "OUT_OF_RANGE":
      return {
        text: nl
          ? "Deze locatie ligt buiten het werkgebied van de professional. Kies in stap 1 een andere plaats."
          : "This location is outside the professional's travel range. Choose another place in step 1.",
        step: 1,
      }
    case "INVALID_HOURS":
      return {
        text: nl
          ? "De gekozen tijden passen niet bij de minimale of maximale boekingsduur. Pas ze aan in stap 2."
          : "The chosen times do not fit the minimum or maximum booking length. Change them in step 2.",
        step: 2,
      }
    case "UNAVAILABLE":
      return {
        text: nl
          ? "Deze professional is op dit moment niet te boeken. Kies een andere professional."
          : "This professional cannot be booked at the moment. Choose another professional.",
      }
    case "INVALID_DETAILS":
      if (/FileName$/.test(field) || (!field && details.audioSent)) {
        return {
          text: nl
            ? "Je muziekbestand kon niet worden gebruikt; een upload blijft maar een dag geldig. Verstuur je aanvraag opnieuw, dan uploaden we het bestand opnieuw. Lukt dat niet, kies dan in stap 2 een ander bestand of een link."
            : "Your music file could not be used; an upload is only valid for a day. Send your request again and the file is uploaded again. If that fails, choose another file or a link in step 2.",
          step: 2,
        }
      }
      if (/Link$/.test(field)) {
        return {
          text: nl ? "Een van je muzieklinks is ongeldig. Pas die aan in stap 2." : "One of your music links is invalid. Change it in step 2.",
          step: 2,
        }
      }
      if (/^(firstName|lastName|email|phone|companyName|vatNumber|billing)/.test(field)) {
        return {
          text: nl ? "Je persoonlijke of factuurgegevens zijn niet compleet of ongeldig. Controleer stap 3." : "Your personal or billing details are incomplete or invalid. Check step 3.",
          step: 3,
        }
      }
      if (field === "eventDate") {
        return {
          text: nl ? "Deze datum kan niet worden geboekt. Kies in stap 1 een andere datum." : "This date cannot be booked. Choose another date in step 1.",
          step: 1,
        }
      }
      return {
        text: nl
          ? "Niet alle gegevens konden worden verwerkt, bijvoorbeeld een te lange tekst of een ongeldige link. Controleer stap 2 en 3."
          : "Not all details could be processed, for example a text that is too long or an invalid link. Check steps 2 and 3.",
        step: 2,
      }
    default:
      return {
        text: nl
          ? "Het versturen is niet gelukt. Je gegevens staan er nog; probeer het over een moment opnieuw."
          : "Sending failed. Your details are still here; try again in a moment.",
      }
  }
}
