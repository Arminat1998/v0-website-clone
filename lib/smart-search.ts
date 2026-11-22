// Smart search utility for semantic matching of artists
export interface Artist {
  id: number
  name: string
  specialty: string
  location: string
  rating: number
  reviews: number
  price: string
  equipmentPrice?: string // Added equipment price field
  available: boolean
  description?: string
  eventTypes?: string[]
  musicStyles?: string[]
  mood?: string[]
  experience?: string
  availableDates?: string[] // Array of available dates in YYYY-MM-DD format
  unavailableDates?: string[] // Array of unavailable dates in YYYY-MM-DD format
  category?: string
  artistTypes?: string[]
  image?: string
  /** Real professionals only: the banner and profile photo of their own page. */
  banner?: string
  avatar?: string
  equipment?: string[]
  /** Real professionals only: the equipment they entered during sign-up. */
  equipmentDetails?: { packageItems: EquipmentDetail[]; extraItems: EquipmentDetail[] }
  /** Real professionals only: an artist or a photographer/videographer; decides the labels on their page. */
  kind?: "artist" | "photo-video"
}

export interface EquipmentDetail {
  name: string
  description: string
  price: string
  image?: string
}

// Added interface for extracted filters
export interface ExtractedFilters {
  artistTypes: string[]
  genres: string[]
  eventTypes: string[]
  date?: string
  mood?: string[]
  location?: string
}

export interface Photographer {
  id: number
  name: string
  specialty: string
  location: string
  rating: number
  reviews: number
  price: string
  available: boolean
  description?: string
  eventTypes?: string[]
  serviceTypes?: string[]
  experience?: string
  availableDates?: string[]
  unavailableDates?: string[]
  category?: string
  image?: string
  /** Real professionals only: the banner and profile photo of their own page. */
  banner?: string
  avatar?: string
  /** Real professionals only: their public profile page. */
  href?: string
  /** Real professionals only: the extras they listed (photographers have no package). */
  equipmentDetails?: Artist["equipmentDetails"]
}

// Synonym mapping for better search understanding
const synonyms: Record<string, string[]> = {
  // Event types
  wedding: ["bruiloft", "huwelijk", "trouwen", "marriage", "romantic"],
  birthday: ["verjaardag", "birthday party", "celebration", "feest"],
  corporate: ["bedrijf", "zakelijk", "business", "professional", "werk"],
  party: ["feest", "celebration", "viering", "gathering"],
  club: ["nachtclub", "nightclub", "dancing", "uitgaan"],
  festival: ["festival", "outdoor", "groot evenement", "main stage"],

  // Music styles
  house: ["house music", "electronic", "dance", "club music"],
  techno: ["techno music", "electronic", "underground", "rave"],
  "hip-hop": ["hiphop", "rap", "urban", "street music"],
  electronic: ["edm", "dance", "synthesizer", "digital"],
  classic: ["klassiek", "oldies", "vintage", "retro"],
  jazz: ["jazz music", "swing", "bebop", "cool"],
  rock: ["rock music", "metal", "alternative", "hard rock"],
  acoustic: ["acoustic music", "folk", "guitar", "vocals"],
  classical: ["classical music", "orchestral", "concert", "opera"],
  ambient: ["ambient music", "chill music", "electronic music", "background music"],
  soul: ["soul music", "r&b", "motown", "soulful"],
  trance: ["trance music", "progressive music", "electronic dance music", "edm"],
  reggaeton: ["reggaeton music", "latin music", "tropical music", "dance music"],
  salsa: ["salsa music", "latin music", "cultural music", "dance music"],
  bachata: ["bachata music", "latin music", "dance music", "romantic music"],
  flamenco: ["flamenco guitar", "spanish guitar", "latin music", "cultural"],
  indie: ["indie music", "alternative music", "underground music", "independent music"],
  alternative: ["alternative music", "indie music", "underground music", "independent music"],
  underground: ["underground music", "alternative music", "indie music", "independent music"],
  experimental: ["experimental music", "alternative music", "indie music", "independent music"],
  family: ["family music", "children's music", "all ages music", "fun music"],
  vintage: ["vintage music", "oldies music", "classic music", "retro music"],
  retro: ["retro music", "vintage music", "oldies music", "classic music"],
  psychedelic: ["psychedelic music", "trance music", "progressive music", "edm"],
  uplifting: ["uplifting music", "trance music", "progressive music", "edm"],
  journey: ["journey music", "trance music", "progressive music", "edm"],
  spiritual: ["spiritual music", "trance music", "progressive music", "edm"],
  tropical: ["tropical music", "latin music", "cultural music", "dance music"],
  spanish: ["spanish music", "flamenco music", "latin music", "cultural music"],
  latin: ["latin music", "flamenco music", "salsa music", "bachata music", "tropical music"],
  cultural: ["cultural music", "latin music", "flamenco music", "salsa music", "bachata music"],
  virtuoso: ["virtuoso music", "classical music", "contemporary music"],
  pop: ["pop music", "current hits", "charts", "top 40"],
  covers: ["cover music", "pop music", "rock music", "classic music"],
  contemporary: ["contemporary music", "classical music", "modern music"],
  ballads: ["ballad music", "pop music", "soul music", "romantic music"],
  clean: ["clean music", "family music", "children's music"],
  powerful: ["powerful music", "rock music", "metal music", "alternative music"],
  raw: ["raw music", "rock music", "metal music", "alternative music"],
  rebellious: ["rebellious music", "rock music", "metal music", "alternative music"],
  chill: ["chill music", "ambient music", "relaxed music", "meditative music"],
  wellness: ["wellness music", "ambient music", "relaxed music", "meditative music"],
  meditation: ["meditation music", "ambient music", "relaxed music", "meditative music"],
  downtime: ["downtime music", "ambient music", "relaxed music", "meditative music"],
}

function getEquipmentForCategory(category: string): string[] {
  const equipmentMap: Record<string, string[]> = {
    DJ: [
      "Pioneer CDJ-3000 (2x)",
      "DJM-900NXS2 Mixer",
      "Professional Headphones",
      "Laptop with DJ Software",
      "Audio Interface",
      "Monitor Speakers",
    ],
    Saxophonist: [
      "Professional Saxophone",
      "Wireless Microphone System",
      "Portable PA System",
      "Music Stand",
      "Sheet Music Collection",
    ],
    Band: [
      "Full PA System",
      "Microphones (Multiple)",
      "Instrument Amplifiers",
      "Drum Kit",
      "Keyboard/Synthesizer",
      "Guitar Amplifiers",
      "Monitor System",
      "Mixing Console",
    ],
    Singer: [
      "Professional Vocal Microphone",
      "Wireless Microphone System",
      "In-Ear Monitors",
      "Portable PA System",
      "Microphone Stand",
    ],
    Pianist: ["Digital Piano/Keyboard", "Piano Bench", "Sustain Pedal", "Keyboard Amplifier", "Music Stand"],
    Guitarist: [
      "Professional Guitar",
      "Guitar Amplifier",
      "Effects Pedals",
      "Wireless System",
      "Guitar Stand",
      "Backup Guitar",
    ],
    Violinist: [
      "Professional Violin",
      "Bow",
      "Pickup/Microphone System",
      "Portable Amplifier",
      "Music Stand",
      "Sheet Music",
    ],
  }

  return equipmentMap[category] || []
}

