"use client"

import { useState, useEffect, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import useSWR from "swr"
import { Check, MapPin, AlertTriangle, Euro, ChevronLeft, ChevronRight, Clock, Speaker, CheckCircle2, LockKeyhole, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { uploadPresigned } from "@vercel/blob/client"
import { ComboSelect, comboGroups } from "@/components/combo-select"
import { LiveListError } from "@/components/list-status"
import { AudioUpload } from "@/components/booking/audio-upload"
import { audioContentType, newAudioPath } from "@/lib/bookings/audio"
import { artists, photographers } from "@/lib/smart-search"
import { isDemoProfessional } from "@/lib/demo-professionals"
import { Header } from "@/components/header"
import { useLanguage } from "@/contexts/language-context"
import { depositCents } from "@/lib/bookings/payments"
import { PaymentMoments, paymentMoments } from "@/components/booking/payment-moments"
import { calculateBookingDistance, createBooking, getBlockedDates, getBookingOptions, type CreateBookingInput } from "@/app/actions/bookings"
import { useLiveProfessionals } from "@/hooks/use-live-professionals"
import { bookingErrorMessage, readBookingResult } from "./submit-result"
import { reachUserTestGoal, trackUserTest } from "@/lib/usertest"
import { useBookingDraft } from "@/hooks/use-booking-draft"
import { authClient } from "@/lib/auth-client"
import { digitsOnly, lettersOnly, phoneChars, postalCodeChars } from "@/lib/input-filters"
import { formatEventDate, todayIso } from "@/lib/bookings/format"
import { eventLabel, styleLabel, tagLabels } from "@/lib/list-filters"
import { EVENT_TYPE_GROUPS, GENRE_GROUPS, genreLabel } from "@/lib/profile-options"
import { getCustomerProfile } from "@/app/actions/customer"
import { PACKAGE_OPTION_ID, formatEuro, hoursBetween, hoursProblem, priceBooking, travelCents } from "@/lib/bookings/pricing"

const toIsoDate = (year: number, month: number, day: number) =>
  `${year}-${(month + 1).toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`

// The same limits as the server.
const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
const isPhone = (value: string) => value.replace(/\D/g, "").length >= 6

/** Empty, or an address that starts with http(s). */
function isWebLink(value: string) {
  if (!value.trim()) return true
  try {
    return /^https?:$/.test(new URL(value.trim()).protocol)
  } catch {
    return false
  }
}

/** A place name or a postal code. */
const placeChars = (value: string) => value.replace(/[^\p{L}\p{M}\d '’.-]/gu, "")

/** Every half hour of the day, as "HH:MM". */
const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => `${String(Math.floor(i / 2)).padStart(2, "0")}:${i % 2 ? "30" : "00"}`)

const timeToMinutes = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number)
  return hours * 60 + minutes
}

/** End times in half-hour increments, ordered from the chosen start time. */
export function getEndTimeOptions(startTime: string, minHours: number, maxHours: number) {
  if (!startTime || minHours > maxHours) return []
  const startMinutes = timeToMinutes(startTime)
  const options: string[] = []
  for (let halfHours = Math.ceil(minHours * 2); halfHours <= Math.floor(maxHours * 2); halfHours += 1) {
    const endMinutes = (startMinutes + halfHours * 30) % (24 * 60)
    options.push(`${String(Math.floor(endMinutes / 60)).padStart(2, "0")}:${String(endMinutes % 60).padStart(2, "0")}`)
  }
  return options
}

export default function BookingPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { t, language } = useLanguage()
  const dateLocale = language === "nl" ? "nl-NL" : "en-US"
  const tr = (nl: string, en: string) => (language === "nl" ? nl : en)
  
  const artistId = searchParams.get("artistId")
  const professionalId = searchParams.get("professionalId")
  const type = searchParams.get("type")
  const initialDate = searchParams.get("date")

  const steps = [
    { number: 1, label: t.dateAndLocation },
    { number: 2, label: t.eventDetailsStep },
    { number: 3, label: t.personalDetailsStep },
    { number: 4, label: t.overviewDetailsStep },
    { number: 5, label: t.confirmationStep },
  ]
  
  const [currentStep, setCurrentStep] = useState(1)
  // After a step change the heading of the new step comes into view and gets the focus.
  const stepHeading = useRef<HTMLHeadingElement>(null)
  const shownStep = useRef(1)
  useEffect(() => trackUserTest("booking_step_viewed", { step: currentStep }), [currentStep])
  useEffect(() => {
    if (shownStep.current === currentStep) return
    shownStep.current = currentStep
    stepHeading.current?.focus({ preventScroll: true })
    stepHeading.current?.scrollIntoView({ block: "start" })
  }, [currentStep])
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [eventLocation, setEventLocation] = useState("")
  const [distance, setDistance] = useState<number | null>(null)
  const [calculating, setCalculating] = useState(false)
  
  // Step 2 - Event Details
  const [eventName, setEventName] = useState("")
  // The chosen date as YYYY-MM-DD. It is chosen in step 1 only; every other step shows this value.
  const [eventDate, setEventDate] = useState("")
  // Why a date (from the link, or one that was booked meanwhile) was not chosen.
  const [dateNotice, setDateNotice] = useState<"invalid" | "past" | "booked" | null>(null)
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([])
  const [selectedMusicGenres, setSelectedMusicGenres] = useState<string[]>([])
  const [capacity, setCapacity] = useState("")
  const [description, setDescription] = useState("")
  const [specialRequests, setSpecialRequests] = useState("")
  const [playlistLink, setPlaylistLink] = useState("")
  const [openingDanceOption, setOpeningDanceOption] = useState<"upload" | "link">("upload")
  const [openingDanceFile, setOpeningDanceFile] = useState<File | null>(null)
  const [openingDanceLink, setOpeningDanceLink] = useState("")
  const [lastSongOption, setLastSongOption] = useState<"upload" | "link">("upload")
  const [lastSongFile, setLastSongFile] = useState<File | null>(null)
  const [lastSongLink, setLastSongLink] = useState("")
  const [dressCode, setDressCode] = useState("")
  const [streetName, setStreetName] = useState("")
  const [houseNumber, setHouseNumber] = useState("")
  const [houseNumberExt, setHouseNumberExt] = useState("")
  const [postalCode, setPostalCode] = useState("")
  const [city, setCity] = useState("")
  const [country, setCountry] = useState("")
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([])
  const [distanceError, setDistanceError] = useState<string | null>(null)

  // Step 3 - Personal details and payment
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [customerType, setCustomerType] = useState<"private" | "business">("private")
  const [companyName, setCompanyName] = useState("")
  const [billingStreet, setBillingStreet] = useState("")
  const [billingHouseNumber, setBillingHouseNumber] = useState("")
  const [billingPostalCode, setBillingPostalCode] = useState("")
  const [billingCity, setBillingCity] = useState("")
  const [billingCountry, setBillingCountry] = useState("Nederland")
  const [vatNumber, setVatNumber] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<{ text: string; step?: number } | null>(null)
  // The total the server calculated when it differs from the one shown; sending again confirms it.
  const [changedTotal, setChangedTotal] = useState<number | null>(null)
  const [uploadPercent, setUploadPercent] = useState<number | null>(null)
  // Files that are already stored, so a second attempt does not upload them again.
  const uploadedAudio = useRef(new Map<File, string>())
  const { data: sessionData, isPending: sessionPending } = authClient.useSession()

  useEffect(() => {
    const user = sessionData?.user
    if (!user) return
    const [first, ...rest] = user.name.split(" ")
    setFirstName((current) => current || first)
    setLastName((current) => current || rest.join(" "))
    setEmail((current) => current || user.email)
    setPhone((current) => current || user.phone || "")
    setSubmitError(null)
  }, [sessionData?.user])
  const [bookingId, setBookingId] = useState<number | null>(null)
  const equipmentRestored = useRef(false)
  const { data: savedProfile } = useSWR(
    sessionData?.user.role === "user" ? ["customer-profile", sessionData.user.id] : null,
    () => getCustomerProfile(),
  )
  const [profileApplied, setProfileApplied] = useState(false)
  useEffect(() => {
    if (!savedProfile || profileApplied) return
    const [accountFirst, ...accountRest] = (sessionData?.user.name || "").split(" ")
    setFirstName((value) => !value || value === accountFirst ? savedProfile.firstName : value)
    setLastName((value) => !value || value === accountRest.join(" ") ? savedProfile.lastName : value)
    setPhone((value) => !value || value === sessionData?.user.phone ? savedProfile.phone : value)
    setCompanyName((value) => value || savedProfile.companyName)
    setBillingStreet((value) => value || savedProfile.billingStreet)
    setBillingHouseNumber((value) => value || savedProfile.billingHouseNumber)
    setBillingPostalCode((value) => value || savedProfile.billingPostalCode)
    setBillingCity((value) => value || savedProfile.billingCity)
    setBillingCountry((value) => value === "Nederland" ? savedProfile.billingCountry || value : value)
    setVatNumber((value) => value || savedProfile.vatNumber)
    if (currentStep < 3) setCustomerType(savedProfile.customerType)
    setProfileApplied(true)
  }, [savedProfile, profileApplied, currentStep, sessionData?.user.name, sessionData?.user.phone])

  const professionalKey = artistId ?? professionalId
  const { data: blockedDates = [], mutate: reloadBlockedDates } = useSWR(
    professionalKey ? ["blocked-dates", professionalKey] : null,
    ([, id]) => getBlockedDates(id),
  )
  
  // Get artist or photographer data
  const staticArtist = artistId ? artists.find(a => a.id === Number(artistId)) : null
  const needsLiveLookup = Boolean(artistId) && !staticArtist
  const liveArtists = useLiveProfessionals("artist", needsLiveLookup)
  const liveArtist = needsLiveLookup ? liveArtists.professionals.find((a) => String(a.id) === artistId) : null
  const artist = staticArtist || liveArtist || null
  const staticPhotographer = professionalId ? photographers.find(p => p.id === Number(professionalId)) : null
  const needsPhotographerLookup = Boolean(professionalId) && !staticPhotographer
  const livePhotographers = useLiveProfessionals("photo-video", needsPhotographerLookup)
  const livePhotographer = needsPhotographerLookup ? livePhotographers.professionals.find((p) => String(p.id) === professionalId) : null
  const photographer = staticPhotographer || livePhotographer || null
  const professional = artist || photographer

  // Rates, hours, travel range, the professional's own equipment and the VAT come from the server.
  const optionsKey = professional && !isDemoProfessional(professional.id) ? ["booking-options", String(professional.id)] : null
  const { data: bookingOptions, isLoading: optionsLoading, mutate: reloadOptions } = useSWR(optionsKey, ([, id]: string[]) => getBookingOptions(id))
  useEffect(() => {
    // Artists start with their own equipment package selected; photographers have none.
    if (bookingOptions?.package && artist && !equipmentRestored.current) setSelectedEquipment((prev) => (prev.length ? prev : [PACKAGE_OPTION_ID]))
  }, [bookingOptions, artist])

  useBookingDraft(
    professionalKey,
    {
      step: currentStep, eventDate, eventLocation, distance, eventName, startTime, endTime, selectedEventTypes, selectedMusicGenres, capacity,
      description, specialRequests, playlistLink, openingDanceOption, openingDanceLink, lastSongOption, lastSongLink, dressCode,
      streetName, houseNumber, houseNumberExt, postalCode, city, country, selectedEquipment,
    },
    (saved) => {
      const text = (value: unknown) => (typeof value === "string" ? value : "")
      const list = (value: unknown) => (Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [])
      const date = /^\d{4}-\d{2}-\d{2}$/.test(text(saved.eventDate)) && text(saved.eventDate) >= todayIso() ? text(saved.eventDate) : ""
      const place = text(saved.eventLocation)
      const km = typeof saved.distance === "number" && place ? saved.distance : null
      if (!initialDate && date) {
        setEventDate(date)
        setCurrentYear(Number(date.slice(0, 4)))
        setCurrentMonth(Number(date.slice(5, 7)) - 1)
      }
      setEventLocation(place)
      setDistance(km)
      setEventName(text(saved.eventName))
      setStartTime(text(saved.startTime))
      setEndTime(text(saved.endTime))
      setSelectedEventTypes(list(saved.selectedEventTypes))
      setSelectedMusicGenres(list(saved.selectedMusicGenres))
      setCapacity(text(saved.capacity))
      setDescription(text(saved.description))
      setSpecialRequests(text(saved.specialRequests))
      setPlaylistLink(text(saved.playlistLink))
      setOpeningDanceOption(saved.openingDanceOption === "link" ? "link" : "upload")
      setOpeningDanceLink(text(saved.openingDanceLink))
      setLastSongOption(saved.lastSongOption === "link" ? "link" : "upload")
      setLastSongLink(text(saved.lastSongLink))
      setDressCode(text(saved.dressCode))
      setStreetName(text(saved.streetName))
      setHouseNumber(text(saved.houseNumber))
      setHouseNumberExt(text(saved.houseNumberExt))
      setPostalCode(text(saved.postalCode))
      setCity(text(saved.city))
      setCountry(text(saved.country))
      setSelectedEquipment(list(saved.selectedEquipment))
      equipmentRestored.current = true
      // Files and personal details are not kept, so never further than step 2.
      if (date && km !== null && Number(saved.step) >= 2) setCurrentStep(2)
    },
    currentStep === 5,
  )

  // A restored or changed start time may invalidate the saved end time.
  useEffect(() => {
    if (!bookingOptions || !startTime || !endTime) return
    if (!getEndTimeOptions(startTime, bookingOptions.minHours, bookingOptions.maxHours).includes(endTime)) {
      setEndTime("")
    }
  }, [bookingOptions, startTime, endTime])

  // The back button of the browser goes to the previous step instead of leaving the form.
  useEffect(() => {
    const onPopState = (event: PopStateEvent) => {
      const step = Number(event.state?.bookingStep ?? 1)
      setCurrentStep((current) => (current === 5 ? 5 : Math.min(Math.max(step, 1), 4)))
      setSubmitError(null)
      setChangedTotal(null)
    }
    window.addEventListener("popstate", onPopState)
    return () => window.removeEventListener("popstate", onPopState)
  }, [])

  useEffect(() => {
    if (!initialDate) return
    // Links carry the date as day-month-year; an impossible day such as 31-2 is not a date.
    const [day, month, year] = initialDate.split("-").map(Number)
    const date = new Date(year, month - 1, day)
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
      setDateNotice("invalid")
      return
    }
    const iso = toIsoDate(year, month - 1, day)
    if (iso < todayIso()) {
      setDateNotice("past")
      return
    }
    setEventDate(iso)
    setCurrentMonth(month - 1)
    setCurrentYear(year)
  }, [initialDate])

  const isBooked = (iso: string) => Boolean(professional?.unavailableDates?.includes(iso)) || blockedDates.includes(iso)
  const chosenDateIsBooked = Boolean(eventDate) && isBooked(eventDate)
  useEffect(() => {
    if (!chosenDateIsBooked) return
    setEventDate("")
    setDateNotice("booked")
  }, [chosenDateIsBooked])

  // Not in the list: the professional does not exist (any more). A failed lookup says nothing about that.
  const lookupFailed = liveArtists.failed || livePhotographers.failed
  const notFound = !professional && !lookupFailed && !liveArtists.isLoading && !livePhotographers.isLoading

  if (!professional) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="mx-auto max-w-xl px-4 py-16">
          {notFound ? (
            <div className="text-center">
              <h1 className="text-2xl font-bold text-foreground">
                {artistId || !professionalId ? tr("Deze artiest bestaat niet (meer)", "This artist no longer exists") : tr("Deze professional bestaat niet (meer)", "This professional no longer exists")}
              </h1>
              <p className="mt-3 text-muted-foreground text-pretty">
                {tr("Het profiel waarvoor je een aanvraag wilt doen is niet gevonden. Kies een andere professional uit het overzicht.", "The profile you want to book was not found. Choose another professional from the overview.")}
              </p>
              <Button asChild className="mt-6 bg-red-700 text-white hover:bg-red-600">
                <Link href={artistId || !professionalId ? "/artiesten" : "/photo-video"}>{tr("Terug naar het overzicht", "Back to the overview")}</Link>
              </Button>
            </div>
          ) : lookupFailed ? (
            <LiveListError
              onRetry={() => (liveArtists.failed ? liveArtists : livePhotographers).retry()}
              retrying={liveArtists.isRetrying || livePhotographers.isRetrying}
            />
          ) : (
            <div className="flex justify-center" role="status">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden />
              <span className="sr-only">{tr("Laden...", "Loading...")}</span>
            </div>
          )}
        </main>
      </div>
    )
  }

  // Sample profiles cannot be booked: nobody would receive the request.
  if (isDemoProfessional(professional.id)) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="mx-auto max-w-xl px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground">{tr("Voorbeeldprofiel", "Sample profile")}</h1>
          <p className="mt-3 text-muted-foreground text-pretty">
            {tr(
              `${professional.name} is een voorbeeldprofiel en kan niet geboekt worden. Kies een professional zonder dit label.`,
              `${professional.name} is a sample profile and cannot be booked. Choose a professional without this label.`,
            )}
          </p>
          <Button asChild className="mt-6 bg-red-700 text-white hover:bg-red-600">
            <Link href={artist ? "/artiesten" : "/photo-video"}>{tr("Terug naar het overzicht", "Back to the overview")}</Link>
          </Button>
        </main>
      </div>
    )
  }

  const months = [
    t.january,
    t.february,
    t.march,
    t.april,
    t.may,
    t.june,
    t.july,
    t.august,
    t.september,
    t.october,
    t.november,
    t.december,
  ]

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (month: number, year: number) => {
    const day = new Date(year, month, 1).getDay()
    return day === 0 ? 6 : day - 1
  }

  // An end time before the start time is after midnight; the same time twice is not a duration (the server refuses it too).
  const sameTime = Boolean(startTime) && startTime === endTime
  const endsNextDay = Boolean(startTime && endTime) && endTime < startTime
  const endTimeOptions = bookingOptions && startTime
    ? getEndTimeOptions(startTime, bookingOptions.minHours, bookingOptions.maxHours)
    : []
  const bookedHours = startTime && endTime ? hoursBetween(startTime, endTime) : 0
  const hoursIssue = bookingOptions && startTime && endTime && !sameTime ? hoursProblem(bookingOptions, bookedHours) : null
  const pricing = bookingOptions
    ? priceBooking(bookingOptions, {
        startTime: startTime || "20:00",
        endTime: endTime || "00:00",
        equipment: selectedEquipment,
        distanceKm: distance ?? 0,
      })
    : null

  const linkError = (value: string, id: string) =>
    isWebLink(value) ? null : (
      <p id={id} role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">
        {tr("Vul een volledige link in, die begint met https://", "Enter a full link that starts with https://")}
      </p>
    )
  // Only the links that will be sent.
  const linksOk =
    !artist ||
    (isWebLink(playlistLink) &&
      (openingDanceOption === "upload" || isWebLink(openingDanceLink)) &&
      (lastSongOption === "upload" || isWebLink(lastSongLink)))

  const required = <span aria-hidden className="text-red-600 dark:text-red-400"> *</span>
  const requiredNote = <p className="mb-4 text-xs text-muted-foreground">{tr("Velden met * zijn verplicht.", "Fields marked * are required.")}</p>
  const shownTotal = changedTotal ?? pricing?.totalCents ?? 0

  // The place of step 1 decides the travel costs, so the address of step 2 takes it over. It may be a postal code too.
  const locationIsPostcode = /\d/.test(eventLocation)
  const eventPostalCode = locationIsPostcode ? eventLocation.trim().toUpperCase() : postalCode
  const eventCity = locationIsPostcode ? city.trim() || eventLocation.trim() : eventLocation.trim()
  const copyEventAddress = () => {
    setBillingStreet(streetName)
    setBillingHouseNumber(`${houseNumber}${houseNumberExt}`)
    setBillingPostalCode(eventPostalCode)
    setBillingCity(eventCity)
    const place = country.trim().toLowerCase()
    if (place) {
      setBillingCountry(
        /^(nederland|netherlands|the netherlands|nl)$/.test(place) ? "Nederland"
          : /^(belgi[eë]|belgium|be)$/.test(place) ? "België"
            : /^(duitsland|germany|de)$/.test(place) ? "Duitsland"
              : "Anders",
      )
    }
  }

  const sideGenres = tagLabels(artist?.musicStyles, styleLabel, language === "nl")
  const sideEvents = tagLabels(professional.eventTypes, eventLabel, language === "nl")

  const goToStep = (step: number) => {
    if (step !== currentStep) window.history.pushState({ ...window.history.state, bookingStep: step }, "")
    setCurrentStep(step)
    setSubmitError(null)
    setChangedTotal(null)
  }

  // What still blocks the "continue" button of each step, so a grey button never goes unexplained.
  const missingStep1 = [
    !eventDate && tr("een datum in de kalender", "a date in the calendar"),
    !eventLocation.trim() && tr("de plaats van je evenement", "the place of your event"),
    eventLocation.trim() && distance === null && tr("de afstand (klik op de knop naast de plaats)", "the distance (click the button next to the place)"),
  ].filter(Boolean) as string[]
  const missingStep2 = [
    !eventDate && tr("een datum (stap 1)", "a date (step 1)"),
    (!eventName || eventName.length < 3) && tr("een naam voor je evenement (minimaal 3 tekens)", "a name for your event (at least 3 characters)"),
    (!startTime || !endTime) && tr("een start- en eindtijd", "a start and end time"),
    !linksOk && tr("een geldige muzieklink", "a valid music link"),
  ].filter(Boolean) as string[]
  const missingStep3 = [
    !firstName.trim() && tr("voornaam", "first name"),
    !lastName.trim() && tr("achternaam", "last name"),
    !isEmail(email) && tr("geldig e-mailadres", "valid email address"),
    !isPhone(phone) && tr("telefoonnummer (minimaal 6 cijfers)", "phone number (at least 6 digits)"),
    !billingStreet.trim() && tr("straat", "street"),
    !billingHouseNumber.trim() && tr("huisnummer", "house number"),
    !billingPostalCode.trim() && tr("postcode", "postal code"),
    !billingCity.trim() && tr("plaats", "city"),
    customerType === "business" && !companyName.trim() && tr("bedrijfsnaam", "company name"),
    customerType === "business" && !vatNumber.trim() && tr("btw-nummer", "VAT number"),
  ].filter(Boolean) as string[]
  const changeInStep1 = (label: string) => (
    <button
      type="button"
      onClick={() => goToStep(1)}
      aria-label={label}
      className="shrink-0 rounded text-sm font-medium text-red-600 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-red-600 dark:text-red-400"
    >
      {tr("Wijzig", "Change")}
    </button>
  )
  const missingHint = (items: string[]) =>
    items.length > 0 ? (
      <p className="mt-2 text-sm text-muted-foreground" aria-live="polite">
        {tr("Nog nodig", "Still needed")}: {items.join(", ")}
      </p>
    ) : null

  const uploadAudio = async (file: File | null, customerId: string) => {
    if (!file) return ""
    const known = uploadedAudio.current.get(file)
    if (known) return known
    setUploadPercent(0)
    const { pathname } = await uploadPresigned(newAudioPath(customerId, file.name), file, {
      access: "private",
      contentType: audioContentType(file.name) ?? undefined,
      handleUploadUrl: "/api/booking-audio",
      onUploadProgress: ({ percentage }) => setUploadPercent(Math.round(percentage)),
    })
    uploadedAudio.current.set(file, pathname)
    return pathname
  }

  const handleSubmitBooking = async () => {
    if (!pricing) return
    if (!sessionData?.user) {
      setSubmitError(bookingErrorMessage("UNAUTHORIZED", language === "nl"))
      window.scrollTo({ top: 0, behavior: "smooth" })
      return
    }
    setSubmitting(true)
    setSubmitError(null)
    let openingDanceUpload = ""
    let lastSongUpload = ""
    try {
      if (openingDanceOption === "upload") openingDanceUpload = await uploadAudio(openingDanceFile, sessionData.user.id)
      if (lastSongOption === "upload") lastSongUpload = await uploadAudio(lastSongFile, sessionData.user.id)
    } catch (error) {
      console.error("Booking audio upload failed:", error)
      setSubmitError({
        text: tr(
          "Het uploaden van je muziek is niet gelukt, dus je aanvraag is nog niet verstuurd. Probeer het opnieuw, kies een ander bestand of gebruik een link.",
          "Uploading your music failed, so your request has not been sent yet. Try again, choose another file or use a link.",
        ),
        step: 2,
      })
      setSubmitting(false)
      return
    } finally {
      setUploadPercent(null)
    }
    try {
      const input: CreateBookingInput & { expectedTotalCents: number } = {
        professionalId: String(professional.id),
        professionalName: professional.name,
        professionalType: artist ? "artist" : "photographer",
        professionalPrice: professional.price,
        eventName,
        eventDate,
        startTime: startTime || "20:00",
        endTime: endTime || "00:00",
        eventTypes: selectedEventTypes,
        // Bookings store genres by their English name, which is also how the dashboards show them.
        musicGenres: selectedMusicGenres.map((value) => genreLabel(value, false)),
        capacity,
        description,
        specialRequests,
        dressCode,
        playlistLink,
        openingDanceLink: openingDanceOption === "link" ? openingDanceLink : "",
        openingDanceFileName: openingDanceUpload,
        lastSongLink: lastSongOption === "link" ? lastSongLink : "",
        lastSongFileName: lastSongUpload,
        street: streetName,
        houseNumber,
        houseNumberExt,
        postalCode: eventPostalCode,
        city: eventCity,
        country,
        distanceKm: distance ?? 0,
        eventLocation,
        equipment: selectedEquipment,
        firstName,
        lastName,
        email,
        phone,
        customerType,
        companyName,
        billingStreet,
        billingHouseNumber,
        billingPostalCode,
        billingCity,
        billingCountry,
        vatNumber,
        paymentMethod: "invoice",
        expectedTotalCents: changedTotal ?? pricing.totalCents,
      }
      const result = readBookingResult(await createBooking(input))
      if (!result.ok) trackUserTest("booking_error", { code: result.error, field: result.field ?? null })
      if (result.ok) {
        reachUserTestGoal("booking_request_sent")
        setBookingId(result.id)
        goToStep(5)
      } else if (result.error === "PRICE_CHANGED" && result.totalCents !== undefined) {
        setChangedTotal(result.totalCents)
        void reloadOptions()
      } else {
        if (result.error === "DATE_TAKEN") {
          setEventDate("")
          setDateNotice("booked")
          void reloadBlockedDates()
        }
        // An upload can be used for a day; after that the files have to be uploaded again.
        const audioSent = Boolean(openingDanceUpload || lastSongUpload)
        if (result.error === "INVALID_DETAILS") uploadedAudio.current.clear()
        setSubmitError(bookingErrorMessage(result.error, language === "nl", { field: result.field, audioSent }))
      }
    } catch (error) {
      console.error("Booking submit failed:", error)
      setSubmitError(bookingErrorMessage("RETRY", language === "nl"))
    } finally {
      setSubmitting(false)
    }
  }

  const isDateInPast = (day: number) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const checkDate = new Date(currentYear, currentMonth, day)
    return checkDate < today
  }

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear)
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear)
    const days = []

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="aspect-square" />)
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const iso = toIsoDate(currentYear, currentMonth, day)
      const unavailable = isBooked(iso)
      const isSelected = eventDate === iso
      const isPast = isDateInPast(day)

      let dayClasses = "aspect-square w-full text-sm rounded-md flex items-center justify-center transition-colors "

      if (isPast) {
        dayClasses += "cursor-not-allowed bg-muted/40 text-muted-foreground/60 line-through"
      } else if (unavailable) {
        dayClasses += "bg-red-600 dark:bg-red-500 text-white font-medium cursor-not-allowed"
      } else if (isSelected) {
        dayClasses += "bg-green-600 dark:bg-green-500 text-white font-medium ring-2 ring-green-400 dark:ring-green-300"
      } else {
        dayClasses += "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600 cursor-pointer bg-zinc-200 dark:bg-zinc-700"
      }

      days.push(
        <button
          key={day}
          type="button"
          onClick={() => {
            setEventDate(isSelected ? "" : iso)
            setDateNotice(null)
          }}
          aria-pressed={isSelected}
          aria-label={`${new Date(currentYear, currentMonth, day).toLocaleDateString(dateLocale, { weekday: "long", day: "numeric", month: "long" })}${isPast ? ` (${tr("voorbij", "past")})` : unavailable ? ` (${tr("niet beschikbaar", "not available")})` : ""}`}
          disabled={unavailable || isPast}
          className={dayClasses}
        >
          {day}
        </button>
      )
    }

    return days
  }

  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  // The server calculates the distance, the same way it does when the booking is sent.
  const calculateDistance = async () => {
    if (!eventLocation.trim()) return
    setCalculating(true)
    setDistance(null)
    setDistanceError(null)
    try {
      const result = await calculateBookingDistance(String(professional.id), eventLocation.trim())
      if (result.ok) setDistance(result.distanceKm)
      else
        setDistanceError(
          result.error === "OUT_OF_RANGE"
            ? tr(`Deze locatie ligt buiten het werkgebied van ${professional.name} (maximaal ${result.rangeKm} km).`, `This location is outside ${professional.name}'s travel range (up to ${result.rangeKm} km).`)
            : result.error === "TOO_MANY"
              ? tr("Je hebt de afstand vaak berekend. Probeer het over een paar minuten opnieuw.", "You calculated the distance many times. Try again in a few minutes.")
              : result.error === "UNAUTHORIZED"
                ? tr("Log in om de afstand te berekenen.", "Log in to calculate the distance.")
                : t.locationNotFound,
        )
    } catch (error) {
      console.error("Distance calculation failed:", error)
      setDistanceError(t.distanceCalculationError)
    } finally {
      setCalculating(false)
    }
  }

  const formatSelectedDate = () => {
    return eventDate ? formatEventDate(eventDate, dateLocale) : tr("Niet gekozen", "Not selected")
  }

  const professionalImage = professional.image || `/placeholder.svg?height=400&width=400&query=${encodeURIComponent(professional.name)}`

  // Booking requires an account: show a login prompt instead of the flow.
  if (!sessionData?.user) {
    return (
      <div className="min-h-screen bg-background transition-colors">
        <Header />
        <div className="max-w-xl mx-auto px-3 sm:px-4 py-10 sm:py-16">
          {sessionPending ? (
            <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="bg-card rounded-lg shadow border border-border p-6 sm:p-8 text-center">
              <LockKeyhole className="mx-auto h-10 w-10 text-red-500" />
              <h1 className="mt-4 text-xl sm:text-2xl font-bold text-foreground">
                {tr("Log in om te boeken", "Log in to book")}
              </h1>
              <p className="mt-3 text-sm text-muted-foreground">
                {tr(
                  `Om ${professional.name} te boeken heb je een account nodig. Log in of maak een account aan, daarna ga je direct verder met je aanvraag.`,
                  `You need an account to book ${professional.name}. Log in or create an account and continue with your request right away.`,
                )}
              </p>
              <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={() => window.dispatchEvent(new Event("arsi:open-login"))} className="bg-red-700 hover:bg-red-600 text-white px-8">
                  {tr("Inloggen", "Log in")}
                </Button>
                <Button onClick={() => window.dispatchEvent(new Event("arsi:open-signup"))} className="bg-accent text-foreground hover:bg-muted px-8">
                  {tr("Account aanmaken", "Create account")}
                </Button>
              </div>
              <PaymentMoments className="mt-6 rounded-md border border-border bg-muted/40 p-3" />
            </div>
          )}
        </div>
      </div>
    )
  }

  // Only organiser accounts can send a request; the server refuses other roles as well.
  if (sessionData.user.role !== "user") {
    return (
      <div className="min-h-screen bg-background transition-colors">
        <Header />
        <div className="max-w-xl mx-auto px-3 sm:px-4 py-10 sm:py-16">
          <div className="bg-card rounded-lg shadow border border-border p-6 sm:p-8 text-center">
            <LockKeyhole className="mx-auto h-10 w-10 text-red-500" />
            <h1 className="mt-4 text-xl sm:text-2xl font-bold text-foreground">
              {tr("Boeken kan alleen met een organisatoraccount", "Booking needs an organiser account")}
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              {tr(
                `Je bent ingelogd met een account voor professionals of beheer. Wil je ${professional.name} boeken, log dan in met een organisatoraccount.`,
                `You are logged in with a professional or admin account. To book ${professional.name}, log in with an organiser account.`,
              )}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background transition-colors">
      <Header />
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Progress Steps: finished steps lead back, the current one is marked for screen readers too */}
        <nav aria-label={tr("Stappen", "Steps")} className="mb-4 sm:mb-8 bg-card rounded-lg p-3 sm:p-6 shadow border border-border">
          <ol className="mx-auto flex max-w-4xl items-start">
            {steps.map((step, index) => {
              const current = currentStep === step.number
              const done = currentStep > step.number
              // Nothing can be changed any more once the request has been sent.
              const canReturn = done && currentStep < 5 && !submitting
              const circle = `w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm sm:text-base font-bold transition-colors ${
                current ? "bg-red-700 text-white" : done ? "bg-green-700 text-white" : "bg-gray-300 text-gray-800 dark:bg-gray-600 dark:text-white"
              }`
              const content = (
                <>
                  <span className={circle}>{done ? <Check className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden /> : step.number}</span>
                  {/* On a phone only the circles fit; the line below them names the current step. */}
                  <span className={`sr-only text-center text-xs leading-tight text-foreground sm:not-sr-only sm:mt-2 sm:max-w-24 ${current ? "font-bold" : "font-medium"}`}>{step.label}</span>
                  {done && <span className="sr-only">({tr("afgerond", "completed")})</span>}
                </>
              )
              return (
                <li key={step.number} aria-current={current ? "step" : undefined} className={`flex min-w-0 items-start ${index < steps.length - 1 ? "flex-1" : ""}`}>
                  {canReturn ? (
                    <button type="button" onClick={() => goToStep(step.number)} className="flex flex-col items-center rounded-md p-1.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600">
                      {content}
                    </button>
                  ) : (
                    <div className="flex flex-col items-center p-1.5">{content}</div>
                  )}
                  {index < steps.length - 1 && (
                    <div aria-hidden className={`mt-[21px] h-0.5 min-w-2 flex-1 sm:mx-1 sm:mt-[25px] ${done ? "bg-green-700" : "bg-border"}`} />
                  )}
                </li>
              )
            })}
          </ol>
          <p aria-hidden className="mt-1 text-center text-sm text-muted-foreground sm:hidden">
            {tr("Stap", "Step")} {currentStep} {tr("van", "of")} {steps.length}:{" "}
            <span className="font-semibold text-foreground">{steps[currentStep - 1]?.label}</span>
          </p>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-4 sm:gap-6">
          {/* Left Column - Professional Card */}
          {/* Below lg one compact row, so the form itself starts at the top of the screen. */}
          <div className="bg-card rounded-lg shadow border border-border overflow-hidden lg:sticky lg:top-4 lg:self-start">
            <div className="relative hidden h-48 lg:block bg-gradient-to-br from-red-600 to-red-800">
              <img 
                src={professional.banner || professionalImage} 
                alt={`${professional.name} header`} 
                className="w-full h-full object-cover object-[50%_25%]" 
              />
            </div>
            
            <div className="relative p-3 sm:p-4 lg:-mt-16 lg:p-6">
              <div className="flex items-center gap-3 lg:block">
              <div className="size-14 shrink-0 rounded-full bg-card overflow-hidden lg:mx-auto lg:mb-4 lg:size-24 lg:border-4 lg:border-card">
                <img 
                  src={professional.avatar || professionalImage} 
                  alt={professional.name} 
                  className="w-full h-full object-cover object-[50%_25%]" 
                />
              </div>
              
              <div className="min-w-0 flex-1">
                <h2 className="text-base lg:text-xl font-bold lg:text-center text-foreground lg:mb-1 break-words">{professional.name}</h2>
                <div className="flex items-center lg:justify-center gap-1.5 text-sm text-muted-foreground lg:mb-4">
                  <MapPin className="w-3.5 h-3.5 shrink-0" aria-hidden />
                  <span>{professional.location}</span>
                </div>
              </div>
              <p className="shrink-0 text-right text-sm font-bold text-foreground lg:hidden">
                {professional.price} {t.perHour}
                <span className="block text-xs font-normal text-muted-foreground">{t.exVat}</span>
              </p>
              </div>

              <div className="hidden lg:block">
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{bookingOptions ? `${bookingOptions.minHours} - ${bookingOptions.maxHours} ${tr("uur", "hrs")}` : tr("1 - 8 uur", "1 - 8 hrs")}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-foreground">
                      {professional.price} {t.perHour}
                    </span>
                    <span className="text-xs text-muted-foreground ml-1">({t.exVat})</span>
                  </div>
                </div>
                
                {(bookingOptions?.package || (!bookingOptions && artist?.equipmentPrice)) && (
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Speaker className="w-3.5 h-3.5" />
                      <span>{t.apparatus}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-foreground">
                        {bookingOptions?.package ? formatEuro(bookingOptions.package.priceCents) : artist?.equipmentPrice} {t.perDay}
                      </span>
                      <span className="text-xs text-muted-foreground ml-1">({t.exVat})</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Music Genres */}
              {sideGenres.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-medium text-muted-foreground mb-2">{t.musicGenresLabel}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {sideGenres.slice(0, 2).map((genre) => (
                      <span
                        key={genre}
                        className="px-2.5 py-0.5 bg-muted text-muted-foreground text-xs rounded-md"
                      >
                        {genre}
                      </span>
                    ))}
                    {sideGenres.length > 2 && (
                      <span className="px-2.5 py-0.5 bg-muted text-muted-foreground text-xs rounded-md">
                        +{sideGenres.length - 2}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Event Types */}
              {sideEvents.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">{t.eventTypesLabel}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {sideEvents.slice(0, 2).map((event) => (
                      <span
                        key={event}
                        className="px-2.5 py-0.5 bg-muted text-muted-foreground text-xs rounded-md"
                      >
                        {event}
                      </span>
                    ))}
                    {sideEvents.length > 2 && (
                      <span className="px-2.5 py-0.5 bg-muted text-muted-foreground text-xs rounded-md">
                        +{sideEvents.length - 2}
                      </span>
                    )}
                  </div>
                </div>
              )}
              </div>
            </div>
          </div>

          {/* Right Column - Content Based on Step */}
          {currentStep === 1 && (
            <div className="space-y-4 sm:space-y-6">
              <div className="bg-card rounded-lg shadow border border-border p-4 sm:p-6">
                <h2 ref={stepHeading} tabIndex={-1} className="scroll-mt-4 outline-none text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-foreground">{t.selectDateLocation}</h2>
                
                <div className="mx-auto max-w-lg">
                  {/* Calendar: booked and blocked days only show as not available, never as events */}
                  <div>
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <button
                        type="button"
                        onClick={goToPreviousMonth}
                        aria-label={tr("Vorige maand", "Previous month")}
                        className="p-1.5 sm:p-2 hover:bg-muted rounded-lg transition-colors touch-manipulation"
                      >
                        <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-foreground" />
                      </button>
                      <div className="text-sm sm:text-base font-semibold text-foreground">
                        {months[currentMonth]} {currentYear}
                      </div>
                      <button
                        type="button"
                        onClick={goToNextMonth}
                        aria-label={tr("Volgende maand", "Next month")}
                        className="p-1.5 sm:p-2 hover:bg-muted rounded-lg transition-colors touch-manipulation"
                      >
                        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-foreground" />
                      </button>
                    </div>

                    <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-2">
                      {(language === "nl" ? ["ma", "di", "wo", "do", "vr", "za", "zo"] : ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"]).map((day, index) => (
                        <div
                          key={index}
                          className="text-center text-xs font-semibold text-muted-foreground h-6 sm:h-8 flex items-center justify-center"
                        >
                          {day}
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-7 gap-0.5 sm:gap-1">{renderCalendar()}</div>

                    <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground" aria-label={tr("Legenda", "Legend")}>
                      <li className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-zinc-200 dark:bg-zinc-700" aria-hidden />{tr("Beschikbaar", "Available")}</li>
                      <li className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-green-600 dark:bg-green-500" aria-hidden />{tr("Gekozen", "Selected")}</li>
                      <li className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-red-600 dark:bg-red-500" aria-hidden />{tr("Niet beschikbaar", "Not available")}</li>
                      <li className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm border border-border bg-muted/40" aria-hidden />{tr("Voorbij", "Past")}</li>
                    </ul>

                    <div className="mt-4 p-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium text-muted-foreground">{t.selectedDateLabel}</p>
                      <p className="text-sm text-foreground font-semibold">{formatSelectedDate()}</p>
                      {dateNotice && !eventDate && (
                        <p role="alert" className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {dateNotice === "past"
                            ? tr("De gekozen datum is al voorbij. Kies een andere datum.", "The chosen date has passed. Choose another date.")
                            : dateNotice === "booked"
                              ? tr("De gekozen datum is niet beschikbaar. Kies een andere datum.", "The chosen date is not available. Choose another date.")
                              : tr("De datum uit de link bestaat niet. Kies een datum in de kalender.", "The date in the link does not exist. Choose a date in the calendar.")}
                        </p>
                      )}
                    </div>
                  </div>

                </div>
              </div>

              {/* Event Location */}
              <div className="bg-card rounded-lg shadow border border-border p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-foreground">{t.eventLocationLabel}</h3>
                
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <input
                    type="text"
                    value={eventLocation}
                    onChange={(e) => {
                      setEventLocation(placeChars(e.target.value))
                      // The distance belongs to the previous place.
                      setDistance(null)
                      setDistanceError(null)
                    }}
                    onKeyDown={(e) => {
                      // Enter does the same as the "Check distance" button.
                      if (e.key !== "Enter") return
                      e.preventDefault()
                      if (eventLocation.trim() && !calculating) calculateDistance()
                    }}
                    enterKeyHint="search"
                    aria-label={t.eventLocationLabel}
                    autoComplete="address-level2"
                    maxLength={120}
                    placeholder={t.enterCityName}
                    className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-border rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent bg-background text-foreground"
                  />
                  <Button
                    onClick={calculateDistance}
                    disabled={!eventLocation.trim() || calculating}
                    className="bg-red-700 hover:bg-red-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base whitespace-nowrap"
                  >
                    {calculating ? t.calculating : t.checkDistance}
                  </Button>
                </div>

                {distanceError && (
                  <p role="alert" className="mt-3 text-sm text-red-700 dark:text-red-400">{distanceError}</p>
                )}
                {distance !== null && (
                  <div className="mt-4 p-4 bg-muted border border-border rounded-lg">
                    <p className="text-sm font-medium text-foreground">
                      {t.distanceFromTo} {professional.location} {tr("naar", "to")} {eventLocation}:
                    </p>
                    <p className="mt-1 text-2xl font-bold text-foreground">{distance} km</p>
                    <p className="text-xs text-foreground mt-2">
                      {t.estimatedTravelCost} {formatEuro(travelCents(distance))} {tr("excl. btw", "excl. VAT")} ({tr("retour", "round trip")}: {distance * 2} km)
                    </p>
                  </div>
                )}
              </div>
              
              {/* Continue Button */}
              <div className="mt-6">
                <Button
                  onClick={() => goToStep(2)}
                  disabled={!eventDate || !eventLocation.trim() || distance === null}
                  className="w-full py-3 text-base font-semibold bg-red-700 hover:bg-red-600 text-white disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed"
                >
                  {tr("Naar evenementdetails", "Continue to Event Details")}
                </Button>
                {missingHint(missingStep1)}
              </div>
            </div>
          )}
          
          {/* Step 2 - Event Details */}
          {currentStep === 2 && (
            <div className="space-y-4 sm:space-y-6">
              <div className="bg-card rounded-lg shadow border border-border p-4 sm:p-6">
                <h2 ref={stepHeading} tabIndex={-1} className="scroll-mt-4 outline-none text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-foreground">{tr("Evenementdetails", "Event Details")}</h2>
                
                {requiredNote}
                {/* Event Name */}
                <div className="mb-4">
                  <label htmlFor="booking-event-name" className="block text-sm font-medium text-foreground mb-2">{tr("Naam van het evenement", "Event Name")}{required}</label>
                  <input
                    id="booking-event-name"
                      aria-required="true"
                    maxLength={300}
                    type="text"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    placeholder={tr("Naam van je evenement", "Enter event name")}
                    className="w-full px-3 sm:px-4 py-2.5 text-sm sm:text-base border border-border rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent bg-background text-foreground"
                  />
                  {eventName.length < 3 && eventName.length > 0 && (
                    <p className="mt-1 text-xs text-red-700 dark:text-red-400">{tr("De naam moet minimaal 3 tekens hebben.", "The name must be at least 3 characters.")}</p>
                  )}
                </div>
                
                {/* Date and Times */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4">
                  <div>
                    <span className="block text-sm font-medium text-foreground mb-2">{tr("Datum", "Event Date")}</span>
                    <div className="flex min-h-11 items-center justify-between gap-2 rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground">
                      <span>{eventDate ? formatEventDate(eventDate, dateLocale, "short") : tr("Niet gekozen", "Not selected")}</span>
                      {changeInStep1(tr("Datum wijzigen", "Change date"))}
                    </div>
                  </div>
                  <div>
                    <label htmlFor="booking-start" className="block text-sm font-medium text-foreground mb-2">{tr("Starttijd", "Start Time")}{required}</label>
                    <select
                      id="booking-start"
                      aria-required="true"
                      value={startTime}
                      onChange={(e) => {
                        const nextStartTime = e.target.value
                        setStartTime(nextStartTime)
                        if (endTime && bookingOptions && !getEndTimeOptions(nextStartTime, bookingOptions.minHours, bookingOptions.maxHours).includes(endTime)) {
                          setEndTime("")
                        }
                      }}
                      className="w-full px-3 sm:px-4 py-2.5 text-sm sm:text-base border border-border rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent bg-background text-foreground"
                    >
                      <option value="">{tr("Kies", "Select")}</option>
                      {TIME_OPTIONS.map((time) => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="booking-end" className="block text-sm font-medium text-foreground mb-2">{tr("Eindtijd", "End Time")}{required}</label>
                    <select
                      id="booking-end"
                      aria-required="true"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      disabled={!startTime || !bookingOptions}
                      className="w-full px-3 sm:px-4 py-2.5 text-sm sm:text-base border border-border rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent bg-background text-foreground"
                    >
                      <option value="">{tr("Kies", "Select")}</option>
                      {endTimeOptions.map((time) => (
                        <option key={time} value={time}>
                          {time}{timeToMinutes(time) <= timeToMinutes(startTime) ? tr(" (volgende dag)", " (next day)") : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                {startTime && endTime && !sameTime && (
                  <p className="-mt-2 mb-4 text-sm text-muted-foreground" aria-live="polite">
                    {tr("Duur", "Duration")}: {bookedHours.toLocaleString(dateLocale)} {tr("uur", bookedHours === 1 ? "hour" : "hours")}
                    {endsNextDay && tr(" (eindigt na middernacht)", " (ends after midnight)")}
                  </p>
                )}
                {sameTime && (
                  <p role="alert" className="-mt-2 mb-4 text-sm text-red-700 dark:text-red-400">
                    {tr("De start- en eindtijd zijn gelijk. Kies een andere eindtijd.", "The start and end time are the same. Choose another end time.")}
                  </p>
                )}
                {hoursIssue && bookingOptions && (
                  <p role="alert" className="-mt-2 mb-4 text-sm text-red-700 dark:text-red-400">
                    {hoursIssue === "min"
                      ? tr(`${professional.name} ${artist ? "speelt" : "werkt"} minimaal ${bookingOptions.minHours} uur. Kies een latere eindtijd.`, `${professional.name} ${artist ? "plays" : "works"} at least ${bookingOptions.minHours} ${bookingOptions.minHours === 1 ? "hour" : "hours"}. Choose a later end time.`)
                      : tr(`${professional.name} ${artist ? "speelt" : "werkt"} maximaal ${bookingOptions.maxHours} uur. Kies een eerdere eindtijd.`, `${professional.name} ${artist ? "plays" : "works"} at most ${bookingOptions.maxHours} ${bookingOptions.maxHours === 1 ? "hour" : "hours"}. Choose an earlier end time.`)}
                  </p>
                )}

                {/* Event Types and Music Genres */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
                  <div>
                    <span id="booking-event-types-label" className="block text-sm font-medium text-foreground mb-2">{tr("Type evenement", "Event type")}</span>
                    <ComboSelect
                      id="booking-event-types"
                      labelledBy="booking-event-types-label"
                      multiple
                      nl={language === "nl"}
                      value={selectedEventTypes}
                      onChange={setSelectedEventTypes}
                      placeholder={tr("Kies een type evenement", "Choose an event type")}
                      searchPlaceholder={tr("Zoek een type evenement...", "Search an event type...")}
                      groups={comboGroups(EVENT_TYPE_GROUPS, language === "nl")}
                    />
                  </div>
                  <div>
                    <label htmlFor="booking-guests" className="block text-sm font-medium text-foreground mb-2">{tr("Aantal gasten", "Capacity")}</label>
                    <input
                      id="booking-guests"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={capacity}
                      onChange={(e) => setCapacity(digitsOnly(e.target.value))}
                      placeholder={tr("Verwacht aantal gasten", "Expected number of guests")}
                      className="w-full px-3 sm:px-4 py-2.5 text-sm sm:text-base border border-border rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent bg-background text-foreground"
                    />
                  </div>
                </div>
                
                {/* Music Genres: artists only */}
                {artist && (
                <div className="mb-4">
                  <span id="booking-genres-label" className="block text-sm font-medium text-foreground mb-2">{tr("Muziekgenres", "Music genres")}</span>
                  <ComboSelect
                    id="booking-genres"
                    labelledBy="booking-genres-label"
                    multiple
                    nl={language === "nl"}
                    value={selectedMusicGenres}
                    onChange={setSelectedMusicGenres}
                    placeholder={tr("Kies muziekgenres", "Choose music genres")}
                    searchPlaceholder={tr("Zoek een genre...", "Search a genre...")}
                    groups={comboGroups(GENRE_GROUPS, language === "nl")}
                  />
                </div>
                )}

                {/* Description */}
                <div className="mb-4">
                  <label htmlFor="booking-description" className="block text-sm font-medium text-foreground mb-2">{tr("Omschrijving", "Description")}</label>
                  <textarea
                    id="booking-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={tr("Beschrijf je evenement...", "Describe your event...")}
                    rows={4}
                    maxLength={5000}
                    className="w-full px-3 sm:px-4 py-2.5 text-sm sm:text-base border border-border rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent bg-background text-foreground resize-none"
                  />
                  <p className="text-xs text-muted-foreground mt-1">{description.length}/5000 {tr("tekens", "characters")}</p>
                </div>
                
                {/* Special Requests */}
                <div className="mb-4">
                  <label htmlFor="booking-requests" className="block text-sm font-medium text-foreground mb-2">{tr("Speciale wensen", "Special Requests")}</label>
                  <textarea
                    id="booking-requests"
                    maxLength={5000}
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    placeholder={tr("Speciale wensen of eisen...", "Any special requests or requirements...")}
                    rows={3}
                    className="w-full px-3 sm:px-4 py-2.5 text-sm sm:text-base border border-border rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent bg-background text-foreground resize-none"
                  />
                  <p className="text-xs text-muted-foreground mt-1">{specialRequests.length}/5000 {tr("tekens", "characters")}</p>
                </div>
                
                {/* Music and dress code: artists only */}
                {artist && (
                <>
                {/* Playlist Link */}
                <div className="mb-4">
                  <label htmlFor="booking-playlist" className="block text-sm font-medium text-foreground mb-2">{tr("Link naar playlist of nummer (optioneel)", "Link to a playlist or song (optional)")}</label>
                  <input
                    id="booking-playlist"
                    type="url"
                    maxLength={300}
                    value={playlistLink}
                    onChange={(e) => setPlaylistLink(e.target.value)}
                    placeholder="https://..."
                    aria-invalid={!isWebLink(playlistLink)}
                    aria-describedby="booking-playlist-error booking-playlist-hint"
                    className="w-full px-3 sm:px-4 py-2.5 text-sm sm:text-base border border-border rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent bg-background text-foreground"
                  />
                  {linkError(playlistLink, "booking-playlist-error")}
                  <p id="booking-playlist-hint" className="mt-1 text-xs text-muted-foreground">
                    {tr("Losse nummers? Zet ze bij speciale wensen.", "Separate songs? List them under special requests.")}
                  </p>
                </div>

                {/* Opening Dance Music */}
                <div className="mb-4">
                  <span id="booking-opening-label" className="block text-sm font-medium text-foreground mb-2">{tr("Muziek voor de openingsdans", "Opening Dance Music")}</span>
                  <div role="radiogroup" aria-labelledby="booking-opening-label" className="flex flex-wrap gap-x-4 gap-y-2 mb-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="booking-opening-option"
                        checked={openingDanceOption === "upload"}
                        onChange={() => setOpeningDanceOption("upload")}
                        className="w-4 h-4 text-red-600 focus:ring-2 focus:ring-red-600"
                      />
                      <span className="text-sm text-foreground">{tr("Bestand uploaden", "Upload File")}</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="booking-opening-option"
                        checked={openingDanceOption === "link"}
                        onChange={() => setOpeningDanceOption("link")}
                        className="w-4 h-4 text-red-600 focus:ring-2 focus:ring-red-600"
                      />
                      <span className="text-sm text-foreground">{tr("Link toevoegen", "Add Link")}</span>
                    </label>
                  </div>
                  {openingDanceOption === "upload" ? (
                    <AudioUpload label={tr("Muziek voor de openingsdans", "Opening Dance Music")} file={openingDanceFile} onChange={setOpeningDanceFile} />
                  ) : (
                    <>
                    <input
                      type="url"
                      maxLength={300}
                      aria-labelledby="booking-opening-label"
                      aria-invalid={!isWebLink(openingDanceLink)}
                      aria-describedby="booking-opening-error"
                      value={openingDanceLink}
                      onChange={(e) => setOpeningDanceLink(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3 sm:px-4 py-2.5 text-sm sm:text-base border border-border rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent bg-background text-foreground"
                    />
                    {linkError(openingDanceLink, "booking-opening-error")}
                    </>
                  )}
                </div>
                
                {/* Last Song Music */}
                <div className="mb-4">
                  <span id="booking-last-song-label" className="block text-sm font-medium text-foreground mb-2">{tr("Muziek voor het laatste nummer", "Last Song Music")}</span>
                  <div role="radiogroup" aria-labelledby="booking-last-song-label" className="flex flex-wrap gap-x-4 gap-y-2 mb-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="booking-last-song-option"
                        checked={lastSongOption === "upload"}
                        onChange={() => setLastSongOption("upload")}
                        className="w-4 h-4 text-red-600 focus:ring-2 focus:ring-red-600"
                      />
                      <span className="text-sm text-foreground">{tr("Bestand uploaden", "Upload File")}</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="booking-last-song-option"
                        checked={lastSongOption === "link"}
                        onChange={() => setLastSongOption("link")}
                        className="w-4 h-4 text-red-600 focus:ring-2 focus:ring-red-600"
                      />
                      <span className="text-sm text-foreground">{tr("Link toevoegen", "Add Link")}</span>
                    </label>
                  </div>
                  {lastSongOption === "upload" ? (
                    <AudioUpload label={tr("Muziek voor het laatste nummer", "Last Song Music")} file={lastSongFile} onChange={setLastSongFile} />
                  ) : (
                    <>
                    <input
                      type="url"
                      maxLength={300}
                      aria-labelledby="booking-last-song-label"
                      aria-invalid={!isWebLink(lastSongLink)}
                      aria-describedby="booking-last-song-error"
                      value={lastSongLink}
                      onChange={(e) => setLastSongLink(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3 sm:px-4 py-2.5 text-sm sm:text-base border border-border rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent bg-background text-foreground"
                    />
                    {linkError(lastSongLink, "booking-last-song-error")}
                    </>
                  )}
                </div>
                
                {/* Dress code preference */}
                <div className="mb-4">
                  <label htmlFor="booking-dresscode" className="block text-sm font-medium text-foreground mb-2">{tr("Gewenste dresscode (bijv. formeel of thema)", "Dress code preference (e.g. formal or theme)")}</label>
                  <input
                    id="booking-dresscode"
                    maxLength={300}
                    type="text"
                    value={dressCode}
                    onChange={(e) => setDressCode(e.target.value)}
                    placeholder={tr("bijv. formeel, casual, thema", "e.g. Formal, Casual, Theme-based")}
                    className="w-full px-3 sm:px-4 py-2.5 text-sm sm:text-base border border-border rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent bg-background text-foreground"
                  />
                </div>
                
                </>
                )}

                {/* Event Venue Address */}
                <div className="border-t border-border pt-4">
                  <h3 className="text-lg font-semibold text-foreground mb-3">{tr("Adres van de locatie", "Event Venue Address")}</h3>
                  
                  <div className="space-y-3">
                    <div>
                      <label htmlFor="booking-street" className="block text-sm font-medium text-foreground mb-2">{tr("Straat", "Street Name")}</label>
                      <input
                        id="booking-street"
                        maxLength={300}
                        type="text"
                        value={streetName}
                        onChange={(e) => setStreetName(e.target.value)}
                        className="w-full px-3 sm:px-4 py-2.5 text-sm sm:text-base border border-border rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent bg-background text-foreground"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="booking-house-number" className="block text-sm font-medium text-foreground mb-2">{tr("Huisnummer", "House Number")}</label>
                        <input
                          id="booking-house-number"
                          maxLength={20}
                          type="text"
                          value={houseNumber}
                          onChange={(e) => setHouseNumber(digitsOnly(e.target.value))}
                          className="w-full px-3 sm:px-4 py-2.5 text-sm sm:text-base border border-border rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent bg-background text-foreground"
                        />
                      </div>
                      <div>
                        <label htmlFor="booking-house-ext" className="block text-sm font-medium text-foreground mb-2">{tr("Toevoeging", "House Number Extension")}</label>
                        <input
                          id="booking-house-ext"
                          maxLength={20}
                          type="text"
                          value={houseNumberExt}
                          onChange={(e) => setHouseNumberExt(e.target.value)}
                          className="w-full px-3 sm:px-4 py-2.5 text-sm sm:text-base border border-border rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent bg-background text-foreground"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label htmlFor={locationIsPostcode ? undefined : "booking-postal"} className="block text-sm font-medium text-foreground mb-2">{tr("Postcode", "Postal Code")}</label>
                        {locationIsPostcode ? (
                          <div id="booking-postal" className="flex min-h-11 items-center justify-between gap-2 rounded-lg border border-border bg-muted px-3 py-2 text-sm sm:text-base text-foreground">
                            <span>{eventLocation.trim().toUpperCase()}</span>
                            {changeInStep1(tr("Postcode wijzigen", "Change postal code"))}
                          </div>
                        ) : (
                          <input
                            id="booking-postal"
                            maxLength={20}
                            type="text"
                            value={postalCode}
                            onChange={(e) => setPostalCode(postalCodeChars(e.target.value))}
                            className="w-full px-3 sm:px-4 py-2.5 text-sm sm:text-base border border-border rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent bg-background text-foreground"
                          />
                        )}
                      </div>
                      <div>
                        {locationIsPostcode ? (
                          <>
                            <label htmlFor="booking-city" className="block text-sm font-medium text-foreground mb-2">{tr("Plaats", "City")}</label>
                            <input
                              id="booking-city"
                              maxLength={120}
                              type="text"
                              value={city}
                              onChange={(e) => setCity(lettersOnly(e.target.value))}
                              className="w-full px-3 sm:px-4 py-2.5 text-sm sm:text-base border border-border rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent bg-background text-foreground"
                            />
                          </>
                        ) : (
                          <>
                            <span className="block text-sm font-medium text-foreground mb-2">{tr("Plaats", "City")}</span>
                            <div className="flex min-h-11 items-center justify-between gap-2 rounded-lg border border-border bg-muted px-3 py-2 text-sm sm:text-base text-foreground">
                              <span className="min-w-0 break-words">{eventLocation.trim()}</span>
                              {changeInStep1(tr("Plaats wijzigen", "Change place"))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="booking-country" className="block text-sm font-medium text-foreground mb-2">{tr("Land", "Country")}</label>
                      <input
                        id="booking-country"
                        maxLength={120}
                        type="text"
                        value={country}
                        onChange={(e) => setCountry(lettersOnly(e.target.value))}
                        className="w-full px-3 sm:px-4 py-2.5 text-sm sm:text-base border border-border rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent bg-background text-foreground"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Equipment Selection: the professional's own package and extras */}
              {bookingOptions && (bookingOptions.package || bookingOptions.extras.length > 0) && (
                <div className="bg-card rounded-lg shadow border border-border p-4 sm:p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-1">{artist ? tr("Apparatuur en extra's", "Equipment and extras") : tr("Extra's", "Extras")}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{tr(`Zoals ${professional.name} ze in het profiel aanbiedt. Prijzen excl. btw.`, `As ${professional.name} offers them on their profile. Prices excl. VAT.`)}</p>
                  <div className="flex flex-col gap-3">
                    {[bookingOptions.package, ...bookingOptions.extras].filter((option) => option !== null).map((option) => {
                      const checked = selectedEquipment.includes(option.id)
                      const isPackage = option.id === PACKAGE_OPTION_ID
                      return (
                        <label
                          key={option.id}
                          className={`block cursor-pointer rounded-lg border-2 p-4 transition-colors ${checked ? "border-red-500 bg-red-500/5" : "border-border hover:border-muted-foreground"}`}
                        >
                          <span className="flex items-start justify-between gap-4">
                            <span className="flex min-w-0 items-start gap-3">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => setSelectedEquipment((prev) => (checked ? prev.filter((id) => id !== option.id) : [...prev, option.id]))}
                                className="mt-1 h-4 w-4 flex-shrink-0 accent-red-600"
                              />
                              {!isPackage && option.imageUrl && (
                                <img src={option.imageUrl} alt="" className="h-16 w-16 flex-shrink-0 rounded object-cover" />
                              )}
                              <span className="min-w-0">
                                <span className="flex items-center gap-2 font-semibold text-foreground">
                                  {isPackage && <Speaker className="h-4 w-4 text-red-500" aria-hidden />}
                                  {isPackage ? tr("Apparatuurpakket", "Equipment package") : option.label}
                                </span>
                                {option.description && <span className="mt-1 block text-sm text-muted-foreground">{option.description}</span>}
                                {isPackage && <span className="mt-1 block text-sm text-muted-foreground">{tr("Alles wat hieronder staat, voor één prijs per dag.", "Everything listed below, for one price per day.")}</span>}
                              </span>
                            </span>
                            <span className="whitespace-nowrap text-sm font-semibold text-foreground">
                              {formatEuro(option.priceCents)}
                              <span className="font-normal text-muted-foreground">/{tr("dag", "day")}</span>
                            </span>
                          </span>
                          {isPackage && option.items && option.items.length > 0 && (
                            <span className="mt-4 grid grid-cols-1 gap-3 border-t border-border pt-4 sm:grid-cols-2">
                              {option.items.map((item) => (
                                <span key={item.label} className="flex gap-3">
                                  {item.imageUrl ? (
                                    <img src={item.imageUrl} alt="" className="h-14 w-14 flex-shrink-0 rounded object-cover" />
                                  ) : (
                                    <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded bg-muted" aria-hidden>
                                      <Speaker className="h-5 w-5 text-muted-foreground" />
                                    </span>
                                  )}
                                  <span className="min-w-0">
                                    <span className="block text-sm font-medium text-foreground">{item.label}</span>
                                    {item.description && <span className="block text-xs text-muted-foreground">{item.description}</span>}
                                  </span>
                                </span>
                              ))}
                            </span>
                          )}
                        </label>
                      )
                    })}
                  </div>
                </div>
              )}
              {optionsLoading && <p className="text-sm text-muted-foreground">{tr("Prijzen laden...", "Loading prices...")}</p>}
              {!optionsLoading && !bookingOptions && (
                <div role="alert" className="flex flex-wrap items-center gap-3 rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm text-foreground">
                  <span>{tr("De prijzen van deze professional konden niet worden geladen.", "This professional's prices could not be loaded.")}</span>
                  <Button type="button" variant="outline" className="h-11" onClick={() => void reloadOptions()}>{tr("Opnieuw proberen", "Try again")}</Button>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={() => goToStep(1)}
                  className="px-6 py-3 bg-accent text-foreground hover:bg-muted"
                >
                  {tr("Terug", "Back")}
                </Button>
                <Button
                  onClick={() => goToStep(3)}
                  disabled={!eventDate || !eventName || eventName.length < 3 || !startTime || !endTime || sameTime || Boolean(hoursIssue) || !linksOk || !bookingOptions}
                  className="flex-1 py-3 text-base font-semibold bg-red-700 hover:bg-red-600 text-white disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed"
                >
                  {tr("Naar persoonlijke gegevens", "Continue to Personal Details")}
                </Button>
              </div>
              {missingHint(missingStep2)}
            </div>
          )}

          {/* Step 3 - Personal Details */}
          {currentStep === 3 && (
            <div className="space-y-4 sm:space-y-6">
              <div className="bg-card rounded-lg shadow border border-border p-4 sm:p-6">
                <h2 ref={stepHeading} tabIndex={-1} className="scroll-mt-4 outline-none text-xl sm:text-2xl font-bold mb-2 text-foreground">{tr("Persoonlijke gegevens", "Personal details")}</h2>
                <p className="text-sm text-muted-foreground mb-2">{tr("Vul je gegevens in zodat de professional contact met je kan opnemen.", "Fill in your details so the professional can contact you.")}</p>
                {requiredNote}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="space-y-2 text-sm font-medium text-foreground">{tr("Voornaam", "First name")}{required}<input required value={firstName} autoComplete="given-name" onChange={(event) => setFirstName(lettersOnly(event.target.value))} className="w-full rounded-md border border-border bg-background px-3 py-2" placeholder={tr("Voornaam", "First name")} /></label>
                  <label className="space-y-2 text-sm font-medium text-foreground">{tr("Achternaam", "Last name")}{required}<input required value={lastName} autoComplete="family-name" onChange={(event) => setLastName(lettersOnly(event.target.value))} className="w-full rounded-md border border-border bg-background px-3 py-2" placeholder={tr("Achternaam", "Last name")} /></label>
                  <label className="space-y-2 text-sm font-medium text-foreground">{tr("E-mailadres", "Email address")}{required}<input required autoComplete="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2" placeholder={tr("jij@voorbeeld.nl", "you@example.com")} /></label>
                  <label className="space-y-2 text-sm font-medium text-foreground">{tr("Telefoonnummer", "Phone number")}{required}<input required autoComplete="tel" type="tel" value={phone} onChange={(event) => setPhone(phoneChars(event.target.value))} className="w-full rounded-md border border-border bg-background px-3 py-2" placeholder="06 12345678" /></label>
                </div>
                <div className="mt-6 border-t border-border pt-5">
                  <h3 className="font-semibold text-foreground">{tr("Factuurgegevens", "Billing details")}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{tr("Deze gegevens gebruiken we om de factuur op te stellen.", "We use these details to prepare the invoice.")}</p>
                  {streetName.trim() && (
                    <Button type="button" variant="outline" className="mt-3 h-11" onClick={copyEventAddress}>
                      {tr("Zelfde als evenementadres", "Same as event address")}
                    </Button>
                  )}
                  <div className="mt-4 flex gap-2" role="radiogroup" aria-label={tr("Type klant", "Customer type")}>
                    <button type="button" role="radio" aria-checked={customerType === "private"} onClick={() => setCustomerType("private")} className={`rounded-md border px-4 py-2 text-sm ${customerType === "private" ? "border-red-500 bg-red-500/10" : "border-border"}`}>{tr("Particulier", "Private")}</button>
                    <button type="button" role="radio" aria-checked={customerType === "business"} onClick={() => setCustomerType("business")} className={`rounded-md border px-4 py-2 text-sm ${customerType === "business" ? "border-red-500 bg-red-500/10" : "border-border"}`}>{tr("Zakelijk", "Business")}</button>
                  </div>
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {customerType === "business" && <label className="space-y-2 text-sm font-medium text-foreground sm:col-span-2">{tr("Bedrijfsnaam", "Company name")}{required}<input required autoComplete="organization" value={companyName} onChange={(event) => setCompanyName(event.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2" placeholder={tr("Bedrijfsnaam", "Company name")} /></label>}
                    <label className="space-y-2 text-sm font-medium text-foreground">{tr("Straat", "Street")}{required}<input required autoComplete="address-line1" value={billingStreet} onChange={(event) => setBillingStreet(event.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2" placeholder={tr("Straatnaam", "Street name")} /></label>
                    <label className="space-y-2 text-sm font-medium text-foreground">{tr("Huisnummer", "House number")}{required}<input required value={billingHouseNumber} onChange={(event) => setBillingHouseNumber(event.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2" placeholder="12A" /></label>
                    <label className="space-y-2 text-sm font-medium text-foreground">{tr("Postcode", "Postal code")}{required}<input required autoComplete="postal-code" value={billingPostalCode} onChange={(event) => setBillingPostalCode(postalCodeChars(event.target.value))} className="w-full rounded-md border border-border bg-background px-3 py-2" placeholder="1234 AB" /></label>
                    <label className="space-y-2 text-sm font-medium text-foreground">{tr("Plaats", "City")}{required}<input required autoComplete="address-level2" value={billingCity} onChange={(event) => setBillingCity(lettersOnly(event.target.value))} className="w-full rounded-md border border-border bg-background px-3 py-2" placeholder="Amsterdam" /></label>
                    <label className="space-y-2 text-sm font-medium text-foreground">{tr("Land", "Country")}<select value={billingCountry} onChange={(event) => setBillingCountry(event.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2"><option value="Nederland">{tr("Nederland", "Netherlands")}</option><option value="België">{tr("België", "Belgium")}</option><option value="Duitsland">{tr("Duitsland", "Germany")}</option><option value="Anders">{tr("Anders", "Other")}</option></select></label>
                    {customerType === "business" && <label className="space-y-2 text-sm font-medium text-foreground">{tr("Btw-nummer", "VAT number")}{required}<input required value={vatNumber} onChange={(event) => setVatNumber(event.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2" placeholder="NL123456789B01" /></label>}
                  </div>
                </div>
              </div>
              <div className="flex gap-3"><Button onClick={() => goToStep(2)} className="px-6 bg-accent text-foreground">{tr("Terug", "Back")}</Button><Button onClick={() => goToStep(4)} disabled={!firstName.trim() || !lastName.trim() || !isEmail(email) || !isPhone(phone) || !billingStreet.trim() || !billingHouseNumber.trim() || !billingPostalCode.trim() || !billingCity.trim() || (customerType === "business" && (!companyName.trim() || !vatNumber.trim()))} className="flex-1 bg-red-700 hover:bg-red-600 text-white">{tr("Naar overzicht", "To overview")}</Button></div>
              {missingHint(missingStep3)}
            </div>
          )}

          {/* Step 4 - Overview and payment */}
          {currentStep === 4 && (
            <div data-private className="space-y-4 sm:space-y-6">
              <div className="bg-card rounded-lg shadow border border-border p-4 sm:p-6">
                <h2 ref={stepHeading} tabIndex={-1} className="scroll-mt-4 outline-none text-xl sm:text-2xl font-bold mb-5 text-foreground">{tr("Overzicht", "Overview")}</h2>
                <div className="space-y-3 text-sm border-b border-border pb-4">
                  <div className="flex justify-between"><span className="text-muted-foreground">Professional</span><span className="font-medium text-foreground">{professional.name}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">{tr("Datum", "Date")}</span><span className="font-medium text-foreground">{formatSelectedDate()}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">{tr("Locatie", "Location")}</span><span className="font-medium text-foreground">{eventLocation}</span></div>
                  <div className="flex justify-between gap-4"><span className="text-muted-foreground">{tr("Factuuradres", "Billing address")}</span><span className="text-right font-medium text-foreground">{customerType === "business" ? `${companyName}, ` : ""}{billingStreet} {billingHouseNumber}, {billingPostalCode} {billingCity}, {billingCountry}</span></div>
                  {customerType === "business" && <div className="flex justify-between"><span className="text-muted-foreground">{tr("Btw-nummer", "VAT number")}</span><span className="font-medium text-foreground">{vatNumber}</span></div>}
                  {pricing && <>
                  <div className="flex justify-between"><span className="text-muted-foreground">{artist ? tr("Optreden", "Performance") : tr("Inzet", "Service")} ({pricing.hours} {tr("uur", "hrs")} x {formatEuro(pricing.hourlyRateCents)})</span><span className="font-medium text-foreground">{formatEuro(pricing.performanceCents)}</span></div>
                  {pricing.equipmentCents > 0 && <div className="flex justify-between"><span className="text-muted-foreground">{artist ? tr("Apparatuur en extra's", "Equipment and extras") : tr("Extra's", "Extras")} ({pricing.equipmentLabels.join(", ")})</span><span className="font-medium text-foreground">{formatEuro(pricing.equipmentCents)}</span></div>}
                  <div className="flex justify-between"><span className="text-muted-foreground">{tr("Reiskosten", "Travel")} ({(distance ?? 0) * 2} km {tr("retour", "round trip")})</span><span className="font-medium text-foreground">{formatEuro(pricing.travelCents)}</span></div>
                  <div className="flex justify-between border-t border-border pt-2"><span className="text-muted-foreground">{tr("Subtotaal excl. btw", "Subtotal excl. VAT")}</span><span className="font-medium text-foreground">{formatEuro(pricing.netCents)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">{tr("Btw", "VAT")}</span><span className="font-medium text-foreground">{formatEuro(pricing.vatCents)}</span></div>
                  <div className="flex justify-between text-base pt-2"><span className="font-bold text-foreground">{tr("Totaal incl. btw", "Total incl. VAT")}</span><span className="font-bold text-red-700 dark:text-red-400">{formatEuro(shownTotal)}</span></div>
                  </>}
                  <p className="text-xs text-muted-foreground">{tr("De professional bevestigt dit bedrag als je aanvraag wordt geaccepteerd. Je betaalt pas daarna.", "The professional confirms this amount when your request is accepted. You only pay after that.")}</p>
                </div>
                <div className="mt-5">
                  <h3 className="font-semibold text-foreground mb-3">{tr("Zo betaal je", "How you pay")}</h3>
                  <ol className="space-y-3 text-sm">
                    {paymentMoments(language === "nl").map(({ title, text }, index) => [
                      index === 1 ? `${title}: ${formatEuro(depositCents(shownTotal))}` : index === 2 ? `${title}: ${formatEuro(shownTotal - depositCents(shownTotal))}` : title,
                      text,
                    ]).map(([title, text], index) => (
                      <li key={title} className="flex gap-3">
                        <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-border text-xs font-medium text-muted-foreground" aria-hidden="true">{index + 1}</span>
                        <div><p className="font-medium text-foreground">{title}</p><p className="text-muted-foreground">{text}</p></div>
                      </li>
                    ))}
                  </ol>
                  <p className="mt-3 text-xs text-muted-foreground">{tr("Je betaalt per bankoverschrijving. De bedragen volgen uit het overzicht hierboven.", "You pay by bank transfer. The amounts follow from the overview above.")}</p>
                </div>
                <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground"><LockKeyhole className="h-4 w-4" />{tr("Je gegevens worden veilig verwerkt.", "Your details are processed securely.")}</div>
              </div>
              {submitError && (
                <div role="alert" className="flex items-start gap-2 rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-400">
                  <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <div className="space-y-2">
                    <p>{submitError.text}</p>
                    {submitError.step && (
                      <button type="button" onClick={() => goToStep(submitError.step!)} className="inline-flex min-h-11 items-center font-medium underline underline-offset-4">
                        {tr(`Naar stap ${submitError.step}`, `Go to step ${submitError.step}`)}
                      </button>
                    )}
                  </div>
                </div>
              )}
              {changedTotal !== null && !submitError && (
                <div role="alert" className="flex items-start gap-2 rounded-md border border-amber-500/50 bg-amber-500/10 p-3 text-sm text-foreground">
                  <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
                  <p>
                    {tr(
                      `Het totaal is veranderd: het is nu ${formatEuro(changedTotal)} incl. btw. Je aanvraag is nog niet verstuurd. Klopt dit bedrag? Verstuur je aanvraag dan opnieuw.`,
                      `The total has changed: it is now ${formatEuro(changedTotal)} incl. VAT. Your request has not been sent yet. If you agree with this amount, send your request again.`,
                    )}
                  </p>
                </div>
              )}
              <div className="flex gap-3"><Button onClick={() => goToStep(3)} disabled={submitting} className="px-6 bg-accent text-foreground">{tr("Terug", "Back")}</Button><Button onClick={handleSubmitBooking} disabled={submitting || !eventDate || !pricing} className="flex-1 bg-red-700 hover:bg-red-600 text-white">{submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{uploadPercent !== null ? tr(`Muziek uploaden... ${uploadPercent}%`, `Uploading music... ${uploadPercent}%`) : tr("Versturen...", "Sending...")}</> : changedTotal !== null ? tr(`Akkoord met ${formatEuro(changedTotal)}, verstuur`, `Agree to ${formatEuro(changedTotal)}, send`) : tr("Verstuur aanvraag", "Send request")}</Button></div>
            </div>
          )}

          {/* Step 5 - Confirmation */}
          {currentStep === 5 && (
            <div data-private className="bg-card rounded-lg shadow border border-border p-8 text-center"><CheckCircle2 className="mx-auto h-16 w-16 text-green-500" /><h2 ref={stepHeading} tabIndex={-1} className="scroll-mt-4 outline-none mt-4 text-2xl font-bold text-foreground">{tr("Boekingsaanvraag verzonden", "Booking request sent")}</h2><p className="mx-auto mt-3 max-w-lg text-muted-foreground">{tr(`Bedankt ${firstName || "voor je aanvraag"}. We hebben je aanvraag ontvangen en doorgestuurd naar ${professional.name}. Je vindt de status en de reactie van de professional in je eigen dashboard.`, `Thank you${firstName ? `, ${firstName}` : ""}. We received your request and sent it to ${professional.name}. You can follow the status and the professional's reply in your dashboard.`)}</p>{bookingId && <p className="mt-3 text-sm text-muted-foreground">{tr("Aanvraagnummer", "Request number")} <span className="font-mono font-medium text-foreground">#{bookingId.toString().padStart(5, "0")}</span></p>}<Button onClick={() => router.push(bookingId ? `/account/boekingen/${bookingId}` : "/account/boekingen")} className="mt-6 bg-red-700 hover:bg-red-600 text-white">{tr("Bekijk mijn boeking", "View my booking")}</Button></div>
          )}
        </div>
      </div>
    </div>
  )
}
