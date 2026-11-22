// The search assistant: which questions it asks, and what it makes of the answers.

import {
  cityFromAnswer,
  dateIn,
  durationIn,
  eventTypesIn,
  genresIn,
  priceFilters,
  priceIn,
  typesIn,
} from "@/lib/adaptive-filters"
import { todayIso } from "@/lib/bookings/format"
import type { Language } from "@/lib/i18n"
import { eventLabel, filterLabel, isFilterSet, typeLabel, type FilterKey, type ListFilters, type ProfessionalKind } from "@/lib/list-filters"
import { ARTIST_TYPES, PHOTO_VIDEO_TYPES } from "@/lib/profile-options"

export interface ConversationMessage {
  role: "assistant" | "user"
  content: string
  timestamp: Date
}

export type QuestionKey = Exclude<FilterKey, "budget">

/** The questions for a list. The duration does not filter, so it is only asked to make sense of a total budget. */
export function questionsFor(kind: ProfessionalKind, filters: ListFilters): QuestionKey[] {
  const keys: QuestionKey[] = ["categories", "eventTypes", "selectedDate", "city", "priceRange"]
  if (filters.budget > 0) keys.push("duration")
  if (kind === "artist") keys.push("genres")
  return keys
}

/** A question is answered by its filter; a total budget answers the price question too. */
export function isAnswered(key: QuestionKey, filters: ListFilters) {
  return isFilterSet(filters, key) || (key === "priceRange" && isFilterSet(filters, "budget"))
}

export function nextQuestion(kind: ProfessionalKind, filters: ListFilters, skipped: Set<QuestionKey>): QuestionKey | null {
  return questionsFor(kind, filters).find((key) => !skipped.has(key) && !isAnswered(key, filters)) ?? null
}

/** An example day that is always in the future: 15 May of next year. */
function exampleDate(nl: boolean) {
  const year = Number(todayIso().slice(0, 4)) + 1
  return nl ? `15 mei ${year}` : `15 May ${year}`
}

export function questionText(key: QuestionKey, kind: ProfessionalKind, language: Language): string {
  const nl = language === "nl"
  const artist = kind === "artist"
  switch (key) {
    case "categories":
      return artist
        ? nl ? "Welk type artiest zoek je? (bijv. DJ, band of zanger)" : "What type of artist are you looking for? (e.g. DJ, band or singer)"
        : nl ? "Zoek je een fotograaf, een videograaf of iemand die allebei doet?" : "Are you looking for a photographer, a videographer or someone who does both?"
    case "eventTypes":
      return nl ? "Voor wat voor evenement is dit? (bijv. bruiloft, bedrijfsfeest of verjaardag)" : "What type of event is this? (e.g. wedding, corporate event or birthday)"
    case "selectedDate":
      return nl ? `Op welke datum is het? (bijv. ${exampleDate(true)})` : `On what date is it? (e.g. ${exampleDate(false)})`
    case "city":
      return artist
        ? nl ? "In welke stad zoek je een artiest? (bijv. Utrecht)" : "In which city are you looking for an artist? (e.g. Utrecht)"
        : nl ? "In welke stad zoek je iemand? (bijv. Utrecht)" : "In which city are you looking for someone? (e.g. Utrecht)"
    case "priceRange":
      return nl ? "Wat wil je maximaal per uur uitgeven, excl. btw? (bijv. max. € 150)" : "What do you want to spend per hour at most, excl. VAT? (e.g. max. €150)"
    case "duration":
      return nl ? "Hoe lang duurt het? (bijv. 4 uur, of van 20:00 tot 00:00)" : "How long will it take? (e.g. 4 hours, or from 8 PM to midnight)"
    case "genres":
      return nl ? "Welke muziekstijl heb je in gedachten? (bijv. house, pop of jazz)" : "Which music style do you have in mind? (e.g. house, pop or jazz)"
  }
}

/** Tap-to-answer options; each is phrased so that extractAnswer understands it. */
export function quickReplies(key: QuestionKey, kind: ProfessionalKind, language: Language): string[] {
  const nl = language === "nl"
  switch (key) {
    case "categories": {
      const types = kind === "artist" ? ARTIST_TYPES.slice(0, 5) : PHOTO_VIDEO_TYPES
      return types.map((type) => (nl ? type.nl : type.en))
    }
    case "eventTypes":
      return ["Wedding", "Corporate Event", "Birthday", "Festival"].map((value) => eventLabel(value, nl))
    case "city":
      return ["Amsterdam", "Rotterdam", "Utrecht", nl ? "Den Haag" : "The Hague", "Eindhoven"]
    case "priceRange":
      return (kind === "artist" ? [100, 150, 200] : [150, 200, 300]).map((value) => (nl ? `Max. € ${value} per uur` : `Max. €${value} per hour`))
    case "duration":
      return nl ? ["2 uur", "3 uur", "4 uur", "5 uur"] : ["2 hours", "3 hours", "4 hours", "5 hours"]
    case "genres":
      return ["House", "Techno", "Pop", "Hip Hop", "Jazz"]
    case "selectedDate":
      return []
  }
}

