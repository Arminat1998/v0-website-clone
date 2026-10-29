export type Language = "nl" | "en"

export interface Translations {
  // Header
  logIn: string
  signUp: string
  darkMode: string
  lightMode: string

  // Hero Section
  heroTitle: string
  heroSubtitle: string
  searchPlaceholder: string
  searchButton: string
  smartSearch: string
  artistsCount: string
  popularSearches: string
  trySearch: string
  directBookings: string
  aiPoweredMatching: string

  // Hero Search specific
  searchYourArtist: string
  searchButtonText: string
  popularSearchLabel: string
  searchExample: string
  searchExamples: {
    wedding: string
    dj: string
    party: string
    corporate: string
  }

  // How It Works
  howItWorksTitle: string
  howItWorksSubtitle: string
  step1Title: string
  step1Description: string
  step2Title: string
  step2Description: string
  step3Title: string
  step3Description: string

  // Services
  servicesTitle: string
  locationService: string
  cateringService: string
  artistsService: string
  photoVideoService: string
  entertainmentService: string
  decorationService: string
  securityService: string

  // Artiesten Page
  bookYourArtist: string
  bookYourPhotographer: string
  filters: string
  smartSuggestion: string
  aiSearch: string
  sortBy: string
  searchDescription: string
  noResults: string
  noResultsSubtext: string
  artistsFound: string
  artistTypeLabel: string
  photographerTypeLabel: string

  // Filters
  artistType: string
  selectType: string
  relevance: string
  priceLow: string
  priceHigh: string
  rating: string
  popularity: string
  availability: string
  selectedDate: string
  city: string
  searchCity: string
  durationInHours: string
  priceRange: string
  minPrice: string
  maxPrice: string
  musicGenres: string
  selectGenres: string
  eventTypes: string
  selectEventTypes: string

  // Artist Card
  duration: string
  musicGenresLabel: string
  eventTypesLabel: string
  perHour: string
  perDay: string // Added per day translation
  viewProfile: string
  bookNow: string
  viewed: string
  exVat: string // Added ex VAT translation
  exVat9: string // Added specific VAT percentage translations
  exVat21: string // Added specific VAT percentage translations
  equipmentPrice: string // Added equipment price translation
  performanceFee: string
  playDuration: string
  hoursRange: string

  // Footer
  aboutUs: string
  aboutUsDescription: string
  quickLinks: string
  howItWorks: string
  findVendors: string
  support: string
  contactUs: string
  termsOfService: string
  followUs: string
  allRightsReserved: string

  // Login Modal
  loginTitle: string
  loginSubtitle: string
  email: string
  password: string
  rememberMe: string
  forgotPassword: string
  loginButton: string
  orContinueWith: string
  google: string
  dontHaveAccount: string

  // Signup Modal
  createAccount: string
  createAccountSubtitle: string
  user: string
  professional: string
  selectCategory: string
  categoryHelp: string
  fullName: string
  phoneNumber: string
  signUpButton: string
  alreadyHaveAccount: string
  categoryArtist: string
  categoryPhotoVideo: string
  categoryVenue: string
  categoryCatering: string

  // Artist Categories
  dj: string
  band: string
  singer: string
  musician: string

  // Event Types
  wedding: string
  birthday: string
  corporate: string
  festival: string
  party: string

  // Music Genres
  house: string
  techno: string
  jazz: string
  pop: string
  rock: string
  classical: string

  // Smart Search & AI
  smartSearchSuggestions: string
  aiAssistant: string
  typeYourAnswer: string
  allQuestionsAnswered: string
  viewResultsBelow: string
  smartFilterAdjustments: string
  uploadMp3: string
  analyzeSong: string
  findDJByMusic: string
  uploadYourMusic: string
  analyzingMusic: string
  uploadMp3Tooltip: string
  analyzeSongTooltip: string

  // Conversational AI Questions
  aiWelcomeDefault: string
  aiWelcomeWithDetails: string
  aiGenresQuestion: string
  aiEventTypeQuestion: string
  aiCityQuestion: string
  aiDurationQuestion: string
  aiPriceQuestion: string
  aiCompleteMessage: string

