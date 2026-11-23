// Choices for the registration form and the filters on the artist page.
// Genres are stored by a stable value. Event types are stored by their English name.
// Both come with Dutch and English labels.

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

// The stored value of an event type is its English name.
const event = (en: string, nl: string) => ({ value: en, nl, en })

export const EVENT_TYPE_GROUPS: OptionGroup[] = [
  {
    nl: "Privé",
    en: "Private",
    options: [
      event("Birthday", "Verjaardag"),
      event("Wedding", "Bruiloft"),
      event("Engagement", "Verloving"),
      event("Anniversary", "Jubileum"),
      event("Bachelor Party", "Vrijgezellenfeest"),
      event("Baby Shower", "Babyshower"),
      event("Graduation Party", "Afstudeerfeest"),
      event("Sweet 16", "Sweet 16"),
      event("House Party", "Huisfeest"),
      event("Garden Party", "Tuinfeest"),
      event("Private Dinner", "Privédiner"),
      event("Private Party", "Privéfeest"),
      event("Religious Celebration", "Religieuze viering"),
      event("Farewell or Memorial", "Afscheid of herdenking"),
    ],
  },
  {
    nl: "Zakelijk",
    en: "Corporate",
    options: [
      event("Corporate Event", "Bedrijfsfeest"),
      event("Staff Party", "Personeelsfeest"),
      event("Networking Drinks", "Netwerkborrel"),
      event("Product Launch", "Productlancering"),
      event("Opening", "Opening"),
      event("Conference", "Congres"),
      event("Trade Fair", "Beurs"),
      event("Gala", "Gala"),
      event("Christmas Party", "Kerstborrel"),
      event("New Year's Reception", "Nieuwjaarsreceptie"),
      event("Team Outing", "Teamuitje"),
    ],
  },
  {
    nl: "Publiek",
    en: "Public",
    options: [
      event("Festival", "Festival"),
      event("Club Night", "Clubavond"),
      event("Concert", "Concert"),
      event("Café or Bar", "Café of bar"),
      event("Restaurant", "Restaurant"),
      event("Student Party", "Studentenfeest"),
      event("School Party", "Schoolfeest"),
      event("Street Party", "Straatfeest"),
      event("Sports Event", "Sportevenement"),
      event("Fashion Show", "Modeshow"),
      event("Charity Event", "Benefiet"),
      event("King's Day", "Koningsdag"),
      event("New Year's Eve", "Oud en nieuw"),
      event("Carnival", "Carnaval"),
    ],
  },
]

/** Stored values stay the same; only the labels are translated. */
export const ARTIST_TYPES: { value: string; nl: string; en: string; descNl: string; descEn: string }[] = [
  { value: "DJ", nl: "DJ", en: "DJ", descNl: "Draait muziek met een eigen set", descEn: "Plays music with their own set" },
  { value: "Band", nl: "Band", en: "Band", descNl: "Meerdere muzikanten, live", descEn: "Several musicians, live" },
  { value: "Singer", nl: "Zanger(es)", en: "Singer", descNl: "Zang, solo of met begeleiding", descEn: "Vocals, solo or accompanied" },
  { value: "Saxophonist", nl: "Saxofonist", en: "Saxophonist", descNl: "Live saxofoon, solo of bij een DJ", descEn: "Live saxophone, solo or alongside a DJ" },
  { value: "Pianist", nl: "Pianist", en: "Pianist", descNl: "Piano of keyboard", descEn: "Piano or keyboard" },
  { value: "Guitarist", nl: "Gitarist", en: "Guitarist", descNl: "Akoestisch of elektrisch", descEn: "Acoustic or electric" },
  { value: "Violinist", nl: "Violist", en: "Violinist", descNl: "Viool, solo of ensemble", descEn: "Violin, solo or ensemble" },
]

/** Types for photographers and videographers; the values match the filters on the photo & video page. */
export const PHOTO_VIDEO_TYPES: { value: string; nl: string; en: string; descNl: string; descEn: string }[] = [
  { value: "Photographer", nl: "Fotograaf", en: "Photographer", descNl: "Legt het event vast in foto's", descEn: "Captures the event in photos" },
  { value: "Videographer", nl: "Videograaf", en: "Videographer", descNl: "Filmt het event, bijvoorbeeld een aftermovie", descEn: "Films the event, for example an aftermovie" },
  {
    value: "Photographer & Videographer",
    nl: "Fotograaf & videograaf",
    en: "Photographer & videographer",
    descNl: "Doet zowel foto als video",
    descEn: "Does both photo and video",
  },
]