export function extractFiltersFromQuery(query: string): ExtractedFilters {
  const normalizedQuery = query.toLowerCase().trim()
  const filters: ExtractedFilters = {
    artistTypes: [],
    genres: [],
    eventTypes: [],
    mood: [],
  }

  // Extract artist types
  const artistTypePatterns = [
    { pattern: /\b(dj|deejay|disc jockey)\b/i, type: "DJ" },
    { pattern: /\b(saxophonist|sax player)\b/i, type: "Saxophonist" },
    { pattern: /\b(band|live band|music band)\b/i, type: "Band" },
    { pattern: /\b(singer|vocalist|zanger)\b/i, type: "Singer" },
    { pattern: /\b(pianist|piano player)\b/i, type: "Pianist" },
    { pattern: /\b(guitarist|guitar player)\b/i, type: "Guitarist" },
    { pattern: /\b(violinist|violin player)\b/i, type: "Violinist" },
    { pattern: /\b(live music|live muziek)\b/i, type: "Live Music" },
    // Photographer types
    { pattern: /\b(photographer|photo|photographie)\b/i, type: "Photographer" },
    { pattern: /\b(videographer|video|cinematographer)\b/i, type: "Videographer" },
    { pattern: /\b(photographer & videographer)\b/i, type: "Photographer & Videographer" },
    { pattern: /\b(drone services|aerial photography|aerial videography)\b/i, type: "Drone Services" },
    { pattern: /\b(live streaming|broadcasting)\b/i, type: "Live Streaming" },
  ]

  artistTypePatterns.forEach(({ pattern, type }) => {
    if (pattern.test(normalizedQuery)) {
      filters.artistTypes.push(type)
    }
  })

  // Extract music genres
  const genrePatterns = [
    { pattern: /\b(techno)\b/i, genre: "Techno" },
    { pattern: /\b(house|house music)\b/i, genre: "House" },
    { pattern: /\b(pop|pop music)\b/i, genre: "Pop" },
    { pattern: /\b(hip-hop|hip hop|hiphop|rap)\b/i, genre: "Hip-Hop" },
    { pattern: /\b(electronic|edm)\b/i, genre: "Electronic" },
    { pattern: /\b(jazz)\b/i, genre: "Jazz" },
    { pattern: /\b(rock)\b/i, genre: "Rock" },
    { pattern: /\b(classical|klassiek)\b/i, genre: "Classical" },
    { pattern: /\b(disco)\b/i, genre: "Disco" },
    { pattern: /\b(funk)\b/i, genre: "Funk" },
    { pattern: /\b(ambient)\b/i, genre: "Ambient" },
    { pattern: /\b(r&b|rnb)\b/i, genre: "R&B" },
  ]

  genrePatterns.forEach(({ pattern, genre }) => {
    if (pattern.test(normalizedQuery)) {
      filters.genres.push(genre)
    }
  })

  // Extract event types
  const eventTypePatterns = [
    { pattern: /\b(wedding|bruiloft|trouwen)\b/i, type: "Wedding" },
    { pattern: /\b(birthday|verjaardag|verjaardagsfeest)\b/i, type: "Birthday" },
    { pattern: /\b(corporate|zakelijk|bedrijfsfeest)\b/i, type: "Corporate" },
    { pattern: /\b(club|club night|clubavond)\b/i, type: "Club" },
    { pattern: /\b(festival)\b/i, type: "Festival" },
    { pattern: /\b(private party|privé feest|prive feest)\b/i, type: "Private Party" },
    { pattern: /\b(kids party|kinderfeest)\b/i, type: "Kids Party" },
    { pattern: /\b(anniversary|jubileum)\b/i, type: "Anniversary" },
    { pattern: /\b(cocktail party|borrel)\b/i, type: "Cocktail Party" },
    { pattern: /\b(business event|zakelijk evenement)\b/i, type: "Business Event" },
    // Photographer event types
    { pattern: /\b(wedding photography|wedding photos)\b/i, type: "Wedding" },
    { pattern: /\b(corporate photography|corporate event coverage)\b/i, type: "Corporate Event" },
    { pattern: /\b(portrait session|family photos)\b/i, type: "Portrait Session" },
    { pattern: /\b(concert photography|live music coverage)\b/i, type: "Concert" },
    { pattern: /\b(outdoor event)\b/i, type: "Outdoor Event" },
    { pattern: /\b(product launch)\b/i, type: "Product Launch" },
    { pattern: /\b(conference)\b/i, type: "Conference" },
    { pattern: /\b(music video)\b/i, type: "Music Video" },
    { pattern: /\b(documentary)\b/i, type: "Documentary" },
  ]

  eventTypePatterns.forEach(({ pattern, type }) => {
    if (pattern.test(normalizedQuery)) {
      filters.eventTypes.push(type)
    }
  })

  // Extract mood/atmosphere
  const moodPatterns = [
    { pattern: /\b(energetic|energiek|energieke)\b/i, mood: "energetic" },
    { pattern: /\b(romantic|romantisch|romantische)\b/i, mood: "romantic" },
    { pattern: /\b(chill|relaxed|rustig)\b/i, mood: "chill" },
    { pattern: /\b(party|feest)\b/i, mood: "party" },
    { pattern: /\b(elegant|sophisticated|verfijnd)\b/i, mood: "elegant" },
  ]

  moodPatterns.forEach(({ pattern, mood }) => {
    if (pattern.test(normalizedQuery)) {
      filters.mood?.push(mood)
    }
  })

  // Extract date (simple patterns)
  const datePatterns = [
    /\b(\d{1,2})\s+(januari|februari|maart|april|mei|juni|juli|augustus|september|oktober|november|december)\b/i,
    /\b(januari|februari|maart|april|mei|juni|juli|augustus|september|oktober|november|december)\s+(\d{1,2})\b/i,
    /\b(\d{1,2})[-/](\d{1,2})[-/](\d{4}|\d{2})\b/,
  ]

  datePatterns.forEach((pattern) => {
    const match = normalizedQuery.match(pattern)
    if (match) {
      filters.date = match[0]
    }
  })

  // Extract location/city
  const locationPatterns = [
    /\b(amsterdam)\b/i,
    /\b(rotterdam)\b/i,
    /\b(den haag|the hague)\b/i,
    /\b(utrecht)\b/i,
    /\b(eindhoven)\b/i,
    /\b(groningen)\b/i,
    /\b(tilburg)\b/i,
    /\b(almere)\b/i,
    /\b(breda)\b/i,
    /\b(maastricht)\b/i,
    /\b(nijmegen)\b/i,
    /\b(apeldoorn)\b/i,
    /\b(enschede)\b/i,
    /\b(zwolle)\b/i,
    /\b(amersfoort)\b/i,
    /\b(dordrecht)\b/i,
    /\b(leeuwarden)\b/i,
    /\b(venlo)\b/i,
    /\b(haarlem)\b/i,
    /\b(leiden)\b/i,
    // Add more locations as needed
  ]

  locationPatterns.forEach((pattern) => {
    const match = normalizedQuery.match(pattern)
    if (match) {
      filters.location = match[0]
    }
  })

  return filters
}

