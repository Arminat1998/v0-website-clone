// Adaptive filter logic that adjusts filters based on search context
import type { Artist } from "./smart-search"

export interface FilterSuggestions {
  priceRange?: [number, number]
  musicGenres?: string[]
  eventTypes?: string[]
  duration?: string
  city?: string
  selectedDate?: string // YYYY-MM-DD format
  month?: string
  year?: string
  categories?: string[]
}

// Context-aware filter suggestions based on search query
export function generateFilterSuggestions(query: string, searchResults: Artist[]): FilterSuggestions {
  if (!query.trim()) {
    return {}
  }

  const normalizedQuery = query.toLowerCase().trim()
  const suggestions: FilterSuggestions = {}

  const artistTypes = extractArtistTypes(normalizedQuery)
  if (artistTypes.length > 0) {
    suggestions.categories = artistTypes
  }

  // Parse dates from query
  const dateInfo = parseDateFromQuery(normalizedQuery)
  if (dateInfo) {
    suggestions.selectedDate = dateInfo.date
    suggestions.month = dateInfo.month
    suggestions.year = dateInfo.year
  }

  const priceInfo = extractPriceFromQuery(normalizedQuery)
  if (priceInfo) {
    suggestions.priceRange = priceInfo
  }

  const explicitGenres = extractExplicitMusicGenres(normalizedQuery)
  if (explicitGenres.length > 0) {
    suggestions.musicGenres = explicitGenres
  }

  const explicitEventTypes = extractExplicitEventTypes(normalizedQuery)
  if (explicitEventTypes.length > 0) {
    suggestions.eventTypes = explicitEventTypes
  }

  // Location extraction
  const cities = [
    "amsterdam",
    "rotterdam",
    "utrecht",
    "den haag",
    "eindhoven",
    "groningen",
    "tilburg",
    "breda",
    "maastricht",
    "arnhem",
    "haarlem",
    "leiden",
    "almere",
    "nijmegen",
    "apeldoorn",
  ]

  const mentionedCity = cities.find((city) => normalizedQuery.includes(city))
  if (mentionedCity) {
    suggestions.city = mentionedCity.charAt(0).toUpperCase() + mentionedCity.slice(1)
  }


  return suggestions
}

function extractExplicitMusicGenres(query: string): string[] {
  const genres: string[] = []

  // Only add genres that are explicitly mentioned in the query
  if (/\b(techno)\b/i.test(query)) {
    genres.push("Techno")
  }
  if (/\b(house|house music)\b/i.test(query)) {
    genres.push("House")
  }
  if (/\b(electronic|edm)\b/i.test(query)) {
    genres.push("Electronic")
  }
  if (/\b(jazz)\b/i.test(query)) {
    genres.push("Jazz")
  }
  if (/\b(classical|klassiek)\b/i.test(query)) {
    genres.push("Classical")
  }
  if (/\b(pop)\b/i.test(query)) {
    genres.push("Pop")
  }
  if (/\b(hip-hop|hiphop|rap)\b/i.test(query)) {
    genres.push("Hip-Hop")
  }
  if (/\b(r&b|rnb)\b/i.test(query)) {
    genres.push("R&B")
  }
  if (/\b(rock)\b/i.test(query)) {
    genres.push("Rock")
  }
  if (/\b(disco)\b/i.test(query)) {
    genres.push("Disco")
  }
  if (/\b(funk)\b/i.test(query)) {
    genres.push("Funk")
  }
  if (/\b(soul)\b/i.test(query)) {
    genres.push("Soul")
  }
  if (/\b(blues)\b/i.test(query)) {
    genres.push("Blues")
  }
  if (/\b(reggae)\b/i.test(query)) {
    genres.push("Reggae")
  }
  if (/\b(latin|latino)\b/i.test(query)) {
    genres.push("Latin")
  }

  return genres
}

function extractExplicitEventTypes(query: string): string[] {
  const eventTypes: string[] = []

  if (/\b(wedding|bruiloft|huwelijk|trouwen|trouwdag)\b/i.test(query)) {
    eventTypes.push("Wedding")
  }

  if (/\b(corporate|zakelijk|business|bedrijf)\b/i.test(query)) {
    eventTypes.push("Corporate")
  }

  if (/\b(birthday|verjaardag|jarig|jubileum|celebration|viering|feest|feestje|anniversary)\b/i.test(query)) {
    eventTypes.push("Birthday")
  }

  if (
    /\b(\d+\s*(jaar|jarig|years?)|man|vrouw|husband|wife|son|daughter|zoon|dochter|moeder|vader|mother|father)\b/i.test(
      query,
    )
  ) {
    // If someone mentions "25 jarig voor mijn vrouw", it's likely a birthday/anniversary celebration
    if (!eventTypes.includes("Birthday")) {
      eventTypes.push("Birthday")
    }
  }

  if (/\b(club|nachtclub|nightclub)\b/i.test(query)) {
    eventTypes.push("Club")
  }
  if (/\b(festival)\b/i.test(query)) {
    eventTypes.push("Festival")
  }
  if (/\b(party|private party)\b/i.test(query)) {
    eventTypes.push("Private Party")
  }
  if (/\b(kids|kinderen|children)\b/i.test(query)) {
    eventTypes.push("Kids Party")
  }
  if (/\b(cocktail)\b/i.test(query)) {
    eventTypes.push("Cocktail Party")
  }
  if (/\b(dinner|diner)\b/i.test(query)) {
    eventTypes.push("Dinner")
  }
  if (/\b(outdoor|buiten)\b/i.test(query)) {
    eventTypes.push("Outdoor Event")
  }

  return eventTypes
}

