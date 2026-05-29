import type { Language } from "./i18n"
import { translations } from "./i18n"

export interface ConversationMessage {
  role: "assistant" | "user"
  content: string
  timestamp: Date
}

export interface FilterState {
  categories: string[]
  genres: string[]
  eventTypes: string[]
  selectedDate: string
  city: string
  duration: string
  priceRange: [number, number]
}

export interface MissingFilters {
  categories: boolean
  selectedDate: boolean
  eventTypes: boolean
  genres: boolean
  city: boolean
  duration: boolean
  priceRange: boolean
}

export function identifyMissingFilters(filters: Partial<FilterState>): MissingFilters {
  return {
    categories: !filters.categories || filters.categories.length === 0,
    selectedDate: !filters.selectedDate || filters.selectedDate.trim() === "",
    eventTypes: !filters.eventTypes || filters.eventTypes.length === 0,
    genres: !filters.genres || filters.genres.length === 0,
    city: !filters.city || filters.city.trim() === "",
    duration: !filters.duration || filters.duration.trim() === "",
    priceRange: !filters.priceRange || (filters.priceRange[0] === 100 && filters.priceRange[1] === 5000),
  }
}

export function getNextQuestion(missingFilters: MissingFilters, language: Language = "nl"): string | null {
  const t = translations[language]

  if (missingFilters.categories) {
    return language === "nl"
      ? "Welk type artiest zoek je? (bijv: DJ, Band, Zanger)"
      : "What type of artist are you looking for? (e.g.: DJ, Band, Singer)"
  }
  if (missingFilters.selectedDate) {
    return language === "nl"
      ? "Op welke datum wil je de artiest boeken? (bijv: 15 september 2026)"
      : "On what date do you want to book the artist? (e.g.: September 15, 2026)"
  }
  if (missingFilters.city) {
    return t.aiCityQuestion
  }
  if (missingFilters.duration) {
    return t.aiDurationQuestion
  }
  if (missingFilters.priceRange) {
    return t.aiPriceQuestion
  }
  if (missingFilters.genres) {
    return t.aiGenresQuestion
  }
  if (missingFilters.eventTypes) {
    return t.aiEventTypeQuestion
  }
  return null
}