// Enhanced artist data with semantic information
export const enhancedArtists: Artist[] = [
  {
    id: 1,
    name: "DJ Marco",
    specialty: "House & Techno",
    location: "Amsterdam",
    rating: 4.9,
    reviews: 127,
    price: "€150",
    equipmentPrice: "€850",
    available: true,
    category: "DJ",
    image: "/artists/dj-marco.jpg",
    equipment: getEquipmentForCategory("DJ"),
    description:
      "Energetic house and techno specialist perfect for club nights and dance parties. Known for seamless mixing and reading the crowd.",
    eventTypes: ["club", "dance party", "festival", "corporate party"],
    musicStyles: ["house", "techno", "electronic", "dance", "edm"],
    mood: ["energetic", "upbeat", "party", "dancing"],
    experience: "10+ years of club and festival experience",
    availableDates: [
      "2024-12-25",
      "2024-12-31",
      "2025-01-15",
      "2025-02-14",
      "2025-03-20",
      "2025-12-01",
      "2025-12-05",
      "2025-12-10",
      "2025-12-15",
      "2025-12-20",
      "2025-12-25",
      "2025-12-26",
      "2025-12-27",
      "2025-12-28",
      "2025-12-29",
      "2025-12-30",
    ],
    unavailableDates: ["2024-12-24", "2025-01-01", "2025-12-21", "2025-12-31"],
  },
  {
    id: 2,
    name: "Lisa Beats",
    specialty: "Pop & Dance",
    location: "Rotterdam",
    rating: 4.8,
    reviews: 89,
    price: "€90",
    equipmentPrice: "€500",
    available: true,
    category: "DJ",
    image: "/artists/dj-lisa.jpg",
    equipment: getEquipmentForCategory("DJ"),
    description:
      "Pop and dance music expert who creates the perfect atmosphere for any celebration. Great for birthdays and social events.",
    eventTypes: ["birthday", "celebration", "social event", "party"],
    musicStyles: ["pop", "dance", "top 40", "charts", "mainstream"],
    mood: ["fun", "celebratory", "upbeat", "social"],
    experience: "8 years specializing in pop and dance events",
    availableDates: [
      "2024-12-25",
      "2024-12-26",
      "2025-01-10",
      "2025-02-20",
      "2025-04-15",
      "2025-12-02",
      "2025-12-06",
      "2025-12-11",
      "2025-12-16",
      "2025-12-22",
      "2025-12-23",
      "2025-12-24",
      "2025-12-28",
    ],
    unavailableDates: ["2024-12-31", "2025-01-01", "2025-12-21", "2025-12-31", "2025-12-25"],
  },
  {
    id: 3,
    name: "DJ Remy",
    specialty: "Hip-Hop & R&B",
    location: "Utrecht",
    rating: 4.7,
    reviews: 156,
    price: "€120",
    equipmentPrice: "€650",
    available: false,
    category: "DJ",
    image: "/artists/dj-remy.jpg",
    equipment: getEquipmentForCategory("DJ"),
    description:
      "Hip-hop and R&B master with deep knowledge of urban music culture. Perfect for urban events and young crowds.",
    eventTypes: ["urban party", "youth event", "club", "social gathering"],
    musicStyles: ["hip-hop", "r&b", "rap", "urban", "soul"],
    mood: ["cool", "urban", "rhythmic", "groovy"],
    experience: "12 years in hip-hop and urban music scene",
    availableDates: [
      "2025-02-01",
      "2025-03-15",
      "2025-04-20",
      "2025-12-03",
      "2025-12-07",
      "2025-12-12",
      "2025-12-17",
      "2025-12-26",
      "2025-12-27",
    ],
    unavailableDates: [
      "2024-12-25",
      "2024-12-31",
      "2025-01-01",
      "2025-01-15",
      "2025-12-21",
      "2025-12-31",
      "2025-12-24",
      "2025-12-25",
    ],
  },
  {
    id: 4,
    name: "Sarah Sound",
    specialty: "Electronic & EDM",
    location: "Den Haag",
    rating: 4.9,
    reviews: 203,
    price: "€150",
    equipmentPrice: "€1000",
    available: true,
    category: "DJ",
    image: "/artists/dj-sarah.jpg",
    equipment: getEquipmentForCategory("DJ"),
    description:
      "Electronic music virtuoso specializing in EDM and festival sounds. Creates unforgettable experiences with cutting-edge tracks.",
    eventTypes: ["festival", "rave", "electronic party", "club"],
    musicStyles: ["edm", "electronic", "dubstep", "trance", "progressive"],
    mood: ["intense", "energetic", "euphoric", "festival"],
    experience: "15+ years in electronic music and festival circuit",
    availableDates: [
      "2024-12-25",
      "2024-12-30",
      "2025-01-05",
      "2025-02-14",
      "2025-03-25",
      "2025-12-04",
      "2025-12-08",
      "2025-12-13",
      "2025-12-18",
      "2025-12-22",
      "2025-12-23",
      "2025-12-29",
      "2025-12-30",
    ],
    unavailableDates: ["2024-12-31", "2025-12-21", "2025-12-31", "2025-12-24", "2025-12-25"],
  },
  {
    id: 5,
    name: "DJ Kevin",
    specialty: "Classic Hits",
    location: "Eindhoven",
    rating: 4.6,
    reviews: 74,
    price: "€70",
    equipmentPrice: "€400",
    available: true,
    category: "DJ",
    image: "/artists/dj-kevin.jpg",
    equipment: getEquipmentForCategory("DJ"),
    description:
      "Classic hits specialist perfect for nostalgic events and mature audiences. Plays timeless favorites that everyone knows.",
    eventTypes: ["reunion", "mature party", "nostalgic event", "anniversary"],
    musicStyles: ["classics", "oldies", "80s", "90s", "retro"],
    mood: ["nostalgic", "familiar", "sing-along", "timeless"],
    experience: "20+ years playing classic hits and golden oldies",
    availableDates: [
      "2024-12-25",
      "2024-12-26",
      "2025-01-12",
      "2025-02-28",
      "2025-03-30",
      "2025-12-05",
      "2025-12-09",
      "2025-12-14",
      "2025-12-19",
      "2025-12-27",
      "2025-12-28",
      "2025-12-29",
      "2025-12-30",
    ],
    unavailableDates: ["2024-12-24", "2024-12-31", "2025-12-21", "2025-12-31", "2025-12-25", "2025-12-26"],
  },
  {
    id: 6,
    name: "Nina Vibes",
    specialty: "Deep House",
    location: "Groningen",
    rating: 4.8,
    reviews: 112,
    price: "€130",
    equipmentPrice: "€700",
    available: true,
    category: "DJ",
    image: "/artists/dj-nina.jpg",
    equipment: getEquipmentForCategory("DJ"),
    description:
      "Deep house connoisseur creating sophisticated soundscapes for upscale events. Perfect for lounge settings and elegant parties.",
    eventTypes: ["lounge", "upscale party", "sophisticated event", "cocktail party"],
    musicStyles: ["deep house", "lounge", "sophisticated", "ambient"],
    mood: ["sophisticated", "elegant", "smooth", "atmospheric"],
    experience: "9 years in deep house and lounge music",
    availableDates: [
      "2024-12-25",
      "2025-01-08",
      "2025-02-12",
      "2025-03-18",
      "2025-12-06",
      "2025-12-10",
      "2025-12-15",
      "2025-12-20",
      "2025-12-28",
      "2025-12-29",
      "2025-12-30",
    ],
    unavailableDates: ["2024-12-31", "2025-01-01", "2025-12-21", "2025-12-31", "2025-12-24", "2025-12-25"],
  },
  {
    id: 7,
    name: "DJ Tom",
    specialty: "Wedding Mix",
    location: "Tilburg",
    rating: 4.9,
    reviews: 245,
    price: "€150",
    equipmentPrice: "€950",
    available: true,
    category: "DJ",
    image: "/artists/dj-tom.jpg",
    equipment: getEquipmentForCategory("DJ"),
    description:
      "Wedding specialist with extensive experience in creating magical moments. Expertly handles all ages and musical preferences.",
    eventTypes: ["wedding", "anniversary", "romantic event", "family celebration"],
    musicStyles: ["wedding mix", "romantic", "all genres", "family-friendly"],
    mood: ["romantic", "celebratory", "emotional", "magical"],
    experience: "18+ years specializing in weddings and romantic events",
    availableDates: [
      "2024-12-25",
      "2024-12-28",
      "2025-01-18",
      "2025-02-14",
      "2025-03-22",
      "2025-12-01",
      "2025-12-05",
      "2025-12-10",
      "2025-12-15",
      "2025-12-20",
      "2025-12-25",
      "2025-12-26",
      "2025-12-27",
      "2025-12-28",
      "2025-12-29",
      "2025-12-30",
    ],
    unavailableDates: ["2024-12-31", "2025-01-01", "2025-12-21", "2025-12-31"],
  },
  {
    id: 8,
    name: "Emma Electro",
    specialty: "Trance & Progressive",
    location: "Breda",
    rating: 4.7,
    reviews: 98,
    price: "€110",
    equipmentPrice: "€600",
    available: false,
    category: "DJ",
    image: "/artists/dj-emma.jpg",
    equipment: getEquipmentForCategory("DJ"),
    description:
      "Trance and progressive house expert creating transcendent musical journeys. Perfect for electronic music enthusiasts.",
    eventTypes: ["trance party", "electronic event", "progressive night", "club"],
    musicStyles: ["trance", "progressive", "uplifting", "psychedelic"],
    mood: ["transcendent", "uplifting", "journey", "spiritual"],
    experience: "11 years in trance and progressive scene",
    availableDates: [
      "2025-02-05",
      "2025-03-10",
      "2025-04-25",
      "2025-12-02",
      "2025-12-06",
      "2025-12-11",
      "2025-12-16",
      "2025-12-22",
      "2025-12-23",
      "2025-12-24",
      "2025-12-28",
    ],
    unavailableDates: [
      "2024-12-25",
      "2024-12-31",
      "2025-01-01",
      "2025-01-20",
      "2025-12-21",
      "2025-12-31",
      "2025-12-24",
      "2025-12-25",
    ],
  },
  {
    id: 9,
    name: "DJ Alex",
    specialty: "Latin & Reggaeton",
    location: "Maastricht",
    rating: 4.8,
    reviews: 134,
    price: "€100",
    equipmentPrice: "€550",
    available: true,
    category: "DJ",
    image: "/artists/dj-alex.jpg",
    equipment: getEquipmentForCategory("DJ"),
    description:
      "Latin music specialist bringing tropical vibes and infectious rhythms. Perfect for summer parties and cultural celebrations.",
    eventTypes: ["latin party", "summer event", "cultural celebration", "tropical party"],
    musicStyles: ["latin", "reggaeton", "salsa", "bachata", "tropical"],
    mood: ["tropical", "spicy", "rhythmic", "cultural"],
    experience: "13 years in Latin and Caribbean music",
    availableDates: [
      "2024-12-25",
      "2024-12-29",
      "2025-01-25",
      "2025-02-18",
      "2025-03-28",
      "2025-12-03",
      "2025-12-07",
      "2025-12-12",
      "2025-12-17",
      "2025-12-26",
      "2025-12-27",
    ],
    unavailableDates: ["2024-12-31", "2025-12-21", "2025-12-31", "2025-12-24", "2025-12-25"],
  },
  {
    id: 10,
    name: "Zoe Beats",
    specialty: "Top 40 & Charts",
    location: "Arnhem",
    rating: 4.6,
    reviews: 67,
    price: "€80",
    equipmentPrice: "€450",
    available: true,
    category: "DJ",
    image: "/artists/dj-zoe.jpg",
    equipment: getEquipmentForCategory("DJ"),
    description:
      "Current hits specialist always up-to-date with the latest chart toppers. Perfect for young crowds and trendy events.",
    eventTypes: ["youth party", "trendy event", "social media event", "modern celebration"],
    musicStyles: ["top 40", "charts", "current hits", "trending"],
    mood: ["trendy", "current", "youthful", "social"],
    experience: "6 years following current music trends",
    availableDates: [
      "2024-12-25",
      "2024-12-27",
      "2025-01-14",
      "2025-02-22",
      "2025-04-05",
      "2025-12-04",
      "2025-12-08",
      "2025-12-13",
      "2025-12-18",
      "2025-12-22",
      "2025-12-23",
      "2025-12-29",
      "2025-12-30",
    ],
    unavailableDates: ["2024-12-31", "2025-01-01", "2025-12-21", "2025-12-31", "2025-12-24", "2025-12-25"],
  },
  {
    id: 11,
    name: "DJ Mike",
    specialty: "Oldies & Classics",
    location: "Haarlem",
    rating: 4.9,
    reviews: 189,
    price: "€120",
    equipmentPrice: "€600",
    available: true,
    category: "DJ",
    image: "/artists/dj-mike.jpg",
    equipment: getEquipmentForCategory("DJ"),
    description:
      "Vintage music expert with vast collection of golden era classics. Creates nostalgic atmospheres for mature audiences.",
    eventTypes: ["vintage party", "senior event", "nostalgic celebration", "classic night"],
    musicStyles: ["oldies", "vintage", "golden era", "classic rock", "motown"],
    mood: ["nostalgic", "vintage", "classic", "memorable"],
    experience: "25+ years preserving classic music heritage",
    availableDates: [
      "2024-12-25",
      "2024-12-26",
      "2025-01-16",
      "2025-02-26",
      "2025-03-26",
      "2025-12-05",
      "2025-12-09",
      "2025-12-14",
      "2025-12-19",
      "2025-12-27",
      "2025-12-28",
      "2025-12-29",
      "2025-12-30",
    ],
    unavailableDates: ["2024-12-31", "2025-01-01", "2025-12-21", "2025-12-31", "2025-12-25", "2025-12-26"],
  },
  {
    id: 12,
    name: "Luna Mix",
    specialty: "Indie & Alternative",
    location: "Leiden",
    rating: 4.7,
    reviews: 91,
    price: "€85",
    equipmentPrice: "€475",
    available: false,
    category: "DJ",
    image: "/artists/dj-luna.jpg",
    equipment: getEquipmentForCategory("DJ"),
    description:
      "Indie and alternative music curator for unique and artistic events. Perfect for creative crowds and unconventional celebrations.",
    eventTypes: ["indie event", "artistic gathering", "creative party", "alternative celebration"],
    musicStyles: ["indie", "alternative", "underground", "experimental"],
    mood: ["artistic", "unique", "creative", "unconventional"],
    experience: "8 years in indie and alternative music scene",
    availableDates: [
      "2025-02-08",
      "2025-03-12",
      "2025-04-18",
      "2025-12-02",
      "2025-12-06",
      "2025-12-11",
      "2025-12-16",
      "2025-12-22",
      "2025-12-23",
      "2025-12-24",
      "2025-12-28",
    ],
    unavailableDates: [
      "2024-12-25",
      "2024-12-31",
      "2025-01-01",
      "2025-01-22",
      "2025-12-21",
      "2025-12-31",
      "2025-12-25",
    ],
  },
  {
    id: 13,
    name: "DJ Rick",
    specialty: "Corporate Events",
    location: "Almere",
    rating: 4.8,
    reviews: 156,
    price: "€140",
    equipmentPrice: "€800",
    available: true,
    category: "DJ",
    image: "/artists/dj-rick.jpg",
    equipment: getEquipmentForCategory("DJ"),
    description:
      "Corporate event specialist providing professional entertainment for business functions. Understands corporate atmosphere and networking needs.",
    eventTypes: ["corporate", "business event", "networking", "professional gathering"],
    musicStyles: ["background music", "professional", "ambient", "sophisticated"],
    mood: ["professional", "networking", "sophisticated", "business"],
    experience: "14 years in corporate entertainment industry",
    availableDates: [
      "2024-12-25",
      "2025-01-09",
      "2025-02-15",
      "2025-03-19",
      "2025-12-03",
      "2025-12-07",
      "2025-12-12",
      "2025-12-17",
      "2025-12-26",
      "2025-12-27",
    ],
    unavailableDates: ["2024-12-31", "2025-01-01", "2025-12-21", "2025-12-31", "2025-12-24", "2025-12-25"],
  },
  {
    id: 14,
    name: "Maya Music",
    specialty: "Festival Hits",
    location: "Nijmegen",
    rating: 4.9,
    reviews: 278,
    price: "€150",
    equipmentPrice: "€1000",
    available: true,
    category: "DJ",
    image: "/artists/dj-maya.jpg",
    equipment: getEquipmentForCategory("DJ"),
    description:
      "Festival headliner with massive crowd experience. Brings main stage energy to any event with festival-quality production.",
    eventTypes: ["festival", "large event", "outdoor party", "main stage"],
    musicStyles: ["festival hits", "main stage", "crowd pleasers", "anthems"],
    mood: ["massive", "festival", "crowd-pleasing", "epic"],
    experience: "16+ years headlining major festivals",
    availableDates: [
      "2024-12-25",
      "2024-12-30",
      "2025-01-20",
      "2025-02-25",
      "2025-03-30",
      "2025-12-04",
      "2025-12-08",
      "2025-12-13",
      "2025-12-18",
      "2025-12-22",
      "2025-12-23",
      "2025-12-29",
      "2025-12-30",
    ],
    unavailableDates: ["2024-12-31", "2025-12-21", "2025-12-31", "2025-12-24", "2025-12-25"],
  },
  {
    id: 15,
    name: "DJ Sam",
    specialty: "Kids & Family",
    location: "Apeldoorn",
    rating: 4.6,
    reviews: 45,
    price: "€50",
    equipmentPrice: "€300",
    available: true,
    category: "DJ",
    image: "/artists/dj-sam.jpg",
    equipment: getEquipmentForCategory("DJ"),
    description:
      "Family-friendly entertainment specialist creating fun for all ages. Expert in children's parties and family celebrations.",
    eventTypes: ["kids party", "family event", "children celebration", "all ages"],
    musicStyles: ["family-friendly", "kids music", "clean versions", "all ages"],
    mood: ["family-friendly", "fun", "safe", "inclusive"],
    experience: "7 years specializing in family entertainment",
    availableDates: [
      "2024-12-25",
      "2024-12-26",
      "2025-01-11",
      "2025-02-16",
      "2025-03-23",
      "2025-12-05",
      "2025-12-09",
      "2025-12-14",
      "2025-12-19",
      "2025-12-27",
      "2025-12-28",
      "2025-12-29",
      "2025-12-30",
    ],
    unavailableDates: ["2024-12-31", "2025-01-01", "2025-12-21", "2025-12-31", "2025-12-25", "2025-12-26"],
  },
  {
    id: 16,
    name: "Vera Vinyl",
    specialty: "Disco & Funk",
    location: "Enschede",
    rating: 4.8,
    reviews: 123,
    price: "€130",
    equipmentPrice: "€750",
    available: true,
    category: "DJ",
    image: "/artists/dj-vera.jpg",
    equipment: getEquipmentForCategory("DJ"),
    description:
      "Disco and funk revivalist bringing groovy vibes and dance floor magic. Perfect for retro-themed events and dance parties.",
    eventTypes: ["disco party", "retro event", "dance celebration", "groovy night"],
    musicStyles: ["disco", "funk", "soul", "groovy", "retro dance"],
    mood: ["groovy", "funky", "retro", "dance"],
    experience: "10 years reviving disco and funk culture",
    availableDates: [
      "2024-12-25",
      "2024-12-28",
      "2025-01-17",
      "2025-02-21",
      "2025-03-27",
      "2025-12-01",
      "2025-12-05",
      "2025-12-10",
      "2025-12-15",
      "2025-12-20",
      "2025-12-25",
      "2025-12-26",
      "2025-12-27",
      "2025-12-28",
      "2025-12-29",
      "2025-12-30",
    ],
    unavailableDates: ["2024-12-31", "2025-01-01", "2025-12-21", "2025-12-31"],
  },
  {
    id: 17,
    name: "DJ Paul",
    specialty: "Jazz & Lounge",
    location: "Zwolle",
    rating: 4.7,
    reviews: 87,
    price: "€135",
    equipmentPrice: "€775",
    available: false,
    category: "DJ",
    image: "/artists/dj-paul.jpg",
    equipment: getEquipmentForCategory("DJ"),
    description:
      "Jazz and lounge specialist creating sophisticated ambiances for upscale venues. Perfect for cocktail hours and elegant gatherings.",
    eventTypes: ["cocktail party", "jazz night", "elegant event", "sophisticated gathering"],
    musicStyles: ["jazz", "lounge", "smooth", "sophisticated", "ambient"],
    mood: ["sophisticated", "smooth", "elegant", "refined"],
    experience: "15 years in jazz and lounge music",
    availableDates: [
      "2025-02-10",
      "2025-03-15",
      "2025-04-22",
      "2025-12-02",
      "2025-12-06",
      "2025-12-11",
      "2025-12-16",
      "2025-12-22",
      "2025-12-23",
      "2025-12-24",
      "2025-12-28",
    ],
    unavailableDates: [
      "2024-12-25",
      "2024-12-31",
      "2025-01-01",
      "2025-01-25",
      "2025-12-21",
      "2025-12-31",
      "2025-12-25",
    ],
  },
  {
    id: 18,
    name: "Chloe Beats",
    specialty: "Techno & Minimal",
    location: "Amersfoort",
    rating: 4.9,
    reviews: 167,
    price: "€145",
    equipmentPrice: "€900",
    available: true,
    category: "DJ",
    image: "/artists/dj-chloe.jpg",
    equipment: getEquipmentForCategory("DJ"),
    description:
      "Techno and minimal specialist with underground credentials. Creates dark, hypnotic atmospheres for dedicated electronic music fans.",
    eventTypes: ["techno party", "underground event", "rave", "minimal night"],
    musicStyles: ["techno", "minimal", "underground", "dark", "hypnotic"],
    mood: ["dark", "hypnotic", "underground", "intense"],
    experience: "13 years in underground techno scene",
    availableDates: [
      "2024-12-25",
      "2024-12-29",
      "2025-01-19",
      "2025-02-24",
      "2025-03-29",
      "2025-12-01",
      "2025-12-05",
      "2025-12-10",
      "2025-12-15",
      "2025-12-20",
      "2025-12-25",
      "2025-12-26",
      "2025-12-27",
      "2025-12-28",
      "2025-12-29",
      "2025-12-30",
    ],
    unavailableDates: ["2024-12-31", "2025-01-01", "2025-12-21", "2025-12-31"],
  },
  {
    id: 19,
    name: "DJ Lars",
    specialty: "Rock & Metal",
    location: "Dordrecht",
    rating: 4.6,
    reviews: 78,
    price: "€95",
    equipmentPrice: "€500",
    available: true,
    category: "DJ",
    image: "/artists/dj-lars.jpg",
    equipment: getEquipmentForCategory("DJ"),
    description:
      "Rock and metal specialist for alternative crowds and headbanging events. Brings raw energy and powerful sound.",
    eventTypes: ["rock party", "metal night", "alternative event", "headbanging celebration"],
    musicStyles: ["rock", "metal", "alternative rock", "hard rock"],
    mood: ["powerful", "raw", "energetic", "rebellious"],
    experience: "11 years in rock and metal scene",
    availableDates: [
      "2024-12-25",
      "2024-12-27",
      "2025-01-13",
      "2025-02-17",
      "2025-03-24",
      "2025-12-04",
      "2025-12-08",
      "2025-12-13",
      "2025-12-18",
      "2025-12-22",
      "2025-12-23",
      "2025-12-29",
      "2025-12-30",
    ],
    unavailableDates: ["2024-12-31", "2025-01-01", "2025-12-21", "2025-12-31", "2025-12-24", "2025-12-25"],
  },
  {
    id: 20,
    name: "Iris Sound",
    specialty: "Ambient & Chill",
    location: "Leeuwarden",
    rating: 4.8,
    reviews: 102,
    price: "€85",
    equipmentPrice: "€450",
    available: true,
    category: "DJ",
    image: "/artists/dj-iris.jpg",
    equipment: getEquipmentForCategory("DJ"),
    description:
      "Ambient and chill music curator for relaxed and meditative events. Creates peaceful soundscapes for wellness and mindful gatherings.",
    eventTypes: ["wellness event", "meditation", "chill gathering", "relaxed party"],
    musicStyles: ["ambient", "chill", "downtempo", "meditative"],
    mood: ["relaxed", "peaceful", "meditative", "chill"],
    experience: "9 years in ambient and wellness music",
    availableDates: [
      "2024-12-25",
      "2024-12-26",
      "2025-01-21",
      "2025-02-19",
      "2025-03-31",
      "2025-12-05",
      "2025-12-09",
      "2025-12-14",
      "2025-12-19",
      "2025-12-27",
      "2025-12-28",
      "2025-12-29",
      "2025-12-30",
    ],
    unavailableDates: ["2024-12-31", "2025-01-01", "2025-12-21", "2025-12-31", "2025-12-25", "2025-12-26"],
  },
  {
    id: 21,
    name: "DJ Max",
    specialty: "Party Mix",
    location: "Venlo",
    rating: 4.7,
    reviews: 145,
    price: "€110",
    equipmentPrice: "€550",
    available: true,
    category: "DJ",
    image: "/artists/dj-max.jpg",
    equipment: getEquipmentForCategory("DJ"),
    description:
      "All-around party specialist mixing various genres to keep everyone dancing. Adaptable to any crowd and event type.",
    eventTypes: ["general party", "mixed crowd", "celebration", "versatile event"],
    musicStyles: ["party mix", "various genres", "crowd pleasers", "adaptable"],
    mood: ["versatile", "party", "adaptable", "crowd-pleasing"],
    experience: "13 years adapting to various party needs",
    availableDates: [
      "2024-12-25",
      "2024-12-28",
      "2025-01-24",
      "2025-02-27",
      "2025-04-01",
      "2025-12-01",
      "2025-12-05",
      "2025-12-10",
      "2025-12-15",
      "2025-12-20",
      "2025-12-25",
      "2025-12-26",
      "2025-12-27",
      "2025-12-28",
      "2025-12-29",
      "2025-12-30",
    ],
    unavailableDates: ["2024-12-31", "2025-01-01", "2025-12-21", "2025-12-31"],
  },
  {
    id: 22,
    name: "Sophie Sax",
    specialty: "Jazz & Soul Saxophone",
    location: "Amsterdam",
    rating: 4.9,
    reviews: 156,
    price: "€140",
    equipmentPrice: "€750",
    available: true,
    category: "Saxophonist",
    image: "/artists/sophie-sax.png",
    equipment: getEquipmentForCategory("Saxophonist"),
    description:
      "Smooth jazz and soul saxophonist bringing elegance to any event. Perfect for cocktail hours, dinners, and sophisticated gatherings.",
    eventTypes: ["cocktail party", "dinner", "wedding", "corporate event", "lounge"],
    musicStyles: ["jazz", "soul", "smooth jazz", "contemporary", "blues"],
    mood: ["elegant", "sophisticated", "smooth", "romantic"],
    experience: "15+ years performing at high-end venues",
    availableDates: [
      "2024-12-25",
      "2024-12-28",
      "2025-01-15",
      "2025-02-14",
      "2025-03-20",
      "2025-12-01",
      "2025-12-05",
      "2025-12-10",
      "2025-12-15",
      "2025-12-20",
      "2025-12-25",
      "2025-12-26",
      "2025-12-27",
      "2025-12-28",
      "2025-12-29",
      "2025-12-30",
    ],
    unavailableDates: ["2024-12-31", "2025-01-01", "2025-12-21", "2025-12-31"],
  },
  {
    id: 23,
    name: "Marcus Melody",
    specialty: "Pop & Dance Saxophone",
    location: "Rotterdam",
    rating: 4.8,
    reviews: 134,
    price: "€130",
    equipmentPrice: "€700",
    available: true,
    category: "Saxophonist",
    image: "/artists/marcus-sax.jpg",
    equipment: getEquipmentForCategory("Saxophonist"),
    description:
      "Energetic pop and dance saxophonist who brings live energy to DJ sets. Creates unforgettable party atmospheres with live sax performances.",
    eventTypes: ["party", "club", "festival", "dance event", "celebration"],
    musicStyles: ["pop", "dance", "house", "electronic", "party"],
    mood: ["energetic", "party", "upbeat", "exciting"],
    experience: "10 years combining live sax with electronic music",
    availableDates: [
      "2024-12-25",
      "2024-12-30",
      "2025-01-18",
      "2025-02-20",
      "2025-03-25",
      "2025-12-02",
      "2025-12-06",
      "2025-12-11",
      "2025-12-16",
      "2025-12-22",
      "2025-12-23",
      "2025-12-24",
      "2025-12-28",
    ],
    unavailableDates: ["2024-12-31", "2025-12-21", "2025-12-31", "2025-12-25"],
  },
  {
    id: 24,
    name: "The Groove Collective",
    specialty: "Funk & Soul Band",
    location: "Utrecht",
    rating: 4.9,
    reviews: 203,
    price: "€150",
    equipmentPrice: "€950",
    available: true,
    category: "Band",
    image: "/artists/groove-collective.jpg",
    equipment: getEquipmentForCategory("Band"),
    description:
      "5-piece funk and soul band delivering authentic grooves and dance floor magic. Perfect for parties, weddings, and corporate events.",
    eventTypes: ["wedding", "corporate event", "party", "festival", "celebration"],
    musicStyles: ["funk", "soul", "r&b", "disco", "groovy"],
    mood: ["groovy", "energetic", "fun", "dance"],
    experience: "12+ years as a professional band",
    availableDates: [
      "2024-12-25",
      "2025-01-10",
      "2025-02-14",
      "2025-03-15",
      "2025-12-03",
      "2025-12-07",
      "2025-12-12",
      "2025-12-17",
      "2025-12-26",
      "2025-12-27",
    ],
    unavailableDates: ["2024-12-31", "2025-01-01", "2025-12-21", "2025-12-31", "2025-12-24", "2025-12-25"],
  },
  {
    id: 25,
    name: "Electric Dreams",
    specialty: "Rock & Pop Band",
    location: "Den Haag",
    rating: 4.8,
    reviews: 178,
    price: "€150",
    equipmentPrice: "€1000",
    available: true,
    category: "Band",
    image: "/artists/electric-dreams.jpg",
    equipment: getEquipmentForCategory("Band"),
    description:
      "High-energy rock and pop cover band playing all the hits. 6-piece band with powerful vocals and tight musicianship.",
    eventTypes: ["party", "corporate event", "festival", "celebration", "wedding"],
    musicStyles: ["rock", "pop", "classic rock", "modern hits", "covers"],
    mood: ["energetic", "powerful", "crowd-pleasing", "fun"],
    experience: "18 years performing at major events",
    availableDates: [
      "2024-12-25",
      "2024-12-28",
      "2025-01-20",
      "2025-02-22",
      "2025-03-28",
      "2025-12-04",
      "2025-12-08",
      "2025-12-13",
      "2025-12-18",
      "2025-12-22",
      "2025-12-23",
      "2025-12-29",
      "2025-12-30",
    ],
    unavailableDates: ["2024-12-31", "2025-12-21", "2025-12-31", "2025-12-24", "2025-12-25"],
  },
  {
    id: 26,
    name: "Jazz Quartet Amsterdam",
    specialty: "Classic Jazz Ensemble",
    location: "Amsterdam",
    rating: 4.9,
    reviews: 245,
    price: "€150",
    equipmentPrice: "€900",
    available: false,
    category: "Band",
    image: "/artists/jazz-quartet.jpg",
    equipment: getEquipmentForCategory("Band"),
    description:
      "Sophisticated jazz quartet featuring piano, bass, drums, and saxophone. Perfect for elegant dinners, cocktail parties, and upscale events.",
    eventTypes: ["cocktail party", "dinner", "corporate event", "elegant gathering", "wedding"],
    musicStyles: ["jazz", "swing", "bebop", "standards", "sophisticated"],
    mood: ["sophisticated", "elegant", "classy", "refined"],
    experience: "20+ years of professional jazz performance",
    availableDates: [
      "2025-02-05",
      "2025-03-10",
      "2025-04-15",
      "2025-12-01",
      "2025-12-05",
      "2025-12-10",
      "2025-12-15",
      "2025-12-20",
      "2025-12-25",
      "2025-12-26",
      "2025-12-27",
      "2025-12-28",
      "2025-12-29",
      "2025-12-30",
    ],
    unavailableDates: ["2024-12-25", "2024-12-31", "2025-01-01", "2025-01-15", "2025-12-21", "2025-12-31"],
  },
  {
    id: 27,
    name: "Emma Rose",
    specialty: "Pop & Soul Singer",
    location: "Eindhoven",
    rating: 4.8,
    reviews: 167,
    price: "€120",
    equipmentPrice: "€600",
    available: true,
    category: "Singer",
    image: "/artists/emma-rose.jpg",
    equipment: getEquipmentForCategory("Singer"),
    description:
      "Powerful pop and soul vocalist with stunning range and emotional delivery. Perfect for weddings, corporate events, and special occasions.",
    eventTypes: ["wedding", "corporate event", "party", "celebration", "dinner"],
    musicStyles: ["pop", "soul", "r&b", "ballads", "contemporary"],
    mood: ["emotional", "powerful", "romantic", "uplifting"],
    experience: "14 years as professional vocalist",
    availableDates: [
      "2024-12-25",
      "2024-12-29",
      "2025-01-16",
      "2025-02-14",
      "2025-03-22",
      "2025-12-01",
      "2025-12-05",
      "2025-12-10",
      "2025-12-15",
      "2025-12-20",
      "2025-12-25",
      "2025-12-26",
      "2025-12-27",
      "2025-12-28",
      "2025-12-29",
      "2025-12-30",
    ],
    unavailableDates: ["2024-12-31", "2025-01-01", "2025-12-21", "2025-12-31"],
  },
  {
    id: 28,
    name: "Lucas Acoustic",
    specialty: "Acoustic Singer-Songwriter",
    location: "Groningen",
    rating: 4.7,
    reviews: 123,
    price: "€75",
    equipmentPrice: "€400",
    available: true,
    category: "Singer",
    image: "/artists/lucas-acoustic.jpg",
    equipment: getEquipmentForCategory("Singer"),
    description:
      "Intimate acoustic performances with guitar and vocals. Creates warm, personal atmospheres for smaller gatherings and ceremonies.",
    eventTypes: ["wedding ceremony", "intimate gathering", "dinner", "acoustic night", "cafe"],
    musicStyles: ["acoustic", "folk", "singer-songwriter", "indie", "intimate"],
    mood: ["intimate", "warm", "personal", "emotional"],
    experience: "9 years performing acoustic sets",
    availableDates: [
      "2024-12-25",
      "2024-12-26",
      "2025-01-12",
      "2025-02-18",
      "2025-03-24",
      "2025-12-05",
      "2025-12-09",
      "2025-12-14",
      "2025-12-19",
      "2025-12-27",
      "2025-12-28",
      "2025-12-29",
      "2025-12-30",
    ],
    unavailableDates: ["2024-12-31", "2025-01-01", "2025-12-21", "2025-12-31", "2025-12-25", "2025-12-26"],
  },
  {
    id: 29,
    name: "The Wedding Strings",
    specialty: "String Quartet",
    location: "Tilburg",
    rating: 4.9,
    reviews: 289,
    price: "€150",
    equipmentPrice: "€850",
    available: true,
    category: "Band",
    image: "/artists/wedding-strings.jpg",
    equipment: getEquipmentForCategory("Band"),
    description:
      "Elegant string quartet specializing in weddings and classical events. Features two violins, viola, and cello for timeless sophistication.",
    eventTypes: ["wedding", "ceremony", "classical event", "elegant gathering", "corporate"],
    musicStyles: ["classical", "contemporary classical", "wedding music", "elegant"],
    mood: ["elegant", "romantic", "sophisticated", "timeless"],
    experience: "25+ years performing at weddings and events",
    availableDates: [
      "2024-12-25",
      "2025-01-18",
      "2025-02-14",
      "2025-03-15",
      "2025-04-20",
      "2025-12-01",
      "2025-12-05",
      "2025-12-10",
      "2025-12-15",
      "2025-12-20",
      "2025-12-25",
      "2025-12-26",
      "2025-12-27",
      "2025-12-28",
      "2025-12-29",
      "2025-12-30",
    ],
    unavailableDates: ["2024-12-31", "2025-01-01", "2025-12-21", "2025-12-31"],
  },
  {
    id: 30,
    name: "David Piano",
    specialty: "Classical & Jazz Pianist",
    location: "Breda",
    rating: 4.8,
    reviews: 198,
    price: "€100",
    equipmentPrice: "€500",
    available: true,
    category: "Pianist",
    image: "/artists/david-piano.jpg",
    equipment: getEquipmentForCategory("Pianist"),
    description:
      "Versatile pianist performing classical, jazz, and contemporary pieces. Perfect for cocktail hours, dinners, and elegant receptions.",
    eventTypes: ["cocktail party", "dinner", "wedding", "corporate event", "reception"],
    musicStyles: ["classical", "jazz", "contemporary", "standards", "elegant"],
    mood: ["sophisticated", "elegant", "refined", "atmospheric"],
    experience: "17 years as concert and event pianist",
    availableDates: [
      "2024-12-25",
      "2024-12-27",
      "2025-01-14",
      "2025-02-16",
      "2025-03-20",
      "2025-12-01",
      "2025-12-05",
      "2025-12-10",
      "2025-12-15",
      "2025-12-20",
      "2025-12-25",
      "2025-12-26",
      "2025-12-27",
      "2025-12-28",
      "2025-12-29",
      "2025-12-30",
    ],
    unavailableDates: ["2024-12-31", "2025-01-01", "2025-12-21", "2025-12-31"],
  },
  {
    id: 31,
    name: "Isabella Keys",
    specialty: "Pop & Contemporary Piano",
    location: "Maastricht",
    rating: 4.7,
    reviews: 145,
    price: "€110",
    equipmentPrice: "€550",
    available: true,
    category: "Pianist",
    image: "/artists/isabella-piano.jpg",
    equipment: getEquipmentForCategory("Pianist"),
    description:
      "Modern pianist specializing in pop covers and contemporary music. Creates engaging performances with vocals and piano.",
    eventTypes: ["party", "wedding", "celebration", "lounge", "bar"],
    musicStyles: ["pop", "contemporary", "covers", "modern", "sing-along"],
    mood: ["engaging", "modern", "fun", "interactive"],
    experience: "11 years performing pop piano",
    availableDates: [
      "2024-12-25",
      "2024-12-28",
      "2025-01-19",
      "2025-02-21",
      "2025-03-26",
      "2025-12-02",
      "2025-12-06",
      "2025-12-11",
      "2025-12-16",
      "2025-12-22",
      "2025-12-23",
      "2025-12-24",
      "2025-12-28",
    ],
    unavailableDates: ["2024-12-31", "2025-12-21", "2025-12-31", "2025-12-25"],
  },
  {
    id: 32,
    name: "Alex Strings",
    specialty: "Classical & Flamenco Guitarist",
    location: "Arnhem",
    rating: 4.9,
    reviews: 176,
    price: "€130",
    equipmentPrice: "€650",
    available: true,
    category: "Guitarist",
    image: "/artists/alex-guitar.jpg",
    equipment: getEquipmentForCategory("Guitarist"),
    description:
      "Master guitarist performing classical and flamenco pieces. Brings Spanish passion and classical elegance to any event.",
    eventTypes: ["dinner", "cocktail party", "wedding", "cultural event", "elegant gathering"],
    musicStyles: ["classical guitar", "flamenco", "spanish", "latin", "elegant"],
    mood: ["passionate", "elegant", "cultural", "sophisticated"],
    experience: "19 years mastering classical and flamenco guitar",
    availableDates: [
      "2024-12-25",
      "2024-12-30",
      "2025-01-17",
      "2025-02-19",
      "2025-03-23",
      "2025-12-03",
      "2025-12-07",
      "2025-12-12",
      "2025-12-17",
      "2025-12-26",
      "2025-12-27",
    ],
    unavailableDates: ["2024-12-31", "2025-12-21", "2025-12-31", "2025-12-24", "2025-12-25"],
  },
  {
    id: 33,
    name: "Ryan Rock",
    specialty: "Rock & Blues Guitarist",
    location: "Haarlem",
    rating: 4.7,
    reviews: 134,
    price: "€95",
    equipmentPrice: "€500",
    available: true,
    category: "Guitarist",
    image: "/artists/ryan-guitar.jpg",
    equipment: getEquipmentForCategory("Guitarist"),
    description:
      "Electric guitarist specializing in rock and blues. Perfect for parties, bars, and events needing powerful guitar performances.",
    eventTypes: ["party", "bar", "rock event", "celebration", "festival"],
    musicStyles: ["rock", "blues", "classic rock", "electric", "powerful"],
    mood: ["energetic", "powerful", "raw", "exciting"],
    experience: "13 years performing rock and blues",
    availableDates: [
      "2024-12-25",
      "2024-12-26",
      "2025-01-13",
      "2025-02-17",
      "2025-03-27",
      "2025-12-04",
      "2025-12-08",
      "2025-12-13",
      "2025-12-18",
      "2025-12-22",
      "2025-12-23",
      "2025-12-29",
      "2025-12-30",
    ],
    unavailableDates: ["2024-12-31", "2025-12-21", "2025-12-31", "2025-12-24", "2025-12-25"],
  },
  {
    id: 34,
    name: "Olivia Violin",
    specialty: "Classical & Contemporary Violinist",
    location: "Leiden",
    rating: 4.9,
    reviews: 212,
    price: "€140",
    equipmentPrice: "€700",
    available: true,
    category: "Violinist",
    image: "/artists/olivia-violin.jpg",
    equipment: getEquipmentForCategory("Violinist"),
    description:
      "Virtuoso violinist performing classical masterpieces and contemporary arrangements. Perfect for weddings, ceremonies, and elegant events.",
    eventTypes: ["wedding", "ceremony", "classical event", "elegant gathering", "corporate"],
    musicStyles: ["classical", "contemporary", "wedding music", "elegant", "virtuoso"],
    mood: ["elegant", "romantic", "sophisticated", "emotional"],
    experience: "16 years as professional violinist",
    availableDates: [
      "2024-12-25",
      "2024-12-29",
      "2025-01-21",
      "2025-02-14",
      "2025-03-29",
      "2025-12-02",
      "2025-12-06",
      "2025-12-11",
      "2025-12-16",
      "2025-12-22",
      "2025-12-23",
      "2025-12-24",
      "2025-12-28",
    ],
    unavailableDates: ["2024-12-31", "2025-01-01", "2025-12-21", "2025-12-31", "2025-12-25"],
  },
  {
    id: 35,
    name: "Latin Vibes Ensemble",
    specialty: "Latin & Salsa Band",
    location: "Nijmegen",
    rating: 4.8,
    reviews: 189,
    price: "€150",
    equipmentPrice: "€950",
    available: true,
    category: "Band",
    image: "/artists/latin-vibes.jpg",
    equipment: getEquipmentForCategory("Band"),
    description:
      "7-piece Latin band bringing authentic salsa, bachata, and merengue rhythms. Perfect for parties, cultural events, and dance celebrations.",
    eventTypes: ["party", "latin night", "cultural event", "dance celebration", "festival"],
    musicStyles: ["salsa", "bachata", "merengue", "latin", "tropical"],
    mood: ["energetic", "tropical", "dance", "cultural"],
    experience: "14 years performing Latin music",
    availableDates: [
      "2024-12-25",
      "2024-12-27",
      "2025-01-22",
      "2025-02-23",
      "2025-03-30",
      "2025-12-03",
      "2025-12-07",
      "2025-12-12",
      "2025-12-17",
      "2025-12-26",
      "2025-12-27",
    ],
    unavailableDates: ["2024-12-31", "2025-01-01", "2025-12-21", "2025-12-31", "2025-12-24", "2025-12-25"],
  },
]

