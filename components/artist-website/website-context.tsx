"use client"

import { createContext, useContext } from "react"
import type { Artist } from "@/lib/smart-search"
import type { ArtistPageContent } from "@/lib/artist-page-types"

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
    chat: "Chat",
    book: "Boek nu",
    editBasics: "Basisgegevens bewerken",
    editTagline: "Slogan bewerken",
    addTagline: "Slogan toevoegen",
    reviews: "reviews",
    details: "Gegevens",
    editDetails: "Gegevens bewerken via je profiel",
    rate: "Tarief per uur",
    rateNote: "excl. apparatuur",
    duration: "Duur",
    durationValue: "1-8 uur",
    experience: "Ervaring",
    travel: "Reisafstand",
    travelValue: "Tot 10.000 km",
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
    chat: "Chat",
    book: "Book now",
    editBasics: "Edit basic details",
    editTagline: "Edit tagline",
    addTagline: "Add tagline",
    reviews: "reviews",
    details: "Details",
    editDetails: "Edit details in your profile",
    rate: "Rate per hour",
    rateNote: "excl. equipment",
    duration: "Duration",
    durationValue: "1-8 hours",
    experience: "Experience",
    travel: "Travel radius",
    travelValue: "Up to 10,000 km",
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