  // Days of Week
  monday: string
  tuesday: string
  wednesday: string
  thursday: string
  friday: string
  saturday: string
  sunday: string

  // Months
  january: string
  february: string
  march: string
  april: string
  may: string
  june: string
  july: string
  august: string
  september: string
  october: string
  november: string
  december: string

  // Dashboard
  dashboard: string
  editProfile: string
  myWebsite: string
  calendar: string
  bookingRequests: string
  acceptedBookings: string
  completedBookings: string
  chats: string
  reviews: string
  agreement: string
  backToProfile: string
  welcomeToDashboard: string
  newMessages: string
  newBookingRequests: string
  newReview: string
  actionNeeded: string
  agreementNotAccepted: string

  // Booking Requests
  bookingRequestsTitle: string
  pending: string
  accept: string
  decline: string

  // Accepted Bookings
  acceptedBookingsTitle: string
  confirmed: string

  // Completed Bookings
  completedBookingsTitle: string
  bookingCompleted: string

  // Chats
  chatsTitle: string
  chatWith: string
  typeMessage: string
  send: string

  // Reviews
  reviewsTitle: string
  replyPlaceholder: string
  sendReply: string
  yourReply: string

  // Agreement
  agreementTitle: string
  generalTerms: string
  professionalConduct: string
  ratesPayments: string
  availabilityScheduling: string
  cancellationsNoShows: string
  clientCommunication: string
  reviewsFeedback: string
  equipmentResponsibility: string
  privacyDataUse: string
  accountTermination: string
  acceptAgreementConfirm: string
  acceptAgreementCheckbox: string
  acceptAgreementButton: string
  agreementAccepted: string

  // Calendar
  calendarTitle: string
  selectDates: string
  markAsUnavailable: string
  markAsAvailable: string
  selectAvailableDates: string
  selectUnavailableDates: string

  // Edit Profile
  editYourProfile: string
  stageName: string
  bio: string
  yearsOfExperience: string
  feePerHour: string
  minBookingHours: string
  maxBookingHours: string
  range: string
  saveChanges: string

  // Booking Process
  bookingProcessTitle: string
  dateAndLocation: string
  eventDetailsStep: string
  personalDetailsStep: string
  overviewDetailsStep: string
  confirmationStep: string
  selectDateLocation: string
  upcomingEvents: string
  noUpcomingEvents: string
  selectedDateLabel: string
  eventLocationLabel: string
  enterCityName: string
  checkDistance: string
  calculating: string
  distanceFromTo: string
  estimatedTravelCost: string
  continueToDetails: string
  equipment: string
  apparatus: string
}