export function extractAnswerToFilter(
  question: string,
  answer: string,
  language: Language = "nl",
): Partial<FilterState> {
  const answerLower = answer.toLowerCase()
  const questionLower = question.toLowerCase()

  const isCategoryQuestion =
    questionLower.includes("type artiest") ||
    questionLower.includes("type of artist") ||
    questionLower.includes("welk type")

  if (isCategoryQuestion) {
    const categories: string[] = []
    const categoryMap: Record<string, string> = {
      dj: "DJ",
      band: "Band",
      zanger: "Singer",
      singer: "Singer",
      saxofonist: "Saxophonist",
      saxophonist: "Saxophonist",
      pianist: "Pianist",
    }

    for (const [key, value] of Object.entries(categoryMap)) {
      if (answerLower.includes(key)) {
        categories.push(value)
      }
    }

    console.log("[v0] Category extraction - Question:", question, "Answer:", answer, "Extracted:", categories)

    if (categories.length === 0) {
      // Use the raw answer if no match
      return { categories: [answer.trim()] }
    }

    return { categories }
  }

  const isDateQuestion =
    questionLower.includes("welke datum") ||
    questionLower.includes("what date") ||
    questionLower.includes("wanneer") ||
    questionLower.includes("when")

  if (isDateQuestion) {
    console.log("[v0] Date extraction - Question:", question, "Answer:", answer)
    // Return the date as-is, it will be parsed later
    return { selectedDate: answer.trim() }
  }

  // Music genre extraction
  const isGenreQuestion =
    questionLower.includes("muziekstijl") || questionLower.includes("music style") || questionLower.includes("genre")

  if (isGenreQuestion) {
    const genres: string[] = []
    const genreMap: Record<string, string> = {
      house: "House",
      techno: "Techno",
      jazz: "Jazz",
      pop: "Pop",
      rock: "Rock",
      classical: "Classical",
      edm: "EDM",
      "wedding mix": "Wedding Mix",
      acoustic: "Acoustic",
      electronic: "Electronic",
      disco: "Disco",
      funk: "Funk",
      soul: "Soul",
      hiphop: "Hip-Hop",
      "hip-hop": "Hip-Hop",
      rnb: "R&B",
      "r&b": "R&B",
    }

    for (const [key, value] of Object.entries(genreMap)) {
      if (answerLower.includes(key)) {
        genres.push(value)
      }
    }

    console.log("[v0] Genre extraction - Question:", question, "Answer:", answer, "Extracted:", genres)

    if (genres.length === 0) {
      const parts = answer.split(/,|en|and|\s/).filter((p) => p.trim().length > 0)
      return { genres: parts.map((p) => p.trim().charAt(0).toUpperCase() + p.trim().slice(1).toLowerCase()) }
    }

    return { genres }
  }

  // Event type extraction
  const isEventQuestion =
    questionLower.includes("soort evenement") ||
    questionLower.includes("type of event") ||
    questionLower.includes("event type")

  if (isEventQuestion) {
    const eventTypes: string[] = []
    const eventMap: Record<string, string> = {
      bruiloft: "Wedding",
      wedding: "Wedding",
      bedrijfsfeest: "Corporate",
      corporate: "Corporate",
      verjaardag: "Birthday",
      birthday: "Birthday",
      festival: "Festival",
      club: "Club",
      party: "Party",
      feest: "Party",
    }

    for (const [key, value] of Object.entries(eventMap)) {
      if (answerLower.includes(key)) {
        eventTypes.push(value)
      }
    }

    console.log("[v0] Event type extraction - Question:", question, "Answer:", answer, "Extracted:", eventTypes)

    if (eventTypes.length === 0) {
      return { eventTypes: [answer.trim()] }
    }

    return { eventTypes }
  }

  // City extraction
  const isCityQuestion =
    questionLower.includes("stad") || questionLower.includes("city") || questionLower.includes("location")

  if (isCityQuestion) {
    const cityMatch = answerLower.match(/(?:in |uit |)([a-z]+(?:\s+[a-z]+)?)/)
    if (cityMatch) {
      console.log("[v0] City extraction - Question:", question, "Answer:", answer, "Extracted:", cityMatch[1].trim())
      return { city: cityMatch[1].trim() }
    }
    console.log("[v0] City extraction - Question:", question, "Answer:", answer, "Extracted:", answer.trim())
    return { city: answer.trim() }
  }

  // Duration extraction
  const isDurationQuestion =
    questionLower.includes("laat begint") ||
    questionLower.includes("hoe lang") ||
    questionLower.includes("duur") ||
    questionLower.includes("tijd") ||
    questionLower.includes("time does") ||
    questionLower.includes("start and end") ||
    questionLower.includes("how long") ||
    questionLower.includes("duration") ||
    questionLower.includes("hours")

  if (isDurationQuestion) {
    const timeRangeMatch = answerLower.match(/(\d{1,2}):?(\d{2})?\s*(?:tot|to|[-–])\s*(\d{1,2}):?(\d{2})?/)

    if (timeRangeMatch) {
      const startHour = Number.parseInt(timeRangeMatch[1])
      const endHour = Number.parseInt(timeRangeMatch[3])

      let duration: number
      if (endHour < startHour) {
        duration = 24 - startHour + endHour
      } else {
        duration = endHour - startHour
      }

      duration = Math.max(1, Math.min(8, duration))

      console.log("[v0] Duration extraction - Question:", question, "Answer:", answer, "Extracted:", duration)
      return { duration: duration.toString() }
    }

    const hourMatch = answerLower.match(/(\d+)\s*(?:uur|hour|uren|hours)/)
    if (hourMatch) {
      let duration = Number.parseInt(hourMatch[1])
      duration = Math.max(1, Math.min(8, duration))
      console.log("[v0] Duration extraction - Question:", question, "Answer:", answer, "Extracted:", duration)
      return { duration: duration.toString() }
    }

    const numberRangeMatch = answerLower.match(/\b(\d+)\s*[-–]\s*(\d+)\b/)
    if (numberRangeMatch) {
      const start = Number.parseInt(numberRangeMatch[1])
      const end = Number.parseInt(numberRangeMatch[2])
      let duration = end - start
      duration = Math.max(1, Math.min(8, duration))
      console.log("[v0] Duration extraction - Question:", question, "Answer:", answer, "Extracted:", duration)
      return { duration: duration.toString() }
    }

    return { duration: "" }
  }

  // Budget/price extraction
  const isBudgetQuestion =
    questionLower.includes("budget") || questionLower.includes("price") || questionLower.includes("cost")

  if (isBudgetQuestion) {
    const rangeMatch = answerLower.match(
      /(?:tussen\s+|between\s+)?[€$]?\s*(\d+)\s*(?:tot|to|[-–]|en|and)\s*[€$]?\s*(\d+)/,
    )

    if (rangeMatch) {
      const min = Number.parseInt(rangeMatch[1])
      const max = Number.parseInt(rangeMatch[2])
      console.log("[v0] Budget extraction - Question:", question, "Answer:", answer, "Extracted range:", [min, max])
      return { priceRange: [min, max] }
    }

    const maxMatch = answerLower.match(/(?:max|maximaal|maximum|tot|up to)\s*[€$]?\s*(\d+)/)

    if (maxMatch) {
      const max = Number.parseInt(maxMatch[1])
      console.log("[v0] Budget extraction - Question:", question, "Answer:", answer, "Extracted max:", max)
      return { priceRange: [0, max] }
    }

    const exactMatch = answerLower.match(/[€$]?\s*(\d+)/)

    if (exactMatch) {
      const amount = Number.parseInt(exactMatch[1])
      console.log("[v0] Budget extraction - Question:", question, "Answer:", answer, "Extracted amount:", amount)
      return { priceRange: [0, amount] }
    }
  }

  console.log("[v0] No filter extracted from - Question:", question, "Answer:", answer)
  return {}
}

export function generateWelcomeMessage(extractedFilters: Partial<FilterState>, language: Language = "nl"): string {
  const t = translations[language]

  const hasSomeFilters =
    (extractedFilters.categories && extractedFilters.categories.length > 0) ||
    (extractedFilters.eventTypes && extractedFilters.eventTypes.length > 0) ||
    extractedFilters.selectedDate

  if (!hasSomeFilters) {
    return t.aiWelcomeDefault
  }

  const parts: string[] = []

  if (extractedFilters.categories && extractedFilters.categories.length > 0) {
    parts.push(extractedFilters.categories.join(language === "nl" ? " of " : " or "))
  }

  if (extractedFilters.eventTypes && extractedFilters.eventTypes.length > 0) {
    const eventTypeText = extractedFilters.eventTypes.join(language === "nl" ? " of " : " or ")
    parts.push(`${language === "nl" ? "voor je" : "for your"} ${eventTypeText}`)
  }

  if (extractedFilters.selectedDate) {
    parts.push(`${language === "nl" ? "op" : "on"} ${extractedFilters.selectedDate}`)
  }

  const detailsText = parts.join(" ")

  return `${language === "nl" ? "Ik zie dat je zoekt naar" : "I see you're looking for"} ${detailsText}. ${language === "nl" ? "Laat me je helpen met een paar extra vragen om de beste match te vinden!" : "Let me help you with a few extra questions to find the best match!"}`
}