export const enhancedPhotographers: Photographer[] = [
  {
    id: 101,
    name: "Alex Photography",
    specialty: "Photographer",
    location: "Amsterdam",
    rating: 4.9,
    reviews: 156,
    price: "€250",
    available: true,
    category: "Photographer",
    image: "/photographers/alex-photography.jpg",
    description:
      "Specialized in romantic and emotional wedding moments. Over 15 years of experience capturing the most important day of your life.",
    eventTypes: ["Wedding", "Anniversary", "Engagement"],
    serviceTypes: ["Wedding Photography", "Engagement Shoots", "Reception Coverage"],
    experience: "15+ years in wedding photography",
    availableDates: ["2025-02-14", "2025-03-15", "2025-04-20", "2025-05-10", "2025-06-15"],
    unavailableDates: ["2025-12-21", "2025-12-31"],
  },
  {
    id: 102,
    name: "Sofia Videography",
    specialty: "Videographer",
    location: "Rotterdam",
    rating: 4.8,
    reviews: 128,
    price: "€300",
    available: true,
    category: "Videographer",
    image: "/photographers/sofia-videography.jpg",
    description:
      "Creative videographer bringing stories to life. Specializes in cinematic event coverage and post-production editing.",
    eventTypes: ["Wedding", "Corporate Event", "Concert"],
    serviceTypes: ["Event Videography", "Drone Coverage", "Live Streaming"],
    experience: "12+ years in videography and cinematography",
    availableDates: ["2025-02-20", "2025-03-22", "2025-04-18", "2025-05-25"],
    unavailableDates: ["2025-01-01", "2025-12-24", "2025-12-31"],
  },
  {
    id: 103,
    name: "Marcus Studio",
    specialty: "Photographer",
    location: "Den Haag",
    rating: 4.7,
    reviews: 98,
    price: "€180",
    available: true,
    category: "Photographer",
    image: "/photographers/marcus-studio.jpg",
    description:
      "Professional portrait sessions in our studio or on location. Perfect for corporate headshots, family photos, or artistic portraits.",
    eventTypes: ["Corporate Event", "Birthday Party", "Product Launch"],
    serviceTypes: ["Portrait Photography", "Corporate Headshots", "Product Photography"],
    experience: "10+ years in studio and on-location portrait photography",
    availableDates: ["2025-02-10", "2025-03-05", "2025-04-08", "2025-05-20"],
    unavailableDates: [],
  },
  {
    id: 104,
    name: "Luna Productions",
    specialty: "Photographer & Videographer",
    location: "Utrecht",
    rating: 4.9,
    reviews: 201,
    price: "€220",
    available: true,
    category: "Photographer & Videographer",
    image: "/photographers/luna-productions.jpg",
    description:
      "Award-winning team specializing in corporate events, conferences, and large-scale productions. Professional and reliable coverage.",
    eventTypes: ["Corporate Event", "Conference", "Product Launch"],
    serviceTypes: ["Corporate Videography", "Live Streaming", "Post-Production"],
    experience: "18+ years in corporate and event production",
    availableDates: ["2025-02-15", "2025-03-20", "2025-04-25", "2025-05-30", "2025-06-15"],
    unavailableDates: ["2025-12-20", "2025-12-25", "2025-12-31"],
  },
  {
    id: 105,
    name: "Sky Drone Services",
    specialty: "Photographer & Videographer",
    location: "Eindhoven",
    rating: 4.8,
    reviews: 145,
    price: "€280",
    available: true,
    category: "Photographer & Videographer",
    image: "/photographers/sky-drone.jpg",
    description:
      "Aerial photography and videography services for events, real estate, and commercial projects. Fully licensed and insured.",
    eventTypes: ["Wedding", "Corporate Event", "Outdoor Event"],
    serviceTypes: ["Drone Photography", "Aerial Videography", "Real Estate Coverage"],
    experience: "8+ years in drone cinematography",
    availableDates: ["2025-02-12", "2025-03-18", "2025-04-22", "2025-05-28"],
    unavailableDates: ["2025-12-21", "2025-12-31"],
  },
  {
    id: 106,
    name: "Cinematic Moments",
    specialty: "Videographer",
    location: "Groningen",
    rating: 4.7,
    reviews: 87,
    price: "€320",
    available: false,
    category: "Videographer",
    image: "/photographers/cinematic-moments.jpg",
    description:
      "Full-service film production from concept to final cut. Specializes in music videos, documentaries, and commercial content.",
    eventTypes: ["Music Video", "Documentary", "Commercial"],
    serviceTypes: ["Film Production", "Post-Production", "Color Grading"],
    experience: "14+ years in film production and post-production",
    availableDates: ["2025-03-01", "2025-04-15", "2025-05-20"],
    unavailableDates: ["2025-01-15", "2025-12-21", "2025-12-31"],
  },
  {
    id: 107,
    name: "Joy Events Photography",
    specialty: "Photographer",
    location: "Tilburg",
    rating: 4.6,
    reviews: 112,
    price: "€150",
    available: true,
    category: "Photographer",
    image: "/photographers/joy-events.jpg",
    description:
      "Affordable photography for parties and celebrations. Captures candid moments and happy memories without breaking the bank.",
    eventTypes: ["Birthday Party", "Celebration", "Private Party"],
    serviceTypes: ["Event Photography", "Photo Albums", "Digital Delivery"],
    experience: "9+ years in party and celebration photography",
    availableDates: ["2025-02-08", "2025-03-15", "2025-04-12", "2025-05-17"],
    unavailableDates: [],
  },
  {
    id: 108,
    name: "ProStream Live",
    specialty: "Videographer",
    location: "Breda",
    rating: 4.8,
    reviews: 134,
    price: "€200",
    available: true,
    category: "Videographer",
    image: "/photographers/prostream-live.jpg",
    description:
      "Professional live streaming services for concerts, conferences, and online events. Multi-camera setups and professional mixing.",
    eventTypes: ["Concert", "Conference", "Online Event"],
    serviceTypes: ["Live Streaming", "Multi-Camera Setup", "Professional Mixing"],
    experience: "11+ years in live streaming and broadcast production",
    availableDates: ["2025-02-14", "2025-03-21", "2025-04-25", "2025-05-29"],
    unavailableDates: ["2025-12-21", "2025-12-31"],
  },
]

