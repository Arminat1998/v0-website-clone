// Reads filters from free text (Dutch or English): "DJ voor een bruiloft in Utrecht op 15 mei".

import { todayIso } from "@/lib/bookings/format"
import { ARTIST_TYPES, EVENT_TYPE_GROUPS, GENRE_GROUPS, PHOTO_VIDEO_TYPES } from "@/lib/profile-options"
import { canonicalCity, normalizeText } from "@/lib/city-names"
import { NO_FILTERS, PRICE_MAX, isRealDate, type ListFilters, type ProfessionalKind } from "@/lib/list-filters"

// Names of types, genres and event types

/** A value with every way it is written, normalised. */
type Names = [value: string, names: string[]][]

// Inflections and synonyms on top of the labels from profile-options.
const EVENT_WORDS: Record<string, string[]> = {
  Wedding: ["bruiloften", "bruilofts", "bruiloftsfeest", "bruidspaar", "huwelijk", "huwelijksfeest", "trouwen", "trouw", "trouwdag", "trouwfeest", "trouwerij", "weddings", "marriage", "getting married"],
  Birthday: ["verjaardagen", "verjaardags", "verjaardagsfeest", "verjaardagsfeestje", "verjaardag feest", "jarig", "jarige", "birthdays", "birthday party", "birthday parties"],
  Anniversary: ["jubileumfeest", "jubilea", "jarig huwelijk", "jaar getrouwd", "wedding anniversary", "anniversaries"],
  Engagement: ["verlovingsfeest", "engagement party"],
  "Bachelor Party": ["vrijgezellenfeestje", "bachelorette", "bachelorette party", "hen party", "stag party"],
  "Graduation Party": ["afstuderen", "graduation", "diploma uitreiking", "diplomauitreiking"],
  "House Party": ["housewarming"],
  "Private Dinner": ["prive diner", "diner", "dinner"],
  "Private Party": ["prive feest", "private parties", "private event"],
  "Farewell or Memorial": ["afscheid", "afscheidsfeest", "herdenking", "uitvaart", "farewell", "memorial", "funeral"],
  "Corporate Event": ["corporate", "corporate events", "corporate party", "zakelijk", "zakelijke", "zakelijk evenement", "zakelijk event", "zakelijk feest", "business", "business event", "bedrijf", "bedrijfs", "bedrijfsfeestje", "bedrijfsevenement", "bedrijfsevent", "bedrijfsborrel", "company party", "company event", "office party"],
  "Staff Party": ["personeels", "personeelsfeestje"],
  "Networking Drinks": ["netwerkborrels", "netwerkevent", "networking", "networking event"],
  "Product Launch": ["productlanceringen", "product lancering"],
  Conference: ["congressen", "conferentie", "conferences"],
  "Trade Fair": ["trade show", "vakbeurs"],
  "Christmas Party": ["kerstfeest", "kerst borrel"],
  "Team Outing": ["teamuitjes", "teambuilding", "team building"],
  Festival: ["festivals"],
  "Club Night": ["club", "nachtclub", "nightclub", "clubnight", "club avond", "clubs"],
  Concert: ["concerten", "concerts"],
  "Café or Bar": ["cafe", "bar", "kroeg", "pub"],
  "Student Party": ["studentenfeestje"],
  "King's Day": ["kings day", "koningsnacht"],
  "New Year's Eve": ["new years eve", "oudejaarsavond", "oudejaarsfeest", "oud nieuw"],
  "New Year's Reception": ["new years reception", "nieuwjaarsborrel"],
}

const GENRE_WORDS: Record<string, string[]> = {
  house: ["housemuziek", "house music"],
  techno: ["technomuziek", "techno music"],
  "drum-and-bass": ["drum and bass", "dnb"],
  lounge: ["lounge", "chill out", "chillout", "loungemuziek"],
  hiphop: ["hiphop", "rap"],
  rnb: ["rnb"],
  pop: ["popmuziek", "pop music"],
  top40: ["top40", "charts"],
  "80s": ["eighties", "jaren tachtig", "jaren 80"],
  "90s": ["nineties", "jaren negentig", "jaren 90"],
  "00s": ["jaren nul", "jaren 00"],
  rock: ["rockmuziek", "rock music"],
  jazz: ["jazzmuziek", "jazz music"],
  latin: ["latino", "latin music"],
  classical: ["klassieke", "klassieke muziek", "classical music"],
  nederlandstalig: ["nederlandse muziek", "nederlandstalige", "dutch music"],
  "hollandse-hits": ["hollandse"],
  "apres-ski": ["apres ski"],
  kindermuziek: ["kinderliedjes"],
}