// Generate contextual insights for users
export function generateSearchInsights(query: string, suggestions: FilterSuggestions): string[] {
  const insights: string[] = []

  if (suggestions.categories && suggestions.categories.length > 0) {
    insights.push(`Artiest type gefilterd op: ${suggestions.categories.join(", ")}`)
  }

  if (suggestions.selectedDate) {
    const date = new Date(suggestions.selectedDate)
    const formattedDate = date.toLocaleDateString("nl-NL", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
    insights.push(`Datum gefilterd op: ${formattedDate}`)
  }

  if (suggestions.priceRange) {
    insights.push(
      `Prijsbereik aangepast naar €${suggestions.priceRange[0]} - €${suggestions.priceRange[1]} op basis van je zoekopdracht`,
    )
  }

  if (suggestions.musicGenres && suggestions.musicGenres.length > 0) {
    insights.push(`Muziekgenres gefilterd op: ${suggestions.musicGenres.join(", ")}`)
  }

  if (suggestions.eventTypes && suggestions.eventTypes.length > 0) {
    insights.push(`Evenementtype ingesteld op: ${suggestions.eventTypes.join(", ")}`)
  }

  if (suggestions.duration) {
    insights.push(`Aanbevolen duur: ${suggestions.duration} uur`)
  }

  if (suggestions.city) {
    insights.push(`Locatie gefocust op: ${suggestions.city}`)
  }

  return insights
}

function extractArtistTypes(query: string): string[] {
  const types: string[] = []

  if (/\b(dj|deejay|disc jockey)\b/i.test(query)) {
    types.push("DJ")
  }
  if (/\b(saxophonist|saxofoon|sax)\b/i.test(query)) {
    types.push("Saxophonist")
  }
  if (/\b(band|live band|muziekband)\b/i.test(query)) {
    types.push("Band")
  }
  if (/\b(singer|zanger|vocalist|zangeres)\b/i.test(query)) {
    types.push("Singer")
  }
  if (/\b(pianist|piano)\b/i.test(query)) {
    types.push("Pianist")
  }
  if (/\b(guitarist|gitarist|guitar)\b/i.test(query)) {
    types.push("Guitarist")
  }
  if (/\b(violinist|violist|viool)\b/i.test(query)) {
    types.push("Violinist")
  }
  if (/\b(live music|live muziek)\b/i.test(query)) {
    types.push("Live Music")
  }

  return types
}

// Helper functions for query analysis
function isWeddingQuery(query: string): boolean {
  return /\b(wedding|bruiloft|huwelijk|trouwen|romantic|romantisch)\b/i.test(query)
}

function isCorporateQuery(query: string): boolean {
  return /\b(corporate|zakelijk|business|bedrijf|professional|werk)\b/i.test(query)
}

function isBirthdayQuery(query: string): boolean {
  return /\b(birthday|verjaardag|celebration|viering|feest)\b/i.test(query)
}

function isClubQuery(query: string): boolean {
  return /\b(club|nachtclub|nightclub|dancing|uitgaan|dance)\b/i.test(query)
}

function isFestivalQuery(query: string): boolean {
  return /\b(festival|outdoor|groot evenement|main stage)\b/i.test(query)
}

function isKidsQuery(query: string): boolean {
  return /\b(kids|kinderen|children|family|familie|all ages)\b/i.test(query)
}

function isTechnoQuery(query: string): boolean {
  return /\b(techno|underground|rave)\b/i.test(query)
}

function isHouseQuery(query: string): boolean {
  return /\b(house|house music|electronic dance)\b/i.test(query)
}

function isHipHopQuery(query: string): boolean {
  return /\b(hip-hop|hiphop|rap|urban|street)\b/i.test(query)
}

function isJazzQuery(query: string): boolean {
  return /\b(jazz|lounge|smooth|sophisticated)\b/i.test(query)
}

function isClassicQuery(query: string): boolean {
  return /\b(classic|klassiek|oldies|vintage|retro)\b/i.test(query)
}

function parseDateFromQuery(query: string): { date: string; month: string; year: string } | null {
  const currentYear = new Date().getFullYear()

  // Dutch month names
  const dutchMonths: Record<string, number> = {
    januari: 1,
    jan: 1,
    februari: 2,
    feb: 2,
    maart: 3,
    mar: 3,
    april: 4,
    apr: 4,
    mei: 5,
    juni: 6,
    jun: 6,
    juli: 7,
    jul: 7,
    augustus: 8,
    aug: 8,
    september: 9,
    sep: 9,
    oktober: 10,
    okt: 10,
    november: 11,
    nov: 11,
    december: 12,
    dec: 12,
  }

  const monthNames = [
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

  let extractedYear = currentYear
  const yearMatch = query.match(/\b(20\d{2})\b/)
  if (yearMatch) {
    extractedYear = Number.parseInt(yearMatch[1])
  }

  const datePatterns = [
    // DD-MM-YYYY format
    /(\d{1,2})[-/](\d{1,2})[-/](20\d{2})/,
    // DD month YYYY with Dutch months
    /(\d{1,2})\s+(januari|februari|maart|april|mei|juni|juli|augustus|september|oktober|november|december|jan|feb|mar|apr|jun|jul|aug|sep|okt|nov|dec)\s+(20\d{2})/i,
    // DD month patterns (without year) - use extracted year
    /(\d{1,2})\s+(januari|februari|maart|april|mei|juni|juli|augustus|september|oktober|november|december|jan|feb|mar|apr|jun|jul|aug|sep|okt|nov|dec)\b/i,
    // month DD patterns
    /(januari|februari|maart|april|mei|juni|juli|augustus|september|oktober|november|december|jan|feb|mar|apr|jun|jul|aug|sep|okt|nov|dec)\s+(\d{1,2})/i,
    // DD-MM or DD/MM patterns
    /(\d{1,2})[-/](\d{1,2})/,
    // Christmas and New Year
    /kerst|christmas/i,
    /nieuwjaar|new year/i,
    /oudejaarsavond|new year's eve/i,
    /\bop\s+(?:dag\s+)?(\d{1,2})\b/i,
  ]

  for (const pattern of datePatterns) {
    const match = query.match(pattern)
    if (match) {
      let day: number,
        month: number,
        year: number = extractedYear

      if (pattern.source.includes("kerst|christmas")) {
        day = 25
        month = 12
      } else if (pattern.source.includes("nieuwjaar|new year")) {
        day = 1
        month = 1
        year = currentYear + 1
      } else if (pattern.source.includes("oudejaarsavond")) {
        day = 31
        month = 12
      } else if (pattern.source.includes("op\\s+")) {
        day = Number.parseInt(match[1])
        month = new Date().getMonth() + 1
      } else if (match[1] && match[2] && match[3] && !isNaN(Number.parseInt(match[3]))) {
        day = Number.parseInt(match[1])
        month = Number.parseInt(match[2])
        year = Number.parseInt(match[3])
      } else if (match[1] && dutchMonths[match[1].toLowerCase()]) {
        // month DD pattern
        month = dutchMonths[match[1].toLowerCase()]
        day = Number.parseInt(match[2])
      } else if (match[2] && dutchMonths[match[2].toLowerCase()]) {
        // DD month pattern (with or without year)
        day = Number.parseInt(match[1])
        month = dutchMonths[match[2].toLowerCase()]
        if (match[3]) {
          year = Number.parseInt(match[3])
        }
      } else if (match[1] && match[2] && !isNaN(Number.parseInt(match[1])) && !isNaN(Number.parseInt(match[2]))) {
        // DD-MM or DD/MM pattern
        day = Number.parseInt(match[1])
        month = Number.parseInt(match[2])
      } else {
        continue
      }

      // Validate date
      if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
        const dateStr = `${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`
        return {
          date: dateStr,
          month: monthNames[month - 1],
          year: year.toString(),
        }
      }
    }
  }

  return null
}

function extractPriceFromQuery(query: string): [number, number] | null {
  // Pattern: budget/max followed by amount
  const budgetMatch = query.match(/\b(?:budget|max|maximum|tot|up to)\s*(?:is|van)?\s*(\d+)\s*(?:euro|eur|€)?/i)
  if (budgetMatch) {
    const maxPrice = Number.parseInt(budgetMatch[1])
    const minPrice = Math.max(100, Math.floor(maxPrice * 0.5))
    return [minPrice, maxPrice]
  }

  // Pattern: tussen X en Y, between X and Y
  const rangeMatch = query.match(/\b(?:tussen|between)\s*(\d+)\s*(?:en|and)\s*(\d+)\s*(?:euro|eur|€)?/i)
  if (rangeMatch) {
    const minPrice = Number.parseInt(rangeMatch[1])
    const maxPrice = Number.parseInt(rangeMatch[2])
    return [minPrice, maxPrice]
  }

  // Pattern: minimum X euro
  const minMatch = query.match(/\b(?:min|minimum|vanaf|from)\s*(\d+)\s*(?:euro|eur|€)?/i)
  if (minMatch) {
    const minPrice = Number.parseInt(minMatch[1])
    return [minPrice, 5000]
  }

  // Pattern: just a number followed by euro (e.g., "400 euro")
  const simpleMatch = query.match(/\b(\d{2,4})\s*(?:euro|eur|€)/i)
  if (simpleMatch) {
    const price = Number.parseInt(simpleMatch[1])
    const minPrice = Math.max(100, Math.floor(price * 0.5))
    return [minPrice, price]
  }

  return null
}
