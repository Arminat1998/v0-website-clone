"use client"

import { createContext, useContext } from "react"
import type { Artist } from "@/lib/smart-search"
import type { ArtistPageContent } from "@/lib/artist-page-types"
import { ARTIST_TYPES, PHOTO_VIDEO_TYPES, canonicalEventType, canonicalGenre, eventTypeLabel, genreLabel } from "@/lib/profile-options"

export type DialogKey = "tagline" | "about" | "tags" | "photos" | "videos" | "socials"
export type TabKey = "overview" | "info" | "photos" | "videos" | "equipment" | "availability"
export type UploadKind = "banner" | "avatar" | "gallery"

export interface WebsiteEditApi {
  update: (patch: Partial<ArtistPageContent>) => void
  uploading: UploadKind | null
  uploadSingle: (kind: "banner" | "avatar", file: File | undefined) => Promise<void>
  uploadGallery: (files: FileList | null) => Promise<void>
  editProfileHref: string
}

export const websiteCopy = {
  nl: {
    tabs: {
      overview: "Alles",
      info: "Info",
      photos: "Foto's",
      videos: "Video's",
      equipment: "Apparatuur",
      availability: "Beschikbaarheid",
    },
    tabsLabel: "Onderdelen van de pagina",
    share: "Deel pagina",
    shareCopied: "Link gekopieerd",
    editCover: "Omslagfoto bewerken",
    removeCover: "Eigen omslagfoto verwijderen",
    editAvatar: "Profielfoto wijzigen",
    book: "Boek nu",
    editBasics: "Basisgegevens bewerken",
    editTagline: "Slogan bewerken",
    addTagline: "Slogan toevoegen",
    details: "Gegevens",
    editDetails: "Gegevens bewerken via je profiel",
    rate: "Tarief per uur",
    rateNote: "excl. btw en apparatuur",
    duration: "Duur",
    durationValue: "1–8 uur",
    experience: "Ervaring",
    city: "Gevestigd in",
    type: "Type",
    about: "Over mij",
    editAbout: "Over mij bewerken",
    aboutEmpty: "Nog geen beschrijving toegevoegd.",
    aboutAdd: "Vertel je verhaal",
    aboutPlaceholder: "Vertel je verhaal: je stijl, je ervaring en wat je optredens bijzonder maakt.",
    eventTypes: "Evenementtypes",
    genres: "Muziekgenres",
    editTags: "Evenementtypes en genres bewerken",
    tagsAdd: "Evenementtypes en genres toevoegen",
    tagsEmpty: "Nog geen types of genres toegevoegd.",
    tagPlaceholder: "Typ en druk op Enter",
    suggestions: "Suggesties",
    socials: "Online",
    editSocials: "Online links bewerken",
    socialsAdd: "Links toevoegen",
    socialsHint: "Links naar je kanalen, zichtbaar op je pagina.",
    photos: "Foto's",
    editPhotos: "Foto's beheren",
    photosEmpty: "Nog geen foto's.",
    photosAdd: "Foto's toevoegen",
    photosHint: "Toon sfeerbeelden van je optredens. JPG, PNG of WebP tot 8 MB.",
    allPhotos: "Alle foto's",
    removePhoto: "Foto verwijderen",
    openPhoto: "Foto openen",
    videos: "Video's",
    editVideos: "Video's beheren",
    videosEmpty: "Nog geen video's.",
    videosAdd: "Video's toevoegen",
    videosHint: "Plak een YouTube- of Vimeo-link.",
    allVideos: "Alle video's",
    videoUrl: "https://youtube.com/watch?v=...",
    videoTitle: "Titel (optioneel)",
    addVideo: "Toevoegen",
    removeVideo: "Video verwijderen",
    invalidVideo: "Alleen YouTube- en Vimeo-links worden ondersteund.",
    taglineLabel: "Slogan",
    taglinePlaceholder: "Bijv. House & techno DJ uit Amsterdam",
    taglineHint: "Een korte regel onder je naam.",
    done: "Gereed",
    bookTitle: "Boek deze artiest",
    bookText: "Bekijk de beschikbaarheid en vraag je datum direct aan.",
    checkAvailability: "Beschikbaarheid bekijken",
    equipmentTitle: "Apparatuur",
    equipmentOptions: "Apparatuuropties",
    extraOptions: "Extra opties",
    availabilityTitle: "Beschikbaarheidskalender",
    selected: "Geselecteerd",
    unavailable: "Niet beschikbaar",
    available: "Beschikbaar",
    past: "Verlopen",
    upcoming: "Aankomende boekingen",
    selectDate: "Kies een datum",
    weekdays: ["M", "D", "W", "D", "V", "Z", "Z"],
    locale: "nl-NL",
    removeTag: "verwijderen",
    limitReached: "Maximaal aantal bereikt.",
  },
  en: {
    tabs: {
      overview: "All",
      info: "Info",
      photos: "Photos",
      videos: "Videos",
      equipment: "Equipment",
      availability: "Availability",
    },
    tabsLabel: "Page sections",
    share: "Share page",
    shareCopied: "Link copied",
    editCover: "Edit cover photo",
    removeCover: "Remove custom cover photo",
    editAvatar: "Change profile photo",
    book: "Book now",
    editBasics: "Edit basic details",
    editTagline: "Edit tagline",
    addTagline: "Add tagline",
    details: "Details",
    editDetails: "Edit details in your profile",
    rate: "Rate per hour",
    rateNote: "excl. VAT and equipment",
    duration: "Duration",
    durationValue: "1–8 hours",
    experience: "Experience",
    city: "Based in",
    type: "Type",
    about: "About me",
    editAbout: "Edit about me",
    aboutEmpty: "No description added yet.",
    aboutAdd: "Tell your story",
    aboutPlaceholder: "Tell your story: your style, your experience and what makes your shows special.",
    eventTypes: "Event types",
    genres: "Music genres",
    editTags: "Edit event types and genres",
    tagsAdd: "Add event types and genres",
    tagsEmpty: "No event types or genres added yet.",
    tagPlaceholder: "Type and press Enter",
    suggestions: "Suggestions",
    socials: "Online",
    editSocials: "Edit online links",
    socialsAdd: "Add links",
    socialsHint: "Links to your channels, shown on your page.",
    photos: "Photos",
    editPhotos: "Manage photos",
    photosEmpty: "No photos yet.",
    photosAdd: "Add photos",
    photosHint: "Show the atmosphere of your shows. JPG, PNG or WebP up to 8 MB.",
    allPhotos: "All photos",
    removePhoto: "Remove photo",
    openPhoto: "Open photo",
    videos: "Videos",
    editVideos: "Manage videos",
    videosEmpty: "No videos yet.",
    videosAdd: "Add videos",
    videosHint: "Paste a YouTube or Vimeo link.",
    allVideos: "All videos",
    videoUrl: "https://youtube.com/watch?v=...",
    videoTitle: "Title (optional)",
    addVideo: "Add",
    removeVideo: "Remove video",
    invalidVideo: "Only YouTube and Vimeo links are supported.",
    taglineLabel: "Tagline",
    taglinePlaceholder: "e.g. House & techno DJ from Amsterdam",
    taglineHint: "A short line under your name.",
    done: "Done",
    bookTitle: "Book this artist",
    bookText: "Check availability and request your date right away.",
    checkAvailability: "Check availability",
    equipmentTitle: "Equipment",
    equipmentOptions: "Equipment options",
    extraOptions: "Extra options",
    availabilityTitle: "Availability calendar",
    selected: "Selected",
    unavailable: "Unavailable",
    available: "Available",
    past: "Past",
    upcoming: "Upcoming bookings",
    selectDate: "Select a date",
    weekdays: ["M", "T", "W", "T", "F", "S", "S"],
    locale: "en-US",
    removeTag: "remove",
    limitReached: "Maximum reached.",
  },
}

