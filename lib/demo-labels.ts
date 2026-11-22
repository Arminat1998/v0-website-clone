// Dutch names for the tags of the example profiles that are not in the lists of lib/profile-options.
const EVENTS: Record<string, string> = {
  "dance party": "Dansfeest", "corporate party": "Bedrijfsfeest", celebration: "Feest", "social event": "Sociaal evenement", party: "Feest",
  "urban party": "Urban feest", "youth event": "Jongerenevenement", "social gathering": "Samenkomst", rave: "Rave", "electronic party": "Elektronisch feest",
  reunion: "Reünie", "mature party": "Feest voor volwassenen", "nostalgic event": "Nostalgisch evenement", lounge: "Lounge", "upscale party": "Chic feest",
  "sophisticated event": "Stijlvol evenement", "cocktail party": "Cocktailparty", "romantic event": "Romantisch evenement", "family celebration": "Familiefeest",
  "trance party": "Trancefeest", "electronic event": "Elektronisch evenement", "progressive night": "Progressive-avond", "latin party": "Latinfeest",
  "summer event": "Zomerevenement", "cultural celebration": "Cultureel feest", "tropical party": "Tropisch feest", "youth party": "Jongerenfeest",
  "trendy event": "Trendy evenement", "social media event": "Socialmedia-evenement", "modern celebration": "Modern feest", "vintage party": "Vintagefeest",
  "senior event": "Seniorenevenement", "nostalgic celebration": "Nostalgisch feest", "classic night": "Klassieke avond", "indie event": "Indie-evenement",
  "artistic gathering": "Kunstzinnige bijeenkomst", "creative party": "Creatief feest", "alternative celebration": "Alternatief feest",
  "business event": "Zakelijk evenement", networking: "Netwerken", "professional gathering": "Zakelijke bijeenkomst", "large event": "Groot evenement",
  "outdoor party": "Buitenfeest", "main stage": "Hoofdpodium", "kids party": "Kinderfeest", "family event": "Familie-evenement",
  "children celebration": "Kinderfeest", "all ages": "Alle leeftijden", "disco party": "Discofeest", "retro event": "Retro-evenement",
  "dance celebration": "Dansfeest", "groovy night": "Groovy avond", "jazz night": "Jazzavond", "elegant event": "Elegant evenement",
  "sophisticated gathering": "Stijlvolle bijeenkomst", "techno party": "Technofeest", "underground event": "Underground-evenement",
  "minimal night": "Minimal-avond", "rock party": "Rockfeest", "metal night": "Metalavond", "alternative event": "Alternatief evenement",
  "headbanging celebration": "Metalfeest", "wellness event": "Wellness-evenement", meditation: "Meditatie", "chill gathering": "Ontspannen samenkomst",
  "relaxed party": "Ontspannen feest", "general party": "Algemeen feest", "mixed crowd": "Gemengd publiek", "versatile event": "Veelzijdig evenement",
  dinner: "Diner", "dance event": "Dansevenement", "elegant gathering": "Elegante bijeenkomst", "wedding ceremony": "Huwelijksceremonie",
  "intimate gathering": "Intieme bijeenkomst", "acoustic night": "Akoestische avond", cafe: "Café", ceremony: "Ceremonie", "classical event": "Klassiek evenement",
  reception: "Receptie", bar: "Bar", "cultural event": "Cultureel evenement", "rock event": "Rockevenement", "latin night": "Latinavond",
  "birthday party": "Verjaardagsfeest", "outdoor event": "Buitenevenement", "music video": "Videoclip", documentary: "Documentaire", commercial: "Reclame",
  "online event": "Online evenement",
}

const STYLES: Record<string, string> = {
  electronic: "Elektronisch", charts: "Hitlijsten", classics: "Klassiekers", sophisticated: "Stijlvol", romantic: "Romantisch", "all genres": "Alle genres",
  "family-friendly": "Familievriendelijk", uplifting: "Opzwepend", tropical: "Tropisch", "current hits": "Hits van nu", "golden era": "Gouden tijd",
  experimental: "Experimenteel", "background music": "Achtergrondmuziek", professional: "Zakelijk", "main stage": "Hoofdpodium", "crowd pleasers": "Meezingers",
  "kids music": "Kindermuziek", "all ages": "Alle leeftijden", dark: "Donker", hypnotic: "Hypnotisch", meditative: "Meditatief", "various genres": "Diverse genres",
  adaptable: "Veelzijdig", party: "Feest", "modern hits": "Moderne hits", acoustic: "Akoestisch", intimate: "Intiem", "contemporary classical": "Hedendaags klassiek",
  "wedding music": "Bruiloftsmuziek", elegant: "Elegant", modern: "Modern", "sing-along": "Meezingen", "classical guitar": "Klassieke gitaar", spanish: "Spaans",
  electric: "Elektrisch", powerful: "Krachtig", virtuoso: "Virtuoos",
  "engagement shoots": "Verlovingsshoots", "reception coverage": "Receptiereportage", "event videography": "Evenementvideo", "drone coverage": "Drone-opnames",
  "live streaming": "Livestream", "portrait photography": "Portretten", "corporate headshots": "Zakelijke portretten", "product photography": "Productfotografie",
  "corporate videography": "Bedrijfsvideo", "post-production": "Nabewerking", "drone photography": "Dronefotografie", "aerial videography": "Luchtopnames",
  "real estate coverage": "Vastgoedreportage", "film production": "Filmproductie", "color grading": "Kleurcorrectie", "photo albums": "Fotoalbums",
  "digital delivery": "Digitale levering", "multi-camera setup": "Meerdere camera's", "professional mixing": "Professionele mix",
}

export const demoEventLabel = (raw: string) => EVENTS[raw.trim().toLowerCase()]
export const demoStyleLabel = (raw: string) => STYLES[raw.trim().toLowerCase()]