const ARTIST_WORDS: Record<string, string[]> = {
  DJ: ["djs", "dj s", "deejay", "diskjockey", "disc jockey"],
  Band: ["bands", "coverband", "coverbands", "liveband", "livebands", "bandje"],
  Singer: ["zanger", "zangeres", "zangers", "singers", "vocalist", "vocalists"],
  Saxophonist: ["saxofoniste", "saxofoon", "sax", "saxophone", "sax player"],
  Pianist: ["pianiste", "piano", "piano player"],
  Guitarist: ["gitaar", "gitariste", "guitar", "guitar player"],
  Violinist: ["violiste", "viool", "violin", "violin player"],
}

const PHOTO_WORDS: Record<string, string[]> = {
  Photographer: ["fotografe", "fotografen", "fotografie", "foto", "fotos", "foto s", "photographers", "photography", "photo", "photos"],
  Videographer: ["videografe", "videografen", "videografie", "video", "videos", "video s", "videographers", "videography", "film", "filmer", "filmen", "cameraman", "cinematographer", "aftermovie"],
  "Photographer & Videographer": [],
}

function namesOf(options: { value: string; nl: string; en: string }[], extra: Record<string, string[]>): Names {
  return options.map((option) => [
    option.value,
    [...new Set([option.value, option.nl, option.en, ...(extra[option.value] ?? [])].map(normalizeText))],
  ])
}

const EVENT_NAMES = namesOf(EVENT_TYPE_GROUPS.flatMap((group) => group.options), EVENT_WORDS)
const GENRE_NAMES = namesOf(GENRE_GROUPS.flatMap((group) => group.options), GENRE_WORDS)
const ARTIST_NAMES = namesOf(ARTIST_TYPES, ARTIST_WORDS)
const PHOTO_NAMES = namesOf(PHOTO_VIDEO_TYPES, PHOTO_WORDS)

/** The values named in a normalised text, and what is left of it. Longer names win: "house party" is not house. */
function takeNames(text: string, list: Names): { values: string[]; rest: string } {
  const names = list.flatMap(([value, variants]) => variants.map((name) => ({ value, name }))).sort((a, b) => b.name.length - a.name.length)
  let rest = ` ${text} `
  const found: { value: string; at: number }[] = []
  for (const { value, name } of names) {
    const at = name ? rest.indexOf(` ${name} `) : -1
    if (at < 0) continue
    found.push({ value, at })
    // Keeps the length, so the positions stay right and parts of this name are not found again.
    rest = rest.slice(0, at) + ` ${"|".repeat(name.length)} ` + rest.slice(at + name.length + 2)
  }
  found.sort((a, b) => a.at - b.at)
  return { values: [...new Set(found.map((item) => item.value))], rest: rest.replace(/\|+/g, " ").replace(/\s+/g, " ").trim() }
}

/** Dutch compounds that name an event and a type at once: "bruidsfotograaf" is a photographer for a wedding. */
function splitCompounds(text: string) {
  return text
    .replace(/\b(bruids|bruilofts|trouw)(?=(foto|video|film|dj|band|zanger|sax))/g, "bruiloft ")
    .replace(/\b(bedrijfs)(?=(foto|video|film|dj|band))/g, "bedrijf ")
    .replace(/\b(concert|festival)(?=(foto|video|film))/g, "$1 ")
    .replace(/\b(event|evenementen)(?=(foto|video|film))/g, "")
}

export function eventTypesIn(text: string) {
  return takeNames(splitCompounds(normalizeText(text)), EVENT_NAMES).values
}

export function genresIn(text: string) {
  return takeNames(normalizeText(text), GENRE_NAMES).values
}

function typesFrom(normalized: string, kind: ProfessionalKind) {
  const result = takeNames(normalized, kind === "artist" ? ARTIST_NAMES : PHOTO_NAMES)
  // Asking for photo and video means one professional who does both.
  if (kind === "photo-video" && result.values.length > 1) result.values = ["Photographer & Videographer"]
  return result
}

export function typesIn(text: string, kind: ProfessionalKind) {
  return typesFrom(splitCompounds(normalizeText(text)), kind).values
}

// Cities