export type WebsiteCopy = (typeof websiteCopy)["nl"]

/** Labels that differ on the page of a photographer or videographer. */
export const photoVideoCopy: Record<"nl" | "en", Partial<WebsiteCopy>> = {
  nl: {
    tabs: { ...websiteCopy.nl.tabs, equipment: "Extra's" },
    rateNote: "excl. btw en extra's",
    aboutPlaceholder: "Vertel je verhaal: je stijl, je ervaring en wat je foto's of video's bijzonder maakt.",
    genres: "Specialisaties",
    editTags: "Evenementtypes en specialisaties bewerken",
    tagsAdd: "Evenementtypes en specialisaties toevoegen",
    tagsEmpty: "Nog geen types of specialisaties toegevoegd.",
    taglinePlaceholder: "Bijv. Bruiloft- en eventfotograaf uit Utrecht",
    bookTitle: "Boek deze fotograaf",
    equipmentTitle: "Extra's",
    equipmentOptions: "Extra's",
  },
  en: {
    tabs: { ...websiteCopy.en.tabs, equipment: "Extras" },
    rateNote: "excl. VAT and extras",
    aboutPlaceholder: "Tell your story: your style, your experience and what makes your photos or videos special.",
    genres: "Specialisations",
    editTags: "Edit event types and specialisations",
    tagsAdd: "Add event types and specialisations",
    tagsEmpty: "No event types or specialisations added yet.",
    taglinePlaceholder: "e.g. Wedding and event photographer from Utrecht",
    bookTitle: "Book this photographer",
    equipmentTitle: "Extras",
    equipmentOptions: "Extras",
  },
}