export const translations: Record<Language, Translations> = {
  nl: {
    // Header
    logIn: "Log In",
    signUp: "Sign Up",
    darkMode: "Donkere modus",
    lightMode: "Lichte modus",

    // Hero Section
    heroTitle: "Vind de Perfecte Professional",
    heroSubtitle: "Slimme zoektechnologie helpt je de ideale professional te vinden voor elk evenement",
    searchPlaceholder: "Beschrijf je evenement of gewenste sfeer...",
    searchButton: "Zoeken",
    smartSearch: "Smart aangepast",
    artistsCount: "21+ professionals",
    popularSearches: "Populaire zoekopdrachten:",
    trySearch: "Probeer:",
    directBookings: "Directe boekingen",
    aiPoweredMatching: "AI-powered matching",

    // Hero Search specific
    searchYourArtist: "Zoek je perfecte professional...",
    searchButtonText: "Zoeken",
    popularSearchLabel: "Populaire zoekopdrachten:",
    searchExample: '"techno DJ voor 4 juli feest", "romantische bruiloft muziek"',
    searchExamples: {
      wedding: "bruiloft DJ Amsterdam",
      dj: "house music professional",
      party: "corporate evenement",
      corporate: "energieke party DJ",
    },

    // How It Works
    howItWorksTitle: "Hoe Het Werkt",
    howItWorksSubtitle: "Book je Professionals, Fotografen & Videograaf in drie simpele stappen.",
    step1Title: "Kies de Service Die Je Nodig Hebt",
    step1Description:
      "Start door het type professional te selecteren waar je naar zoekt: Artiesten, fotograaf of videograaf.",
    step2Title: "Gebruik Filters om de Juiste Match te Vinden",
    step2Description: "Gebruik filters om je zoekopdracht te verfijnen. Klik op een profiel om meer te ontdekken.",
    step3Title: "Boek Je Favoriet Professional",
    step3Description: "Heb je perfecte match gevonden? Klik op 'Boek Nu' om deze vast te leggen!",

    // Services
    servicesTitle: "Onze Services",
    locationService: "Locatie",
    cateringService: "Catering",
    artistsService: "Artiesten",
    photoVideoService: "Photo / Videograph",
    entertainmentService: "Entertainment",
    decorationService: "Decoratie",
    securityService: "Beveiliging",

    // Artiesten Page
    bookYourArtist: "Boek Je Artiest!",
    bookYourPhotographer: "Boek Je Photo/Videograaf!",
    filters: "Filters",
    smartSuggestion: "Smart aangepast",
    aiSearch: "AI Slimme Zoeken",
    sortBy: "Sorteer Op",
    searchDescription: "Beschrijf je evenement of gewenste sfeer...",
    noResults: "Geen professionals gevonden",
    noResultsSubtext: "Probeer je zoekopdracht aan te passen of filters te wijzigen.",
    artistsFound: "professionals gevonden voor",
    artistTypeLabel: "Artiest Type",
    photographerTypeLabel: "Service Type",

    // Filters
    artistType: "Artiest Type",
    selectType: "Selecteer type",
    relevance: "Relevantie",
    priceLow: "Prijs: Laag naar Hoog",
    priceHigh: "Prijs: Hoog naar Laag",
    rating: "Rating",
    popularity: "Populariteit",
    availability: "Beschikbaarheid",
    selectedDate: "Geselecteerde datum:",
    city: "Stad",
    searchCity: "Zoek stad...",
    durationInHours: "Duur (in uren)",
    priceRange: "Prijsbereik",
    minPrice: "Min Prijs (€)",
    maxPrice: "Max Prijs (€)",
    musicGenres: "Muziekgenres",
    selectGenres: "Selecteer genres",
    eventTypes: "Evenement Types",
    selectEventTypes: "Selecteer evenement types",

    // Artist Card
    duration: "Duur",
    musicGenresLabel: "Muziekgenres",
    eventTypesLabel: "Evenement Types",
    perHour: "per uur",
    perDay: "per dag", // Added Dutch translation
    viewProfile: "Bekijk Profiel",
    bookNow: "Boek Nu",
    viewed: "Bekeken",
    exVat: "ex. BTW", // Added Dutch translation
    exVat9: "ex. BTW", // Removed percentage from VAT label
    exVat21: "ex. BTW", // Removed percentage from VAT label
    equipmentPrice: "Apparatuur", // Added Dutch translation
    performanceFee: "Gage",
    playDuration: "Speelduur",
    hoursRange: "1–8 uur",

    // Footer
    aboutUs: "Over Ons",
    aboutUsDescription:
      "ARSI Events is jouw alles-in-één platform voor moeiteloos evenement plannen en betrouwbare professionals.",
    quickLinks: "Snelle Links",
    howItWorks: "Hoe Het Werkt",
    findVendors: "Vind Professionals",
    support: "Ondersteuning",
    contactUs: "Contact",
    termsOfService: "Servicevoorwaarden",
    followUs: "Volg Ons",
    allRightsReserved: "Alle rechten voorbehouden.",

    // Login Modal
    loginTitle: "Log In",
    loginSubtitle: "Voer je inloggegevens in om toegang te krijgen tot je account",
    email: "E-mail",
    password: "Wachtwoord",
    rememberMe: "Onthoud mij",
    forgotPassword: "Wachtwoord vergeten?",
    loginButton: "Log in",
    orContinueWith: "OF GA VERDER MET",
    google: "Google",
    dontHaveAccount: "Heb je nog geen account?",

    // Signup Modal
    createAccount: "Maak een account aan",
    createAccountSubtitle: "Voer hieronder je gegevens in om je account aan te maken",
    user: "Gebruiker",
    professional: "Professional",
    selectCategory: "Selecteer je categorie",
    categoryHelp: "Dit helpt klanten je te vinden op basis van het type dienst dat je aanbiedt",
    fullName: "Volledige Naam",
    phoneNumber: "Telefoonnummer",
    signUpButton: "Aanmelden",
    alreadyHaveAccount: "Heb je al een account?",
    categoryArtist: "Artiest (DJ, Band, Muzikant)",
    categoryPhotoVideo: "Foto / Videograaf",
    categoryVenue: "Locatie",
    categoryCatering: "Catering",

    // Artist Categories
    dj: "DJ",
    band: "Band",
    singer: "Zanger",
    musician: "Muzikant",

    // Event Types
    wedding: "Bruiloft",
    birthday: "Verjaardag",
    corporate: "Zakelijk",
    festival: "Festival",
    party: "Feest",

    // Music Genres
    house: "House",
    techno: "Techno",
    jazz: "Jazz",
    pop: "Pop",
    rock: "Rock",
    classical: "Klassiek",

    // Smart Search & AI
    smartSearchSuggestions: "Slimme zoeksuggesties",
    aiAssistant: "AI Assistent",
    typeYourAnswer: "Type je antwoord...",
    allQuestionsAnswered: "Alle vragen beantwoord! Bekijk je resultaten hieronder.",
    viewResultsBelow: "Bekijk je resultaten",
    smartFilterAdjustments: "Slimme filter aanpassingen:",
    uploadMp3: "Upload MP3",
    analyzeSong: "Analyseer Nummer",
    findDJByMusic: "Vind DJ op basis van muziek",
    uploadYourMusic: "Upload je muziek bestand",
    analyzingMusic: "Muziek analyseren...",
    uploadMp3Tooltip: "Upload een MP3 bestand om DJs te vinden die bij jouw muziekkeuze passen",
    analyzeSongTooltip: "Analyseer een nummer om de perfecte DJ match te vinden",

    // Conversational AI Questions
    aiWelcomeDefault: "Ik help je graag met het vinden van de perfecte artiest! Laten we beginnen met een paar vragen.",
    aiWelcomeWithDetails:
      "Ik zie dat je zoekt naar een {category} voor {eventType} op {date}. Laat me je helpen met een paar extra vragen om de beste match te vinden!",
    aiGenresQuestion: "Welke muziekstijl(en) heb je in gedachten? (bijv: House, Techno, Jazz, Pop)",
    aiEventTypeQuestion: "Voor wat voor soort evenement is dit? (bijv: Bruiloft, Bedrijfsfeest, Verjaardag)",
    aiCityQuestion: "In welke stad wil je het evenement organiseren?",
    aiDurationQuestion: "Hoe laat begint en eindigt het optreden? (bijv: van 20:00 tot 00:00)",
    aiPriceQuestion: "Wat is je budget voor dit evenement? (bijv: max 500 euro, tussen 300 en 800 euro)",
    aiCompleteMessage:
      "Geweldig! Ik heb alle informatie. De filters zijn automatisch toegepast. Je ziet nu de beste matches voor jouw evenement! 🎉",

    // Days of Week
    monday: "Ma",
    tuesday: "Di",
    wednesday: "Wo",
    thursday: "Do",
    friday: "Vr",
    saturday: "Za",
    sunday: "Zo",

    // Months
    january: "Januari",
    february: "Februari",
    march: "Maart",
    april: "April",
    may: "Mei",
    june: "Juni",
    july: "Juli",
    august: "Augustus",
    september: "September",
    october: "Oktober",
    november: "November",
    december: "December",

    // Dashboard
    dashboard: "Dashboard",
    editProfile: "Profiel Bewerken",
    myWebsite: "Mijn Website",
    calendar: "Kalender",
    bookingRequests: "Boekingsaanvragen",
    acceptedBookings: "Geaccepteerde Boekingen",
    completedBookings: "Afgeronde Boekingen",
    chats: "Chats",
    reviews: "Reviews",
    agreement: "Overeenkomst",
    backToProfile: "Terug naar Profiel",
    welcomeToDashboard: "Welkom bij je Dashboard",
    newMessages: "Nieuwe Berichten",
    newBookingRequests: "Nieuwe Boekingsaanvragen",
    newReview: "Nieuwe Review",
    actionNeeded: "Actie Vereist",
    agreementNotAccepted: "Overeenkomst nog niet geaccepteerd",

    // Booking Requests
    bookingRequestsTitle: "Boekingsaanvragen",
    pending: "In afwachting",
    accept: "Accepteren",
    decline: "Weigeren",

    // Accepted Bookings
    acceptedBookingsTitle: "Geaccepteerde Boekingen",
    confirmed: "Bevestigd",

    // Completed Bookings
    completedBookingsTitle: "Afgeronde Boekingen",
    bookingCompleted: "Deze boeking is succesvol afgerond.",

    // Chats
    chatsTitle: "Chats",
    chatWith: "Chat met",
    typeMessage: "Typ een bericht...",
    send: "Verstuur",

    // Reviews
    reviewsTitle: "Klantenreviews",
    replyPlaceholder: "Reageer op deze review...",
    sendReply: "Verstuur reactie",
    yourReply: "Jouw reactie",

    // Agreement
    agreementTitle: "DJ Overeenkomst",
    generalTerms: "Algemene Voorwaarden",
    professionalConduct: "Professioneel Gedrag",
    ratesPayments: "Tarieven & Betalingen",
    availabilityScheduling: "Beschikbaarheid & Planning",
    cancellationsNoShows: "Annuleringen & No-shows",
    clientCommunication: "Klantcommunicatie",
    reviewsFeedback: "Reviews & Feedback",
    equipmentResponsibility: "Apparatuur & Verantwoordelijkheid",
    privacyDataUse: "Privacy & Datagebruik",
    accountTermination: "Account Beëindiging",
    acceptAgreementConfirm: "Door deze overeenkomst te accepteren, bevestig je dat:",
    acceptAgreementCheckbox: "Ik ga akkoord met de DJ Overeenkomst en accepteer alle bovenstaande voorwaarden.",
    acceptAgreementButton: "Accepteer Overeenkomst",
    agreementAccepted: "Je hebt de overeenkomst geaccepteerd!",

    // Calendar
    calendarTitle: "Beschikbaarheid Kalender",
    selectDates: "Selecteer datums",
    markAsUnavailable: "Markeer als Niet Beschikbaar",
    markAsAvailable: "Markeer als Beschikbaar",
    selectAvailableDates: "Selecteer Beschikbare Datum(s)",
    selectUnavailableDates: "Selecteer Niet Beschikbare Datum(s)",

    // Edit Profile
    editYourProfile: "Bewerk Je Profiel",
    stageName: "Artiestennaam",
    bio: "Biografie",
    yearsOfExperience: "Jaren Ervaring",
    feePerHour: "Tarief (€ per uur)",
    minBookingHours: "Minimum Boekingsuren",
    maxBookingHours: "Maximum Boekingsuren",
    range: "Bereik (km)",
    saveChanges: "Wijzigingen Opslaan",

    // Booking Process
    bookingProcessTitle: "Boekingsproces",
    dateAndLocation: "Datum & Locatie",
    eventDetailsStep: "Evenement Details",
    personalDetailsStep: "Persoonlijke Gegevens",
    overviewDetailsStep: "Overzicht Details",
    confirmationStep: "Bevestiging",
    selectDateLocation: "Selecteer een Datum & Locatie",
    upcomingEvents: "Aankomende Evenementen",
    noUpcomingEvents: "Geen aankomende evenementen",
    selectedDateLabel: "Geselecteerde Datum:",
    eventLocationLabel: "Evenement Locatie",
    enterCityName: "Voer stadsnaam in (bijv. Utrecht)",
    checkDistance: "Controleer Afstand",
    calculating: "Berekenen...",
    distanceFromTo: "Afstand van",
    estimatedTravelCost: "Geschatte reiskosten:",
    continueToDetails: "Verder naar Details",
    equipment: "Apparatuur",
    apparatus: "Apparatuur",
  },
  en: {
    // Header
    logIn: "Log In",
    signUp: "Sign Up",
    darkMode: "Dark mode",
    lightMode: "Light mode",

    // Hero Section
    heroTitle: "Find the Perfect Professional",
    heroSubtitle: "Smart search technology helps you find the ideal professional for every event",
    searchPlaceholder: "Describe your event or desired atmosphere...",
    searchButton: "Search",
    smartSearch: "Smart Suggested",
    artistsCount: "21+ professionals",
    popularSearches: "Popular searches:",
    trySearch: "Try:",
    directBookings: "Direct bookings",
    aiPoweredMatching: "AI-powered matching",

    // Hero Search specific
    searchYourArtist: "Search your perfect professional...",
    searchButtonText: "Search",
    popularSearchLabel: "Popular searches:",
    searchExample: '"techno DJ for July 4th party", "romantic wedding music"',
    searchExamples: {
      wedding: "wedding DJ Amsterdam",
      dj: "house music professional",
      party: "corporate event",
      corporate: "energetic party DJ",
    },

    // How It Works
    howItWorksTitle: "How It Works",
    howItWorksSubtitle: "Book your Artists, Photographers & Videographers in three simple steps.",
    step1Title: "Choose the Service You Need",
    step1Description:
      "Start by selecting the type of professional you're looking for: Artists, photographer or videographer.",
    step2Title: "Use Filters to Find the Right Match",
    step2Description: "Use filters to refine your search. Click on a profile to explore more.",
    step3Title: "Book Your Favorite Professional",
    step3Description: "Found your perfect match? Click 'Book Now' to lock it in!",

    // Services
    servicesTitle: "Our Services",
    locationService: "Location",
    cateringService: "Catering",
    artistsService: "Artists",
    photoVideoService: "Photo / Videograph",
    entertainmentService: "Entertainment",
    decorationService: "Decoration",
    securityService: "Security",

    // Artiesten Page
    bookYourArtist: "Book Your Artist!",
    bookYourPhotographer: "Book Your Photographer/Videographer!",
    filters: "Filters",
    smartSuggestion: "Smart Suggested",
    aiSearch: "AI Smart Search",
    sortBy: "Sort By",
    searchDescription: "Describe your event or desired atmosphere...",
    noResults: "No professionals found",
    noResultsSubtext: "Try adjusting your search query or modify filters.",
    artistsFound: "professionals found for",
    artistTypeLabel: "Artist Type",
    photographerTypeLabel: "Service Type",

    // Filters
    artistType: "Artist Type",
    selectType: "Select type",
    relevance: "Relevance",
    priceLow: "Price: Low to High",
    priceHigh: "Price: High to Low",
    rating: "Rating",
    popularity: "Popularity",
    availability: "Availability",
    selectedDate: "Selected date:",
    city: "City",
    searchCity: "Search city...",
    durationInHours: "Duration (in hours)",
    priceRange: "Price Range",
    minPrice: "Min Price (€)",
    maxPrice: "Max Price (€)",
    musicGenres: "Music Genres",
    selectGenres: "Select genres",
    eventTypes: "Event Types",
    selectEventTypes: "Select event types",

    // Artist Card
    duration: "Duration",
    musicGenresLabel: "Music Genres",
    eventTypesLabel: "Event Types",
    perHour: "per hour",
    perDay: "per day", // Added English translation
    viewProfile: "View Profile",
    bookNow: "Book Now",
    viewed: "Viewed",
    exVat: "ex. VAT", // Added English translation
    exVat9: "ex. VAT", // Removed percentage from VAT label
    exVat21: "ex. VAT", // Removed percentage from VAT label
    equipmentPrice: "Equipment", // Added English translation
    performanceFee: "Fee",
    playDuration: "Duration",
    hoursRange: "1–8 hours",

    // Footer
    aboutUs: "About Us",
    aboutUsDescription:
      "ARSI Events is your all-in-one platform for effortless event planning and trusted professional connections.",
    quickLinks: "Quick Links",
    howItWorks: "How It Works",
    findVendors: "Find Professionals",
    support: "Support",
    contactUs: "Contact Us",
    termsOfService: "Terms of Service",
    followUs: "Follow Us",
    allRightsReserved: "All rights reserved.",

    // Login Modal
    loginTitle: "Log In",
    loginSubtitle: "Enter your credentials to access your account",
    email: "Email",
    password: "Password",
    rememberMe: "Remember me",
    forgotPassword: "Forgot password?",
    loginButton: "Log in",
    orContinueWith: "OR CONTINUE WITH",
    google: "Google",
    dontHaveAccount: "Don't have an account?",

    // Signup Modal
    createAccount: "Create an account",
    createAccountSubtitle: "Enter your details below to create your account",
    user: "User",
    professional: "Professional",
    selectCategory: "Select your category",
    categoryHelp: "This helps clients find you based on the type of service you offer",
    fullName: "Full Name",
    phoneNumber: "Phone Number",
    signUpButton: "Sign Up",
    alreadyHaveAccount: "Already have an account?",
    categoryArtist: "Artist (DJ, Band, Musician)",
    categoryPhotoVideo: "Photo / Videographer",
    categoryVenue: "Venue",
    categoryCatering: "Catering",

    // Artist Categories
    dj: "DJ",
    band: "Band",
    singer: "Singer",
    musician: "Musician",

    // Event Types
    wedding: "Wedding",
    birthday: "Birthday",
    corporate: "Corporate",
    festival: "Festival",
    party: "Party",

    // Music Genres
    house: "House",
    techno: "Techno",
    jazz: "Jazz",
    pop: "Pop",
    rock: "Rock",
    classical: "Classical",

    // Smart Search & AI
    smartSearchSuggestions: "Smart search suggestions",
    aiAssistant: "AI Assistant",
    typeYourAnswer: "Type your answer...",
    allQuestionsAnswered: "All questions answered! View your results below.",
    viewResultsBelow: "View results",
    smartFilterAdjustments: "Smart filter adjustments:",
    uploadMp3: "Upload MP3",
    analyzeSong: "Analyze Song",
    findDJByMusic: "Find DJ by music taste",
    uploadYourMusic: "Upload your music file",
    analyzingMusic: "Analyzing music...",
    uploadMp3Tooltip: "Upload an MP3 file to find DJs matching your music taste",
    analyzeSongTooltip: "Analyze a song to find the perfect DJ match",

    // Conversational AI Questions
    aiWelcomeDefault: "I'm happy to help you find the perfect vendor! Let's start with a few questions.",
    aiWelcomeWithDetails:
      "I see you're looking for a {category} for {eventType} on {date}. Let me help you with a few extra questions to find the best match!",
    aiGenresQuestion: "Which music style(s) do you have in mind? (e.g.: House, Techno, Jazz, Pop)",
    aiEventTypeQuestion: "What type of event is this? (e.g.: Wedding, Corporate, Birthday)",
    aiCityQuestion: "In which city do you want to organize the event?",
    aiDurationQuestion: "What time does the performance start and end? (e.g.: from 8:00 PM to 12:00 AM)",
    aiPriceQuestion: "What is your budget for this event? (e.g.: max 500 euro, between 300 and 800 euro)",
    aiCompleteMessage:
      "Great! I have all the information. The filters have been automatically applied. You now see the best matches for your event! 🎉",

    // Days of Week
    monday: "Mon",
    tuesday: "Tue",
    wednesday: "Wed",
    thursday: "Thu",
    friday: "Fri",
    saturday: "Sat",
    sunday: "Sun",

    // Months
    january: "January",
    february: "February",
    march: "March",
    april: "April",
    may: "May",
    june: "June",
    july: "July",
    august: "August",
    september: "September",
    october: "October",
    november: "November",
    december: "December",

    // Dashboard
    dashboard: "Dashboard",
    editProfile: "Edit Profile",
    myWebsite: "My Website",
    calendar: "Calendar",
    bookingRequests: "Booking Requests",
    acceptedBookings: "Accepted Bookings",
    completedBookings: "Completed Bookings",
    chats: "Chats",
    reviews: "Reviews",
    agreement: "Agreement",
    backToProfile: "Back to Profile",
    welcomeToDashboard: "Welcome to your Dashboard",
    newMessages: "New Messages",
    newBookingRequests: "New Booking Requests",
    newReview: "New Review",
    actionNeeded: "Action Needed",
    agreementNotAccepted: "Agreement not yet accepted",

    // Booking Requests
    bookingRequestsTitle: "Booking Requests",
    pending: "Pending",
    accept: "Accept",
    decline: "Decline",

    // Accepted Bookings
    acceptedBookingsTitle: "Accepted Bookings",
    confirmed: "Confirmed",

    // Completed Bookings
    completedBookingsTitle: "Completed Bookings",
    bookingCompleted: "This booking was successfully completed.",

    // Chats
    chatsTitle: "Chats",
    chatWith: "Chat with",
    typeMessage: "Type a message...",
    send: "Send",

    // Reviews
    reviewsTitle: "Customer Reviews",
    replyPlaceholder: "Reply to this review...",
    sendReply: "Send reply",
    yourReply: "Your reply",

    // Agreement
    agreementTitle: "DJ Agreement",
    generalTerms: "General Terms",
    professionalConduct: "Professional Conduct",
    ratesPayments: "Rates & Payments",
    availabilityScheduling: "Availability & Scheduling",
    cancellationsNoShows: "Cancellations & No-shows",
    clientCommunication: "Client Communication",
    reviewsFeedback: "Reviews & Feedback",
    equipmentResponsibility: "Equipment & Responsibility",
    privacyDataUse: "Privacy & Data Use",
    accountTermination: "Account Termination",
    acceptAgreementConfirm: "By accepting this agreement, you confirm that:",
    acceptAgreementCheckbox: "I agree to the DJ Agreement and accept all terms above.",
    acceptAgreementButton: "Accept Agreement",
    agreementAccepted: "You have accepted the agreement!",

    // Calendar
    calendarTitle: "Availability Calendar",
    selectDates: "Select dates",
    markAsUnavailable: "Mark as Unavailable",
    markAsAvailable: "Mark as Available",
    selectAvailableDates: "Select Available Date(s)",
    selectUnavailableDates: "Select Unavailable Date(s)",

    // Edit Profile
    editYourProfile: "Edit Your Profile",
    stageName: "Stage Name",
    bio: "Bio",
    yearsOfExperience: "Years of Experience",
    feePerHour: "Fee (€ per hour)",
    minBookingHours: "Minimum Booking Hours",
    maxBookingHours: "Maximum Booking Hours",
    range: "Range (km)",
    saveChanges: "Save Changes",

    // Booking Process
    bookingProcessTitle: "Booking Process",
    dateAndLocation: "Date & Location",
    eventDetailsStep: "Event Details",
    personalDetailsStep: "Personal Details",
    overviewDetailsStep: "Overview Details",
    confirmationStep: "Confirmation",
    selectDateLocation: "Select a Date & Location",
    upcomingEvents: "Upcoming Events",
    noUpcomingEvents: "No upcoming events",
    selectedDateLabel: "Selected Date:",
    eventLocationLabel: "Event Location",
    enterCityName: "Enter city name (e.g., Utrecht)",
    checkDistance: "Check Distance",
    calculating: "Calculating...",
    distanceFromTo: "Distance from",
    estimatedTravelCost: "Estimated travel cost:",
    continueToDetails: "Continue to Details",
    equipment: "Equipment",
    apparatus: "Apparatus",
  },
}

export function getTranslation(lang: Language, key: keyof Translations): string {
  return translations[lang][key]
}