const CITIES = [
  "Amsterdam", "Rotterdam", "Den Haag", "The Hague", "'s-Gravenhage", "Utrecht", "Eindhoven", "Groningen", "Tilburg", "Almere", "Breda",
  "Nijmegen", "Apeldoorn", "Haarlem", "Arnhem", "Enschede", "Amersfoort", "Zaandam", "Den Bosch", "'s-Hertogenbosch", "Zwolle", "Zoetermeer",
  "Leiden", "Leeuwarden", "Maastricht", "Dordrecht", "Ede", "Alphen aan den Rijn", "Alkmaar", "Emmen", "Delft", "Venlo", "Deventer", "Sittard",
  "Helmond", "Oss", "Amstelveen", "Hilversum", "Heerlen", "Purmerend", "Roosendaal", "Schiedam", "Spijkenisse", "Lelystad", "Vlaardingen",
  "Almelo", "Gouda", "Hoorn", "Assen", "Bergen op Zoom", "Capelle aan den IJssel", "Veenendaal", "Katwijk", "Zeist", "Nieuwegein", "Roermond",
  "Woerden", "Doetinchem", "Middelburg", "Vlissingen", "Den Helder", "Terneuzen", "Antwerpen", "Gent", "Brugge", "Brussel", "Leuven", "Hasselt",
]
const CITY_NAMES: Names = CITIES.map((city) => [canonicalCity(city), [normalizeText(city)]])
// Ordinary Dutch words that are also places; only used after "in".
const AMBIGUOUS_CITIES = new Set(["ede", "oss", "leiden", "assen", "gent", "hoorn"])