/** "Weet ik niet", "maakt niet uit", "no preference": skips the question. */
export function isNoPreference(answer: string) {
  return /^(?:nee|neen|no|nope|geen(?: (?:idee|voorkeur|voorkeuren|budget))?|(?:dat )?(?:weet ik|weten we)(?: (?:nog|het|dat|echt))* niet|(?:dat )?maakt (?:me |mij |ons )?(?:echt )?niet(?:s)? uit|niet bekend|nog niet bekend|nog onbekend|alles|van alles|iets|anything|any|whatever|no (?:idea|preference|budget)|(?:i )?(?:don'?t|do not) (?:know|care|mind)(?: yet)?|(?:i'?m )?not sure(?: yet)?|n\.?v\.?t\.?|sla over|overslaan|skip(?: this)?)[.!]*$/i.test(
    answer.trim().replace(/’/g, "'"),
  )
}

export type AnswerResult = { ok: true; filters: Partial<ListFilters> } | { ok: false; reason: "unknown" | "past" }

/** The filter an answer stands for. Nothing changes when the answer is not understood. */
export function extractAnswer(key: QuestionKey, answer: string, kind: ProfessionalKind, today?: string): AnswerResult {
  const unknown: AnswerResult = { ok: false, reason: "unknown" }
  const list = (name: "categories" | "eventTypes" | "genres", values: string[]): AnswerResult =>
    values.length > 0 ? { ok: true, filters: { [name]: values } } : unknown
  switch (key) {
    case "categories": {
      if (kind === "photo-video" && /\b(allebei|beide|both)\b/i.test(answer)) return list("categories", ["Photographer & Videographer"])
      return list("categories", typesIn(answer, kind))
    }
    case "eventTypes":
      return list("eventTypes", eventTypesIn(answer))
    case "genres":
      return list("genres", genresIn(answer))
    case "selectedDate": {
      const date = dateIn(answer, { answer: true, today })
      if (!date) return unknown
      return date.past ? { ok: false, reason: "past" } : { ok: true, filters: { selectedDate: date.iso } }
    }
    case "city": {
      const city = cityFromAnswer(answer)
      return city ? { ok: true, filters: { city } } : unknown
    }
    case "duration": {
      const duration = durationIn(answer, { answer: true })
      return duration ? { ok: true, filters: { duration: duration.hours } } : unknown
    }
    case "priceRange": {
      const price = priceIn(answer, { answer: true })
      return price ? { ok: true, filters: priceFilters(price, true) } : unknown
    }
  }
}

/** Says that an answer was not understood, and how to answer. */
export function notUnderstood(key: QuestionKey, kind: ProfessionalKind, language: Language, reason: "unknown" | "past"): string {
  const nl = language === "nl"
  if (reason === "past") {
    return nl
      ? `Die datum is al voorbij. Kies een datum in de toekomst, bijvoorbeeld ${exampleDate(true)}.`
      : `That date has passed. Choose a date in the future, for example ${exampleDate(false)}.`
  }
  const example =
    key === "selectedDate" ? exampleDate(nl)
      : key === "city" ? "Utrecht"
        : quickReplies(key, kind, language).slice(0, 2).join(nl ? " of " : " or ")
  return nl
    ? `Dat begreep ik niet, dus er is niets veranderd. Probeer bijvoorbeeld: ${example}. Je kunt de vraag ook overslaan.`
    : `I did not understand that, so nothing has changed. Try for example: ${example}. You can also skip the question.`
}

/** Event types inside a sentence: "bruiloft", but "King's Day" keeps its capitals. */
function inSentence(label: string) {
  return /'|\d|^Koningsdag/.test(label) ? label : label.toLowerCase()
}

export function welcomeMessage(filters: Partial<ListFilters>, kind: ProfessionalKind, language: Language): string {
  const nl = language === "nl"
  const or = nl ? " of " : " or "
  const types = (filters.categories ?? []).map((value) => {
    const label = typeLabel(value, nl)
    return `${nl ? "een" : "a"} ${label === "DJ" ? label : label.toLowerCase()}`
  })
  const events = (filters.eventTypes ?? []).map((value) => inSentence(eventLabel(value, nl)))
  const known = types.length > 0 || events.length > 0 || filters.selectedDate || filters.city
  if (!known) {
    return kind === "artist"
      ? nl ? "Ik help je graag met het vinden van de perfecte artiest! Laten we beginnen met een paar vragen." : "I'm happy to help you find the perfect artist! Let's start with a few questions."
      : nl ? "Ik help je graag met het vinden van de perfecte fotograaf of videograaf! Laten we beginnen met een paar vragen." : "I'm happy to help you find the perfect photographer or videographer! Let's start with a few questions."
  }
  const subject = types.length > 0 ? types.join(or) : kind === "artist" ? (nl ? "een artiest" : "an artist") : nl ? "een fotograaf of videograaf" : "a photographer or videographer"
  const parts = [nl ? `Ik zie dat je zoekt naar ${subject}` : `I see you're looking for ${subject}`]
  if (events.length > 0) parts.push(`${nl ? "voor je" : "for your"} ${events.join(or)}`)
  const all = filters as ListFilters
  if (filters.selectedDate) parts.push(`${nl ? "op" : "on"} ${filterLabel(all, "selectedDate", language)}`)
  if (filters.city) parts.push(`in ${filters.city}`)
  return `${parts.join(" ")}. ${nl ? "Ik stel nog een paar vragen om de beste match te vinden." : "I have a few more questions to find the best match."}`
}