/** The copy for a profile: artists and photographers differ in a few labels. */
export function profileCopy(artist: Artist, language: "nl" | "en"): WebsiteCopy {
  return artist.kind === "photo-video" ? { ...websiteCopy[language], ...photoVideoCopy[language] } : websiteCopy[language]
}

/** Stored values are in one language; these show them in the language of the site. */
export function professionLabel(specialty: string, nl: boolean) {
  const type = [...ARTIST_TYPES, ...PHOTO_VIDEO_TYPES].find((item) => item.value === specialty)
  return type ? (nl ? type.nl : type.en) : specialty
}

export const eventTagLabel = (tag: string, nl: boolean) => eventTypeLabel(canonicalEventType(tag), nl)

export const genreTagLabel = (tag: string, nl: boolean) => genreLabel(canonicalGenre(tag), nl)

/** Real profiles hold a number ("12"), sample profiles a sentence ("10+ years of ..."): both become "12 jaar", "10+ jaar". */
export function experienceLabel(experience: string | undefined, nl: boolean) {
  const match = experience?.match(/^(\d+)(\+?)/)
  if (!match || match[1] === "0") return null
  return `${match[1]}${match[2]} ${nl ? "jaar" : match[1] === "1" && !match[2] ? "year" : "years"}`
}

/** Where the "Book" buttons on a page lead to. */
export function bookingHref(artist: Artist, date?: string) {
  const base =
    artist.kind === "photo-video"
      ? `/booking?professionalId=${artist.id}&type=photographer`
      : `/booking?artistId=${artist.id}&type=artist`
  return date ? `${base}&date=${date}` : base
}

interface WebsiteContextValue {
  artist: Artist
  content: ArtistPageContent
  edit: WebsiteEditApi | null
  t: WebsiteCopy
  openDialog: (dialog: DialogKey) => void
  goToTab: (tab: TabKey) => void
  openPhoto: (index: number) => void
}

const WebsiteContext = createContext<WebsiteContextValue | null>(null)

export const WebsiteProvider = WebsiteContext.Provider

export function useWebsite() {
  const value = useContext(WebsiteContext)
  if (!value) throw new Error("useWebsite must be used inside ArtistWebsite")
  return value
}