/** A city in a sentence: a known place, or a capitalised name after "in". */
function cityIn(raw: string): { city: string; match: string } | null {
  const normalized = normalizeText(raw)
  for (const [city, [name]] of [...CITY_NAMES].sort((a, b) => b[1][0].length - a[1][0].length)) {
    const pattern = AMBIGUOUS_CITIES.has(name) ? ` (?:in|te|near|rond|omgeving) ${name} ` : ` ${name} `
    if (new RegExp(pattern).test(` ${normalized} `)) return { city, match: name }
  }
  const named = /(?:^|\s)(?:in|te|near|nabij)\s+((?:'s-|Sint |St\. |De |Den )?\p{Lu}[\p{L}'-]{2,}(?:\s(?:aan den|op|\p{Lu})[\p{L}' -]*)?)/u.exec(raw)
  if (!named) return null
  const name = named[1].trim()
  const known = takeNames(normalizeText(name), [...EVENT_NAMES, ...GENRE_NAMES, ...ARTIST_NAMES]).values.length > 0
  return known || MONTH_PATTERN.test(name) || WEEKDAY_PATTERN.test(name) ? null : { city: name, match: normalizeText(name) }
}

function titleCase(text: string) {
  const small = new Set(["aan", "den", "de", "op", "bij", "in", "en", "het", "van", "ter"])
  return text
    .split(/(\s+)/)
    .map((word, index) => (index > 0 && small.has(word.toLowerCase()) ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1)))
    .join("")
}

/** The city in the answer to "in which city?", where any place name may be given. */
export function cityFromAnswer(answer: string): string | null {
  const known = cityIn(answer) ?? cityIn(`in ${answer}`)
  if (known) return known.city
  const place = answer
    .trim()
    .replace(/^(?:(?:het |dat |dit )?(?:is|wordt|zal zijn)\s+)?(?:(?:ergens|somewhere)\s+)?(?:in de buurt van|in de omgeving van|omgeving|in|uit|te|bij|nabij|rond(?:om)?|around|near|close to|at)\s+/i, "")
    .replace(/\s+(?:en|of|or|and)\s+(?:omgeving|omstreken|surroundings|nearby).*$/i, "")
    .replace(/[,.!?]+$/, "")
    .trim()
  if (!/^[\p{L}][\p{L}\p{M} '’.-]{1,39}$/u.test(place) || place.split(/\s+/).length > 4) return null
  return canonicalCity(titleCase(place))
}

// Dates

const MONTHS: Record<string, number> = {
  januari: 1, january: 1, jan: 1, februari: 2, february: 2, feb: 2, maart: 3, march: 3, mrt: 3, mar: 3, april: 4, apr: 4, mei: 5, may: 5,
  juni: 6, june: 6, jun: 6, juli: 7, july: 7, jul: 7, augustus: 8, august: 8, aug: 8, september: 9, sept: 9, sep: 9,
  oktober: 10, october: 10, okt: 10, oct: 10, november: 11, nov: 11, december: 12, dec: 12,
}
const MONTH = `(${Object.keys(MONTHS).sort((a, b) => b.length - a.length).join("|")})`
const MONTH_PATTERN = new RegExp(`^${MONTH}\\b`, "i")
const WEEKDAYS: Record<string, number> = {
  zondag: 0, sunday: 0, maandag: 1, monday: 1, dinsdag: 2, tuesday: 2, woensdag: 3, wednesday: 3, donderdag: 4, thursday: 4,
  vrijdag: 5, friday: 5, zaterdag: 6, saturday: 6,
}
const WEEKDAY = `(${Object.keys(WEEKDAYS).join("|")})`
const WEEKDAY_PATTERN = new RegExp(`^${WEEKDAY}\\b`, "i")

/** A date in a text; `past` when the text names a day that is over. */
export interface FoundDate {
  iso: string
  match: string
  past: boolean
}

function toIso(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}

function addDays(iso: string, days: number) {
  const [year, month, day] = iso.split("-").map(Number)
  const date = new Date(year, month - 1, day + days)
  return toIso(date.getFullYear(), date.getMonth() + 1, date.getDate())
}

/** Without a year, the first time the day comes around. */
function findDate(match: string, day: number, month: number, yearText: string | undefined, today: string): FoundDate | null {
  if (yearText) {
    const year = Number(yearText.length === 2 ? `20${yearText}` : yearText)
    const iso = toIso(year, month, day)
    return isRealDate(iso) ? { iso, match, past: iso < today } : null
  }
  const thisYear = Number(today.slice(0, 4))
  // Four years, because 29 February does not exist in most of them.
  for (let year = thisYear; year <= thisYear + 4; year++) {
    const iso = toIso(year, month, day)
    if (isRealDate(iso) && iso >= today) return { iso, match, past: false }
  }
  return null
}

/** Finds a date in Dutch or English text. `answer` also accepts a bare day, such as "de 15e". */
export function dateIn(raw: string, options: { answer?: boolean; today?: string } = {}): FoundDate | null {
  const today = options.today ?? todayIso()
  const text = raw.toLowerCase()
  const year = "(?:,?\\s+(20\\d{2}))?"
  let m: RegExpExecArray | null

  if ((m = /\b(20\d{2})-(\d{1,2})-(\d{1,2})\b/.exec(text))) return findDate(m[0], Number(m[3]), Number(m[2]), m[1], today)
  if ((m = /\b(\d{1,2})[-/.](\d{1,2})[-/.](20\d{2}|\d{2})\b/.exec(text))) {
    const [a, b] = [Number(m[1]), Number(m[2])]
    // Day first; month first only when that is the only way to read it (12/31/2026).
    return b > 12 && a <= 12 ? findDate(m[0], b, a, m[3], today) : findDate(m[0], a, b, m[3], today)
  }
  if ((m = new RegExp(`\\b(\\d{1,2})(?:e|de|ste|st|nd|rd|th)?\\.?\\s+(?:of\\s+|van\\s+)?${MONTH}\\b\\.?${year}`).exec(text))) {
    return findDate(m[0], Number(m[1]), MONTHS[m[2]], m[3], today)
  }
  if ((m = new RegExp(`\\b${MONTH}\\.?\\s+(?:the\\s+)?(\\d{1,2})(?:e|de|ste|st|nd|rd|th)?\\b(?!\\s*(?::|uur|hours?|u\\b))${year}`).exec(text))) {
    return findDate(m[0], Number(m[2]), MONTHS[m[1]], m[3], today)
  }
  if ((m = /(?<![\d€.,])\b(\d{1,2})[-/](\d{1,2})\b(?![-/.]?\d|\s*(?:uur|uren|u\b|hours?|hrs?|euro?s?|€|:|personen|pers|gasten|guests|people))/.exec(text))) {
    const found = findDate(m[0], Number(m[1]), Number(m[2]), undefined, today)
    if (found) return found
  }

  const fixed: [RegExp, number, number][] = [
    [/\b(?:oudejaarsavond|oud (?:en|&) nieuw|new year'?s eve)\b/, 31, 12],
    [/\b(?:nieuwjaarsdag|nieuwjaar|new year'?s day)\b/, 1, 1],
    [/\b(?:kerstavond|christmas eve)\b/, 24, 12],
    [/\b(?:tweede kerstdag|2e kerstdag|boxing day)\b/, 26, 12],
    [/\b(?:eerste kerstdag|1e kerstdag|kerstmis|kerst|christmas day|christmas(?! party| drinks))\b/, 25, 12],
    [/\b(?:koningsdag|king'?s day)\b/, 27, 4],
  ]
  for (const [pattern, day, month] of fixed) {
    if ((m = pattern.exec(text))) return findDate(m[0], day, month, /\b(20\d{2})\b/.exec(text)?.[1], today)
  }

  if ((m = /\b(?:overmorgen|day after tomorrow)\b/.exec(text))) return { iso: addDays(today, 2), match: m[0], past: false }
  if ((m = /\b(?:morgen(?:avond|middag|ochtend)?|tomorrow)\b/.exec(text))) return { iso: addDays(today, 1), match: m[0], past: false }
  if ((m = /\b(?:vandaag|vanavond|vanmiddag|today|tonight)\b/.exec(text))) return { iso: today, match: m[0], past: false }
  if ((m = new RegExp(`\\b(volgende week\\s+|next week\\s+(?:on\\s+)?)?${WEEKDAY}(?:avond|middag|ochtend|nacht)?\\b`).exec(text))) {
    const [y, mo, d] = today.split("-").map(Number)
    const now = new Date(y, mo - 1, d).getDay()
    const target = WEEKDAYS[m[2]]
    // Weeks start on Monday, so "next week" counts from the coming Monday.
    const days = m[1] ? ((8 - (now || 7)) % 7 || 7) + ((target + 6) % 7) : (target - now + 7) % 7 || 7
    return { iso: addDays(today, days), match: m[0], past: false }
  }

  if (options.answer && (m = /^(?:op\s+|on\s+)?(?:de\s+|the\s+)?(\d{1,2})(?:e|de|ste|st|nd|rd|th)?$/.exec(text.trim()))) {
    const day = Number(m[1])
    let [y, mo] = today.split("-").map(Number)
    for (let i = 0; i < 12; i++) {
      const iso = toIso(y, mo, day)
      if (isRealDate(iso) && iso >= today) return { iso, match: m[0], past: false }
      mo = mo === 12 ? 1 : mo + 1
      if (mo === 1) y++
    }
  }
  return null
}

// Durations

const NUMBER_WORDS: Record<string, number> = {
  een: 1, één: 1, twee: 2, drie: 3, vier: 4, vijf: 5, zes: 6, zeven: 7, acht: 8, negen: 9, tien: 10, twaalf: 12,
  a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, twelve: 12,
}
const HOURS_WORD = "(?:uur|uren|uurtjes|hours?|hrs?|u)\\b"

const CLOCK = "(\\d{1,2})(?:[:.](\\d{2}))?\\s*(am|pm|a\\.m\\.|p\\.m\\.|uur|u|h)?"
const CLOCK_RANGE = new RegExp(
  `(?:\\b(van|vanaf|from|tussen|between|om|at)\\s+)?(?<![\\d€.,:])${CLOCK}(?![\\d])\\s*(?:'s (?:avonds|middags)\\s*)?(tot en met|tot|t/m|until|till|til|to|en|and|–|—|-)\\s*${CLOCK}(?![\\d.,]?\\d|\\s*(?:euro?s?|€|%|personen|pers|gasten|guests|people|jaar|years?))`,
)

function clockHours(range: RegExpExecArray) {
  const [, , h1, m1, s1 = "", , h2, m2, s2 = ""] = range
  let start = Number(h1) + Number(m1 ?? 0) / 60
  let end = Number(h2) + Number(m2 ?? 0) / 60
  if (start > 24 || end > 24 || Number(m1 ?? 0) > 59 || Number(m2 ?? 0) > 59) return null
  const half = (mark: string) => (/^p/.test(mark) ? "pm" : /^a/.test(mark) ? "am" : "")
  const endHalf = half(s2)
  // "8 to 11 pm": the start is pm too; "10 to 2 am": the start is the evening before.
  const startHalf = half(s1) || (endHalf && start <= 12 ? (start < end === (endHalf === "pm") ? "pm" : endHalf === "am" ? "pm" : "am") : "")
  if (startHalf && start <= 12) start = (start % 12) + (startHalf === "pm" ? 12 : 0)
  if (endHalf && end <= 12) end = (end % 12) + (endHalf === "pm" ? 12 : 0)
  // Without am/pm: "8 tot 12" and "20 tot 12" end at noon or midnight, "9 tot 1" in the night.
  if (!startHalf && !endHalf && end <= 12 && !m2) {
    if (start > 12 && end === 12) end = 24
    else if (start <= 12 && end <= start) end += 12
  }
  const hours = end - start
  return hours > 0 ? hours : hours + 24
}

function halfHours(hours: number) {
  const rounded = Math.round(hours * 2) / 2
  return rounded >= 0.5 && rounded <= 24 ? String(rounded) : null
}

/** A duration in hours ("4" or "3.5"). `answer` also accepts a bare number and loose times such as "8 tot 12". */
export function durationIn(raw: string, options: { answer?: boolean } = {}): { hours: string; match: string } | null {
  const text = raw
    .toLowerCase()
    .replace(/\b(?:middernacht|midnight)\b/g, "00:00")
    .replace(/\bnoon\b/g, "12:00")
  let m: RegExpExecArray | null

  // "3-4 uur" names a number of hours, not two times of the day.
  if ((m = new RegExp(`(?<!\\b(?:van|from|tussen|between|om|at)\\s)(?<![\\d:])\\b(\\d{1,2})\\s*(?:-|–|tot|à|a|to)\\s*(\\d{1,2})\\s*${HOURS_WORD}`).exec(text))) {
    const [low, high] = [Number(m[1]), Number(m[2])]
    if (low < high && high - low <= 2 && high <= 12) return found(high, m[0])
  }
  if ((m = CLOCK_RANGE.exec(text))) {
    const [match, lead = "", h1, m1, s1, word, , m2, s2] = m
    const isClock = Boolean(m1 || m2 || /^(am|pm|a\.m|p\.m)/.test(`${s1 ?? ""}`) || /^(am|pm|a\.m|p\.m)/.test(`${s2 ?? ""}`))
    const led = /^(van|vanaf|from|tussen|between)$/.test(lead)
    const joined = word === "en" || word === "and" ? /^(tussen|between)$/.test(lead) : true
    // In a sentence, times need minutes, am/pm, or "van ... tot ... uur"; "10 tot 20" alone can be anything.
    const enough = options.answer || isClock || (led && Boolean(s1 || s2))
    const hours = joined && enough && Number(h1) <= 24 ? clockHours(m) : null
    if (hours) return found(hours, match)
  }
  if ((m = /\b(?:anderhalf|anderhalve)\s+(?:uur|uren)\b|\bone and a half hours?\b|\b(?:an )?hour and a half\b/.exec(text))) return found(1.5, m[0])
  if ((m = /\b(?:een )?half uur\b|\bhalf an hour\b|\bhalf hour\b/.exec(text))) return found(0.5, m[0])
  if ((m = new RegExp(`\\b(\\d{1,2}|[a-zé]+)\\s*(?:½|(?:en|and|and a)\\s*(?:een\\s*)?half|eneenhalf)\\s*${HOURS_WORD}`).exec(text))) {
    const base = Number(m[1]) || NUMBER_WORDS[m[1]]
    if (base) return found(base + 0.5, m[0])
  }
  if ((m = /\b(twee|drie|vier|vijf|zes)(?:ë|e)n(?:een)?half\s*(?:uur|uren)\b/.exec(text))) return found(NUMBER_WORDS[m[1]] + 0.5, m[0])
  // "om 4 uur" is a time of the day.
  if ((m = new RegExp(`(?<!\\b(?:om|vanaf|rond|tegen|tot|at|from|until)\\s)(?<![\\d:.,])\\b(\\d{1,2}(?:[.,]\\d)?)\\s*${HOURS_WORD}`).exec(text))) return found(Number(m[1].replace(",", ".")), m[0])
  if ((m = new RegExp(`(?<!\\b(?:om|vanaf|rond|tegen|tot|at|from|until)\\s)\\b(${Object.keys(NUMBER_WORDS).join("|")})\\s+(?:uur|uren|hours?)\\b`).exec(text))) return found(NUMBER_WORDS[m[1]], m[0])
  if (options.answer && (m = /^(?:ongeveer |circa |about |around )?(\d{1,2}(?:[.,]5)?)$/.exec(text.trim()))) return found(Number(m[1].replace(",", ".")), m[0])
  return null

  function found(hours: number, match: string) {
    const value = halfHours(hours)
    return value ? { hours: value, match } : null
  }
}

// Prices

const AMOUNT = "(\\d{1,3}(?:[. ]\\d{3})+(?!\\d)|\\d{1,3}(?:,\\d{3})+(?!\\d)|\\d+(?:[.,]\\d{1,2})?)\\s*(k\\b)?"
const EURO = "(?:€|euro'?s?|eur\\b)"
// What a number counts when it is not money.
const NOT_MONEY = "(?!\\s*(?:[:.]\\d|\\d|%|uur|uren|u\\b|hours?|hrs?|gasten|guests|personen|persoon|pers\\b|people|person|man\\b|mensen|bezoekers|visitors|jaar|jarig|years?|jan|feb|maart|march|april|mei\\b|may\\b|jun|jul|aug|sep|okt|oct|nov|dec|km))"
const RANGE_PATTERN = new RegExp(`(?:\\b(tussen|between|van|from)\\s+)?(${EURO})?\\s*(?<![\\d:.,])${AMOUNT}\\s*(${EURO})?\\s*(?:tot|to|en|and|–|—|-)\\s*(${EURO})?\\s*${AMOUNT}${NOT_MONEY}\\s*(${EURO})?`)
const MAX_PATTERN = new RegExp(`\\b(?:max(?:imaal|imum|imale)?\\.?|budget|hoogstens|niet meer dan|minder dan|onder(?: de)?|tot|up to|at most|under|below|less than|no more than)\\s*(?:(?:is|van|of|prijs|price|voor|for|ongeveer|rond(?: de)?|about|around|:)\\s+)*(${EURO})?\\s*${AMOUNT}${NOT_MONEY}\\s*(${EURO})?`)
const MIN_PATTERN = new RegExp(`\\b(?:min(?:imaal|imum)?\\.?|minstens|vanaf|meer dan|at least|from|more than|over|above)\\s*(?:(?:is|van|of|:)\\s+)*(${EURO})?\\s*${AMOUNT}${NOT_MONEY}\\s*(${EURO})?`)
const EURO_PATTERN = new RegExp(`(?:${EURO}\\s*${AMOUNT}|(?<![\\d:.,])${AMOUNT}\\s*${EURO})`)
const PER_HOUR = /(?:\bper uur\b|\/\s*(?:uur|u|hour|hr|h)\b|\bp\/u\b|\bp\.u\.|\bper hour\b|\ban hour\b|\been uur\b|\bper hr\b|\buurtarief\b|\buurprijs\b|\bhourly\b)/
const IN_TOTAL = /\b(?:totaal|in totaal|totale|total|alles bij elkaar|altogether|voor de hele (?:avond|dag)|hele avond|whole evening)\b/

function amount(digits: string, thousand: string | undefined) {
  const grouped = /^\d{1,3}(?:[., ]\d{3})+$/.test(digits)
  const value = Number(grouped ? digits.replace(/[., ]/g, "") : digits.replace(",", "."))
  return Math.round(thousand ? value * 1000 : value)
}

export interface FoundPrice {
  range: [number, number]
  /** True when the text says per hour, false when it says in total, null when it says neither. */
  perHour: boolean | null
  match: string
}

/** A price in euros. `answer` also accepts a bare amount. */
export function priceIn(raw: string, options: { answer?: boolean } = {}): FoundPrice | null {
  const text = raw.toLowerCase()
  const perHour = PER_HOUR.test(text) ? true : IN_TOTAL.test(text) ? false : null
  const result = (min: number, max: number, match: string): FoundPrice | null => {
    const [low, high] = min <= max ? [min, max] : [max, min]
    if (high < 1) return null
    return { range: [Math.min(low, PRICE_MAX), Math.min(high, PRICE_MAX)], perHour, match }
  }
  let m: RegExpExecArray | null
  if ((m = RANGE_PATTERN.exec(text))) {
    const [match, , e1, a, k1, e2, e3, b, k2, e4] = m
    const [low, high] = [amount(a, k1), amount(b, k2)]
    // "20 tot 23" in a sentence is a time, not a price, unless there is a euro sign or it is an answer about money.
    if (e1 || e2 || e3 || e4 || options.answer || (perHour && high >= 10)) return result(low, high, match)
  }
  if ((m = MAX_PATTERN.exec(text))) {
    const [match, e1, a, k, e2] = m
    const value = amount(a, k)
    // "tot 22" can be a time; a budget of less than 25 euro needs the euro sign.
    if (e1 || e2 || options.answer || perHour || value >= 25) return result(0, value, match)
  }
  if ((m = MIN_PATTERN.exec(text))) {
    const [match, e1, a, k, e2] = m
    if (e1 || e2 || options.answer || perHour) return result(amount(a, k), PRICE_MAX, match)
  }
  if ((m = EURO_PATTERN.exec(text))) return result(0, amount(m[1] ?? m[3], m[2] ?? m[4]), m[0])
  if (options.answer && (m = new RegExp(`^(?:ongeveer |circa |rond(?: de)? |about |around )?${AMOUNT}\\s*(?:per uur|per hour|in totaal|totaal|in total|total)?[.!]?$`).exec(text.trim()))) {
    return result(0, amount(m[1], m[2]), m[0])
  }
  return null
}

/** The filters a price stands for: an hourly rate filters, a total budget is only kept as an indication. */
export function priceFilters(price: FoundPrice, assumePerHour: boolean): Partial<ListFilters> {
  if (price.perHour ?? assumePerHour) return { priceRange: price.range }
  const [min, max] = price.range
  return { budget: max < PRICE_MAX ? max : min }
}

// Whole sentences

const STOP_WORDS = new Set(
  ("de het een en of voor van in op te ik wij we ons onze onze mijn mij me je jouw zoek zoeken zoekt wil willen graag met bij aan naar die dat dit is zijn " +
    "er om als ook nog wat wie waar hoe kan kunnen moet mag heb hebben heeft nodig iemand goede goed leuke leuk mooie feest feestje feestjes evenement evenementen event events party parties " +
    "artiest artiesten muziek professional professionals avond nacht dag middag uur per euro eur budget max maximaal maximum min minimaal tot tussen vanaf onder personen gasten mensen man vrouw vriend vriendin moeder vader zoon dochter " +
    "rond ongeveer ergens buurt omgeving wordt jaar totaal " +
    "the a an and or for of in on at to i we our my me your you need want looking look with near that this is are be can must have someone good nice great " +
    "artist artists music night evening day hour hours under over up people guests person persons somebody please around about who which husband wife mother father son daughter turns total").split(" "),
)

export interface ParsedSearch {
  filters: Partial<ListFilters>
  /** Words that did not become a filter: names, moods, equipment. */
  words: string[]
}

/** Everything a search sentence says about the filters of a list. */
export function parseSearch(query: string, kind: ProfessionalKind, today?: string): ParsedSearch {
  const filters: Partial<ListFilters> = {}
  let rest = query.slice(0, 500)
  const remove = (match: string) => {
    const at = rest.toLowerCase().indexOf(match.toLowerCase())
    if (match && at >= 0) rest = `${rest.slice(0, at)} ${rest.slice(at + match.length)}`
  }

  const price = priceIn(rest)
  if (price) {
    Object.assign(filters, priceFilters(price, false))
    remove(price.match.trim())
    rest = rest.replace(new RegExp(PER_HOUR.source, "i"), " ")
  }
  const duration = durationIn(rest)
  if (duration) {
    filters.duration = duration.hours
    remove(duration.match.trim())
  }
  const date = dateIn(rest, { today })
  if (date && !date.past) filters.selectedDate = date.iso

  const city = cityIn(rest)
  if (city) filters.city = city.city

  let text = normalizeText(rest)
  if (/\b(?:wordt|word|turns?|turning) \d{1,3}\b|\b\d{1,3} (?:jarig|jaar geworden|jaar oud)\b|\b\d{1,3}(?:ste|de|e|st|nd|rd|th) (?:verjaardag|birthday)\b/.test(text) && !/getrouwd|huwelijk|married/.test(text)) {
    text = `${text} verjaardag`
  }
  if (date && !/^(?:oud|koning|king|new)/.test(date.match)) text = ` ${text} `.replace(` ${normalizeText(date.match)} `, " ").trim()
  if (city) text = ` ${text} `.replace(` ${city.match} `, " ").trim()

  const events = takeNames(splitCompounds(text), EVENT_NAMES)
  if (events.values.length > 0) filters.eventTypes = events.values
  let left = events.rest
  if (kind === "artist") {
    const genres = takeNames(left, GENRE_NAMES)
    if (genres.values.length > 0) filters.genres = genres.values
    left = genres.rest
  }
  const types = typesFrom(left, kind)
  if (types.values.length > 0) filters.categories = types.values

  const words = [...new Set(types.rest.split(" "))].filter((word) => word.length > 2 && !STOP_WORDS.has(word) && !/^\d+$/.test(word))
  return { filters, words }
}

/** The filters of a new search: those named in the text, and no others. */
export function filtersFromText(query: string, kind: ProfessionalKind): ListFilters {
  return { ...NO_FILTERS, ...parseSearch(query, kind).filters }
}

/** True when a search is about the other list, for example a photographer on the artists page. */
export function belongsToOtherList(query: string, kind: ProfessionalKind) {
  const other: ProfessionalKind = kind === "artist" ? "photo-video" : "artist"
  const text = splitCompounds(normalizeText(query))
  return typesFrom(text, kind).values.length === 0 && typesFrom(text, other).values.length > 0
}
