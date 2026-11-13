// The music genres and event types a professional can choose from in the registration form.
// Genres are stored by their value; event types are stored by their label, as before.

export interface OptionGroup {
  nl: string
  en: string
  options: { value: string; nl: string; en: string }[]
}

const same = (value: string, label: string) => ({ value, nl: label, en: label })

export const GENRE_GROUPS: OptionGroup[] = [
  {
    nl: "Elektronisch",
    en: "Electronic",
    options: [
      same("house", "House"),
      same("deep-house", "Deep House"),
      same("tech-house", "Tech House"),
      same("afro-house", "Afro House"),
      same("progressive-house", "Progressive House"),
      same("techno", "Techno"),
      same("melodic-techno", "Melodic Techno"),
      same("trance", "Trance"),
      same("edm", "EDM"),
      same("drum-and-bass", "Drum & Bass"),
      same("dubstep", "Dubstep"),
      same("hardstyle", "Hardstyle"),
      same("uk-garage", "UK Garage"),
      same("disco", "Disco"),
      same("nu-disco", "Nu Disco"),
      same("lounge", "Lounge & Chill-out"),
    ],
  },
  {
    nl: "Urban",
    en: "Urban",
    options: [
      same("hiphop", "Hip Hop"),
      same("rnb", "R&B"),
      same("afrobeats", "Afrobeats"),
      same("amapiano", "Amapiano"),
      same("dancehall", "Dancehall"),
      same("reggaeton", "Reggaeton"),
      same("moombahton", "Moombahton"),
      same("trap", "Trap"),
    ],
  },
  {
    nl: "Pop & Rock",
    en: "Pop & Rock",
    options: [
      same("pop", "Pop"),
      same("top40", "Top 40"),
      { value: "80s", nl: "Jaren 80", en: "80s" },
      { value: "90s", nl: "Jaren 90", en: "90s" },
      { value: "00s", nl: "Jaren 00", en: "00s" },
      same("rock", "Rock"),
      same("indie", "Indie"),
      { value: "alternative", nl: "Alternatief", en: "Alternative" },
      same("metal", "Metal"),
      same("punk", "Punk"),
      same("singer-songwriter", "Singer-songwriter"),
      same("country", "Country"),
      same("folk", "Folk"),
    ],
  },
  {
    nl: "Jazz, Soul & Funk",
    en: "Jazz, Soul & Funk",
    options: [
      same("jazz", "Jazz"),
      same("blues", "Blues"),
      same("soul", "Soul"),
      same("funk", "Funk"),
      same("motown", "Motown"),
      same("swing", "Swing"),
      same("gospel", "Gospel"),
      same("bossa-nova", "Bossa Nova"),
    ],
  },
  {
    nl: "Latin & Wereld",
    en: "Latin & World",
    options: [
      same("latin", "Latin"),
      same("salsa", "Salsa"),
      same("bachata", "Bachata"),
      same("merengue", "Merengue"),
      same("reggae", "Reggae"),
      { value: "arabic", nl: "Arabisch", en: "Arabic" },
      { value: "turkish", nl: "Turks", en: "Turkish" },
      { value: "persian", nl: "Perzisch", en: "Persian" },
      same("bollywood", "Bollywood"),
      same("balkan", "Balkan"),
      same("flamenco", "Flamenco"),
      same("celtic", "Celtic"),
      same("bluegrass", "Bluegrass"),
    ],
  },
  {
    nl: "Klassiek & Theater",
    en: "Classical & Theatre",
    options: [
      { value: "classical", nl: "Klassiek", en: "Classical" },
      { value: "contemporary", nl: "Hedendaags", en: "Contemporary" },
      same("opera", "Opera"),
      { value: "musical", nl: "Musical", en: "Musical Theatre" },
      { value: "film-music", nl: "Filmmuziek", en: "Film Music" },
      same("ragtime", "Ragtime"),
    ],
  },
  {
    nl: "Nederlands & Feest",
    en: "Dutch & Party",
    options: [
      { value: "nederlandstalig", nl: "Nederlandstalig", en: "Dutch-language" },
      { value: "hollandse-hits", nl: "Hollandse hits", en: "Dutch hits" },
      { value: "feestmuziek", nl: "Feestmuziek", en: "Party music" },
      { value: "apres-ski", nl: "Après-ski", en: "Après-ski" },
      { value: "carnaval", nl: "Carnaval", en: "Carnival" },
      { value: "kindermuziek", nl: "Kindermuziek", en: "Children's music" },
    ],
  },
]

const event = (nl: string, en: string) => ({ value: nl, nl, en })

export const EVENT_TYPE_GROUPS: OptionGroup[] = [
  {
    nl: "Privé",
    en: "Private",
    options: [
      event("Verjaardag", "Birthday"),
      event("Bruiloft", "Wedding"),
      event("Verloving", "Engagement"),
      event("Jubileum", "Anniversary"),
      event("Vrijgezellenfeest", "Bachelor(ette) party"),
      event("Babyshower", "Baby shower"),
      event("Afstudeerfeest", "Graduation party"),
      event("Sweet 16", "Sweet 16"),
      event("Huisfeest", "House party"),
      event("Tuinfeest", "Garden party"),
      event("Privédiner", "Private dinner"),
      event("Privéfeest", "Private Party"),
      event("Religieuze viering", "Religious celebration"),
      event("Afscheid of herdenking", "Farewell or memorial"),
    ],
  },
  {
    nl: "Zakelijk",
    en: "Corporate",
    options: [
      event("Bedrijfsfeest", "Company party"),
      event("Personeelsfeest", "Staff party"),
      event("Netwerkborrel", "Networking drinks"),
      event("Productlancering", "Product launch"),
      event("Opening", "Opening"),
      event("Congres", "Conference"),
      event("Beurs", "Trade fair"),
      event("Gala", "Gala"),
      event("Kerstborrel", "Christmas party"),
      event("Nieuwjaarsreceptie", "New Year's reception"),
      event("Teamuitje", "Team outing"),
    ],
  },
  {
    nl: "Publiek",
    en: "Public",
    options: [
      event("Festival", "Festival"),
      event("Clubavond", "Club Night"),
      event("Concert", "Concert"),
      event("Café of bar", "Café or bar"),
      event("Restaurant", "Restaurant"),
      event("Studentenfeest", "Student party"),
      event("Schoolfeest", "School party"),
      event("Straatfeest", "Street party"),
      event("Sportevenement", "Sports event"),
      event("Modeshow", "Fashion show"),
      event("Benefiet", "Charity event"),
      event("Koningsdag", "King's Day"),
      event("Oud en nieuw", "New Year's Eve"),
      event("Carnaval", "Carnival"),
    ],
  },
]

export function genreLabel(value: string, dutch: boolean) {
  for (const group of GENRE_GROUPS) {
    const option = group.options.find((item) => item.value === value)
    if (option) return dutch ? option.nl : option.en
  }
  return value
}