/** Specialisations of photographers and videographers. They are stored in the same column as music genres. */
export const PHOTO_SPECIALTY_GROUPS: OptionGroup[] = [
  {
    nl: "Foto",
    en: "Photo",
    options: [
      { value: "event-photography", nl: "Eventfotografie", en: "Event photography" },
      { value: "wedding-photography", nl: "Bruidsfotografie", en: "Wedding photography" },
      { value: "portrait", nl: "Portretten", en: "Portraits" },
      { value: "corporate-photography", nl: "Bedrijfsfotografie", en: "Corporate photography" },
      { value: "concert-photography", nl: "Concert- en festivalfotografie", en: "Concert and festival photography" },
      { value: "photobooth", nl: "Photobooth", en: "Photo booth" },
    ],
  },
  {
    nl: "Video",
    en: "Video",
    options: [
      { value: "aftermovie", nl: "Aftermovie", en: "Aftermovie" },
      { value: "wedding-film", nl: "Trouwfilm", en: "Wedding film" },
      { value: "corporate-video", nl: "Bedrijfsvideo", en: "Corporate video" },
      { value: "livestream", nl: "Livestream", en: "Livestream" },
      { value: "social-content", nl: "Social media content", en: "Social media content" },
    ],
  },
  {
    nl: "Extra",
    en: "Extra",
    options: [
      { value: "drone", nl: "Drone-opnames", en: "Drone footage" },
      { value: "same-day-edit", nl: "Same-day edit", en: "Same-day edit" },
    ],
  },
]

/** The signup category of photographers and videographers. */
export const PHOTO_VIDEO_CATEGORY = "photo-video"

export function isPhotoVideo(category: string | null | undefined) {
  return category === PHOTO_VIDEO_CATEGORY
}

export const SOCIAL_PLATFORMS: { value: string; label: string }[] = [
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "twitter", label: "Twitter / X" },
  { value: "tiktok", label: "TikTok" },
  { value: "youtube", label: "YouTube" },
  { value: "spotify", label: "Spotify" },
  { value: "soundcloud", label: "SoundCloud" },
  { value: "bandcamp", label: "Bandcamp" },
  { value: "applemusic", label: "Apple Music" },
  { value: "linkedin", label: "LinkedIn" },
]

/**
 * "Allround" is stored as a marker in the genres list of a DJ, next to their own main genres. It is a setting, not a
 * music genre: it never shows as a genre, and it gives customers the whole genre list when they book.
 */
export const ALLROUND = "allround"

export const isAllround = (genres: string[] | undefined | null) => !!genres?.some((value) => value === ALLROUND)

/** The genres without the Allround marker: the DJ's own main genres. */
export const mainGenres = (genres: string[] | undefined | null) => (genres ?? []).filter((value) => value !== ALLROUND)

export const isDj = (artistType: string | undefined | null) => (artistType ?? "").trim().toLowerCase() === "dj"

/**
 * The genre groups a customer may choose from when booking. A normal DJ offers only their own genres; an Allround DJ,
 * and anyone without genres on record (older profiles), offers the whole list.
 */
export function bookableGenreGroups(offered: string[] | undefined | null, allround: boolean): OptionGroup[] {
  const own = new Set(mainGenres(offered).map(canonicalGenre))
  if (allround || own.size === 0) return GENRE_GROUPS
  return GENRE_GROUPS.map((group) => ({ ...group, options: group.options.filter((option) => own.has(option.value)) })).filter(
    (group) => group.options.length > 0,
  )
}

export function genreLabel(value: string, dutch: boolean) {
  if (value === ALLROUND) return "Allround"
  for (const group of [...GENRE_GROUPS, ...PHOTO_SPECIALTY_GROUPS]) {
    const option = group.options.find((item) => item.value === value)
    if (option) return dutch ? option.nl : option.en
  }
  return value
}

/** Maps a genre as typed or stored elsewhere ("House", "Hip-Hop") to its list value; unknown genres stay as they are. */
export function canonicalGenre(raw: string) {
  const key = tagKey(raw)
  for (const group of GENRE_GROUPS) {
    const option = group.options.find((item) => [item.value, item.nl, item.en].some((name) => tagKey(name) === key))
    if (option) return option.value
  }
  return raw
}

export function eventTypeLabel(value: string, dutch: boolean) {
  for (const group of EVENT_TYPE_GROUPS) {
    const option = group.options.find((item) => item.value === value)
    if (option) return dutch ? option.nl : option.en
  }
  return value
}

// Older profiles stored other names for the same event types.
const EVENT_ALIASES: Record<string, string> = {
  zakelijk: "Corporate Event",
  corporate: "Corporate Event",
  club: "Club Night",
  private: "Private Party",
  birthday: "Birthday",
  wedding: "Wedding",
  festival: "Festival",
}

/** Maps a stored event type (any language, older names included) to its current value; unknown names stay as they are. */
export function canonicalEventType(stored: string) {
  const key = stored.trim().toLowerCase()
  for (const group of EVENT_TYPE_GROUPS) {
    for (const option of group.options) {
      if ([option.value, option.nl, option.en].some((name) => name.toLowerCase() === key)) return option.value
    }
  }
  return EVENT_ALIASES[key] ?? stored
}

const FILLER_WORDS = new Set(["party", "event", "celebration", "night"])

/**
 * Comparable form of a genre or event type, so "Hip-Hop", "hiphop" and "hip hop" match, and
 * "Club Night" matches "club". Generic words like "party" are ignored.
 */
export function tagKey(raw: string) {
  const words = raw
    .toLowerCase()
    .replace(/&/g, "n")
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter(Boolean)
  const meaningful = words.filter((word) => !FILLER_WORDS.has(word))
  return (meaningful.length ? meaningful : words).join("")
}