// Smart search function that understands context and intent
export function smartSearch(query: string, artists: Artist[]): Artist[] {
  if (!query.trim()) return artists

  const normalizedQuery = query.toLowerCase().trim()
  const queryWords = normalizedQuery.split(/\s+/)

  // Extract filters from the query
  const filters = extractFiltersFromQuery(normalizedQuery)

  // Combine artist and photographer data for searching
  const allSearchableItems = [
    ...artists.map((artist) => ({ ...artist, type: "artist" })),
    ...enhancedPhotographers.map((photographer) => ({ ...photographer, type: "photographer" })),
  ]

  // Score each item based on semantic relevance and filters
  const scoredItems = allSearchableItems.map((entry) => {
    // Artists and photographers share most fields; the rest are optional on either side.
    const item = entry as typeof entry & Partial<Artist> & Partial<Photographer>
    let score = 0
    const searchableText = [
      item.name,
      item.specialty,
      item.location,
      item.description || "",
      ...(item.eventTypes || []),
      ...(item.musicStyles || item.serviceTypes || []), // Include serviceTypes for photographers
      ...(item.mood || []),
      item.experience || "",
      item.category || "",
      ...(item.equipment || []), // Include equipment in searchable text
    ]
      .join(" ")
      .toLowerCase()

    // Direct matches get highest score
    queryWords.forEach((word) => {
      if (searchableText.includes(word)) {
        score += 10
      }
    })

    // Synonym matches get medium score
    queryWords.forEach((queryWord) => {
      Object.entries(synonyms).forEach(([key, values]) => {
        if (values.includes(queryWord) || key === queryWord) {
          const synonymsToCheck = [key, ...values]
          synonymsToCheck.forEach((synonym) => {
            if (searchableText.includes(synonym)) {
              score += 7
            }
          })
        }
      })
    })

    // Partial matches get lower score
    queryWords.forEach((word) => {
      if (word.length > 3) {
        const regex = new RegExp(word, "i")
        if (regex.test(searchableText)) {
          score += 3
        }
      }
    })

    // Context-aware scoring
    if (isEventTypeQuery(normalizedQuery)) {
      score += scoreEventTypeMatch(normalizedQuery, item)
    }

    if (isMoodQuery(normalizedQuery)) {
      score += scoreMoodMatch(normalizedQuery, item)
    }

    if (isMusicStyleQuery(normalizedQuery)) {
      score += scoreMusicStyleMatch(normalizedQuery, item)
    }

    // Score based on equipment if the query contains equipment-related terms
    if (isEquipmentQuery(normalizedQuery) && item.equipment) {
      score += scoreEquipmentMatch(normalizedQuery, item.equipment)
    }

    // Apply filters
    let filterMatch = true
    if (filters.artistTypes.length > 0 && !filters.artistTypes.includes(item.category || "")) {
      filterMatch = false
      score = 0 // Zero out score if filter doesn't match
    }
    if (filters.genres.length > 0 && !(item.musicStyles || []).some((style: string) => filters.genres.includes(style))) {
      filterMatch = false
      score = 0
    }
    if (filters.eventTypes.length > 0 && !(item.eventTypes || []).some((type) => filters.eventTypes.includes(type))) {
      filterMatch = false
      score = 0
    }
    const moodFilter = filters.mood ?? []
    if (moodFilter.length > 0 && !(item.mood || []).some((mood: string) => moodFilter.includes(mood))) {
      filterMatch = false
      score = 0
    }
    if (filters.location && item.location.toLowerCase() !== filters.location.toLowerCase()) {
      filterMatch = false
      score = 0
    }
    // Date filtering would require more complex date parsing and comparison

    return { item, score }
  })

  // Filter and sort by relevance
  const results = scoredItems
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ item }) => item)

  // Separate results into artists and photographers
  const finalArtists = results.filter((item) => item.type === "artist").map((artist) => artist as Artist)
  const finalPhotographers = results
    .filter((item) => item.type === "photographer")
    .map((photographer) => photographer as Photographer)

  // Return combined results, prioritizing artists if the query is generic
  // You might want to refine this logic based on how you want to present combined results
  // For now, let's return both lists concatenated, or adjust if query implies one over the other
  return [...finalArtists, ...finalPhotographers] as Artist[]
}

