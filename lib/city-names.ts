/** Lower case without accents or punctuation, so texts can be compared. */
export function normalizeText(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " n ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}

const CITY_ALIASES: Record<string, string> = {
  "the hague": "Den Haag",
  "s gravenhage": "Den Haag",
  "den bosch": "'s-Hertogenbosch",
  "s hertogenbosch": "'s-Hertogenbosch",
}

/** The Dutch name of a city that people write in more than one way. */
export function canonicalCity(city: string) {
  return CITY_ALIASES[normalizeText(city)] ?? city.trim()
}