// Helper functions for context-aware scoring
function isEventTypeQuery(query: string): boolean {
  const eventKeywords = [
    "wedding",
    "bruiloft",
    "birthday",
    "verjaardag",
    "corporate",
    "zakelijk",
    "party",
    "feest",
    "club",
    "festival",
    "photography", // Added for photographer event types
    "videography", // Added for photographer event types
    "event",
    "shoot",
    "coverage",
    "portrait",
    "aerial",
    "drone",
    "streaming",
    "live",
    "conference",
    "product launch",
    "music video",
    "documentary",
  ]
  return eventKeywords.some((keyword) => query.includes(keyword))
}

function isMoodQuery(query: string): boolean {
  const moodKeywords = [
    "energetic",
    "energiek",
    "romantic",
    "romantisch",
    "chill",
    "relaxed",
    "party",
    "sophisticated",
    "elegant",
  ]
  return moodKeywords.some((keyword) => query.includes(keyword))
}

function isMusicStyleQuery(query: string): boolean {
  const styleKeywords = [
    "house",
    "techno",
    "pop",
    "hip-hop",
    "electronic",
    "classic",
    "jazz",
    "rock",
    "ambient",
    "acoustic",
    "classical",
    "flamenco",
    "indie",
    "alternative",
    "underground",
    "experimental",
    "family",
    "vintage",
    "retro",
    "psychedelic",
    "uplifting",
    "journey",
    "spiritual",
    "tropical",
    "spanish",
    "latin",
    "cultural",
    "virtuoso",
    "swing",
    "blues",
    "r&b",
    "soul",
    "disco",
    "funk",
    "dance",
    "live", // Consider if "live" should be a music style
  ]
  return styleKeywords.some((keyword) => query.includes(keyword))
}

// Helper function to check if query relates to equipment
function isEquipmentQuery(query: string): boolean {
  const equipmentKeywords = [
    "equipment",
    "gear",
    "setup",
    "needs",
    "requires",
    "sound system",
    "microphone",
    "camera",
    "lighting",
  ]
  return equipmentKeywords.some((keyword) => query.includes(keyword))
}

// Helper function to score equipment matches
function scoreEquipmentMatch(query: string, equipment: string[]): number {
  let score = 0
  const normalizedQuery = query.toLowerCase()
  equipment.forEach((item) => {
    if (normalizedQuery.includes(item.toLowerCase())) {
      score += 15 // Higher score for exact equipment matches
    } else {
      const itemParts = item.toLowerCase().split(" ")
      itemParts.forEach((part) => {
        if (normalizedQuery.includes(part) && part.length > 2) {
          score += 5 // Lower score for partial equipment matches
        }
      })
    }
  })
  return score
}

// Modified to handle both Artist and Photographer event types/serviceTypes
function scoreEventTypeMatch(query: string, item: Artist | Photographer): number {
  let score = 0
  const relevantTypes = item.eventTypes || []

  // Add serviceTypes for photographers if they exist
  if ("serviceTypes" in item && item.serviceTypes) {
    relevantTypes.push(...item.serviceTypes)
  }

  relevantTypes.forEach((eventType) => {
    if (query.includes(eventType.toLowerCase())) {
      score += 15
    }
  })
  return score
}

function scoreMoodMatch(query: string, item: Artist | Photographer): number {
  const moods = "mood" in item ? item.mood : undefined
  if (!moods) return 0

  let score = 0
  moods.forEach((mood) => {
    if (query.includes(mood.toLowerCase())) {
      score += 12
    }
  })
  return score
}

// Modified to handle both Artist musicStyles and Photographer serviceTypes if they align semantically
function scoreMusicStyleMatch(query: string, item: Artist | Photographer): number {
  let score = 0
  const musicStyles = ("musicStyles" in item && item.musicStyles) || []
  const serviceTypes = "serviceTypes" in item && item.serviceTypes ? item.serviceTypes : []
  const combinedStyles = [...musicStyles, ...serviceTypes]

  combinedStyles.forEach((style) => {
    if (query.includes(style.toLowerCase())) {
      score += 10
    }
  })
  return score
}

// Generate search suggestions based on common queries
export function generateSearchSuggestions(query: string): string[] {
  const suggestions = [
    // Event types
    "bruiloft DJ",
    "verjaardag feest",
    "corporate evenement",
    "club night",
    "festival artiest",
    "romantische avond",
    "kinderfeest",
    "familiefeest",
    // Photographer specific suggestions
    "wedding photography",
    "event videography",
    "portrait session",
    "corporate coverage",
    "drone services",
    "film production",
    "party photographer",
    "live streaming",
    "concert videography",
    "product launch photography",
    "conference coverage",
    "drone photography",

    // Music styles
    "house music",
    "techno DJ",
    "pop hits",
    "hip-hop artiest",
    "electronic dance",
    "klassieke hits",
    "jazz lounge",
    "rock party",
    "acoustic performance",
    "classical concert",
    "flamenco ensemble",
    "indie event",
    "alternative celebration",
    "underground music",
    "experimental sound",
    "family-friendly DJ",
    "vintage music",
    "retro DJ",
    "psychedelic night",
    "uplifting vibes",
    "journey music",
    "spiritual performance",
    "tropical band",
    "spanish music",
    "latin DJ",
    "cultural ensemble",
    "virtuoso violin",
    "pop piano",
    "rock guitar",
    "classical saxophone",
    "jazz quartet",
    "funk band",
    "soul singer",
    "disco music",
    "blues guitarist",

    // Moods and atmospheres
    "energieke DJ",
    "romantische muziek",
    "chill vibes",
    "party stemming",
    "elegante muziek",
    "nostalgische hits",
    "dansbare muziek",
    "achtergrondmuziek",
    "cinematic videography",
    "sophisticated event",

    // Specific needs
    "ervaren DJ",
    "goedkope artiest",
    "lokale DJ",
    "beschikbare artiest",
    "hoge beoordeling",
    "populaire DJ",
    "professionele service",
    // Equipment suggestions
    "DJ equipment",
    "band PA system",
    "singer microphone",
    "pianist keyboard",
    "guitar amplifier",
    "violin pickup",
    "camera gear",
    "lighting equipment",
    "drone",
    "streaming setup",
  ]

  if (!query.trim()) return suggestions.slice(0, 10) // Show more initial suggestions

  // Filter suggestions based on current query
  const filtered = suggestions.filter(
    (suggestion) =>
      suggestion.toLowerCase().includes(query.toLowerCase()) ||
      query
        .toLowerCase()
        .split(" ")
        .some((word) => suggestion.toLowerCase().includes(word) && word.length > 2),
  )

  return filtered.slice(0, 8) // Show up to 8 suggestions
}

// Export aliases for backwards compatibility
export const artists = enhancedArtists
export const photographers = enhancedPhotographers
