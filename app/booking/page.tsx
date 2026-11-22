"use client"

import { useState, useEffect, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import useSWR from "swr"
import { Calendar, MapPin, AlertTriangle, Euro, ChevronLeft, ChevronRight, Clock, Speaker, CheckCircle2, LockKeyhole, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { uploadPresigned } from "@vercel/blob/client"
import { AudioUpload } from "@/components/booking/audio-upload"
import { audioContentType, newAudioPath } from "@/lib/bookings/audio"
import { artists, photographers } from "@/lib/smart-search"
import { isDemoProfessional } from "@/lib/demo-professionals"
import { Header } from "@/components/header"
import { useLanguage } from "@/contexts/language-context"
import { DEPOSIT_PERCENT, depositCents } from "@/lib/bookings/payments"
import { calculateBookingDistance, createBooking, getBlockedDates, getBookingOptions } from "@/app/actions/bookings"
import { authClient } from "@/lib/auth-client"
import { digitsOnly, lettersOnly, phoneChars, postalCodeChars } from "@/lib/input-filters"
import { getCustomerProfile } from "@/app/actions/customer"
import { PACKAGE_OPTION_ID, formatEuro, hoursBetween, hoursProblem, priceBooking } from "@/lib/bookings/pricing"

/** Every half hour of the day, as "HH:MM". */
const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => `${String(Math.floor(i / 2)).padStart(2, "0")}:${i % 2 ? "30" : "00"}`)

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
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [selectedDate, setSelectedDate] = useState<number | null>(null)
  const [eventLocation, setEventLocation] = useState("")
  const [distance, setDistance] = useState<number | null>(null)
  const [calculating, setCalculating] = useState(false)
  
  // Step 2 - Event Details
  const [eventName, setEventName] = useState("")
  const [eventDate, setEventDate] = useState("")
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([])
  const [selectedMusicGenres, setSelectedMusicGenres] = useState<string[]>([])
  const [capacity, setCapacity] = useState("")
  const [description, setDescription] = useState("")
  const [specialRequests, setSpecialRequests] = useState("")
  const [linkOption, setLinkOption] = useState<"playlist" | "individual">("playlist")
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
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
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
  const { data: blockedDates = [] } = useSWR(
    professionalKey ? ["blocked-dates", professionalKey] : null,
    ([, id]) => getBlockedDates(id),
  )
  
  const eventTypes = ["Birthday", "Anniversary", "Wedding", "Corporate", "Festival", "Club Night"]
  const eventTypeLabels: Record<string, string> = {
    Birthday: "Verjaardag",
    Anniversary: "Jubileum",
    Wedding: "Bruiloft",
    Corporate: "Zakelijk",
    Festival: "Festival",
    "Club Night": "Clubavond",
  }
  const musicGenres = ["Trance", "House", "Techno", "Punk", "Hip-Hop", "Pop", "Rock", "EDM"]

  // Get artist or photographer data
  const staticArtist = artistId ? artists.find(a => a.id === Number(artistId)) : null
  const needsLiveLookup = Boolean(artistId) && !staticArtist
  const { data: liveData, isLoading: liveLoading } = useSWR<{ artists: typeof artists }>(
    needsLiveLookup ? "/api/artists/live" : null,
    (url: string) => fetch(url).then((response) => response.json()),
  )
  const liveArtist = needsLiveLookup
    ? liveData?.artists.find((a) => String(a.id) === artistId)
    : null
  const artist = staticArtist || liveArtist || null
  const staticPhotographer = professionalId ? photographers.find(p => p.id === Number(professionalId)) : null
  const needsPhotographerLookup = Boolean(professionalId) && !staticPhotographer
  const { data: livePhotographerData, isLoading: livePhotographerLoading } = useSWR<{ photographers: typeof photographers }>(
    needsPhotographerLookup ? "/api/photographers/live" : null,
    (url: string) => fetch(url).then((response) => response.json()),
  )
  const livePhotographer = needsPhotographerLookup
    ? livePhotographerData?.photographers.find((p) => String(p.id) === professionalId)
    : null
  const photographer = staticPhotographer || livePhotographer || null
  const professional = artist || photographer

  // Rates, hours, travel range, the professional's own equipment and the VAT come from the server.
  const optionsKey = professional && !isDemoProfessional(professional.id) ? ["booking-options", String(professional.id)] : null
  const { data: bookingOptions, isLoading: optionsLoading } = useSWR(optionsKey, ([, id]: string[]) => getBookingOptions(id))
  useEffect(() => {
    // Artists start with their own equipment package selected; photographers have none.
    if (bookingOptions?.package && artist) setSelectedEquipment((prev) => (prev.length ? prev : [PACKAGE_OPTION_ID]))
  }, [bookingOptions, artist])

  useEffect(() => {
    if (initialDate) {
      const [day, month, year] = initialDate.split("-").map(Number)
      setSelectedDate(day)
      setCurrentMonth(month - 1)
      setCurrentYear(year)
    }
  }, [initialDate])

  useEffect(() => {
    const artistLookupDone = !liveLoading && (!needsLiveLookup || liveData)
    const photographerLookupDone = !livePhotographerLoading && (!needsPhotographerLookup || livePhotographerData)
    if (!professional && artistLookupDone && photographerLookupDone) {
      router.push("/")
    }
  }, [professional, router, liveLoading, needsLiveLookup, liveData, livePhotographerLoading, needsPhotographerLookup, livePhotographerData])

  if (!professional) {
    return null
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

  const toIsoDate = (year: number, month: number, day: number) =>
    `${year}-${(month + 1).toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`

  const isDateUnavailable = (day: number) => {
    const dateStr = toIsoDate(currentYear, currentMonth, day)
    return professional.unavailableDates?.includes(dateStr) || blockedDates.includes(dateStr)
  }

  const selectedIsoDate = selectedDate ? toIsoDate(currentYear, currentMonth, selectedDate) : ""
  const effectiveEventDate = eventDate || selectedIsoDate

  // An end time before the start time is after midnight; the same time twice is not a duration (the server refuses it too).
  const sameTime = Boolean(startTime) && startTime === endTime
  const endsNextDay = Boolean(startTime && endTime) && endTime < startTime
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

  // What still blocks the "continue" button of each step, so a grey button never goes unexplained.
  const missingStep1 = [
    !selectedDate && tr("een datum in de kalender", "a date in the calendar"),
    !eventLocation.trim() && tr("de plaats van je evenement", "the place of your event"),
    eventLocation.trim() && distance === null && tr("de afstand (klik op de knop naast de plaats)", "the distance (click the button next to the place)"),
  ].filter(Boolean) as string[]
  const missingStep2 = [
    (!eventName || eventName.length < 3) && tr("een naam voor je evenement (minimaal 3 tekens)", "a name for your event (at least 3 characters)"),
    (!startTime || !endTime) && tr("een start- en eindtijd", "a start and end time"),
  ].filter(Boolean) as string[]
  const missingStep3 = [
    !firstName.trim() && tr("voornaam", "first name"),
    !lastName.trim() && tr("achternaam", "last name"),
    !email.includes("@") && tr("geldig e-mailadres", "valid email address"),
    !phone.trim() && tr("telefoonnummer", "phone number"),
    !billingStreet.trim() && tr("straat", "street"),
    !billingHouseNumber.trim() && tr("huisnummer", "house number"),
    !billingPostalCode.trim() && tr("postcode", "postal code"),
    !billingCity.trim() && tr("plaats", "city"),
    customerType === "business" && !companyName.trim() && tr("bedrijfsnaam", "company name"),
    customerType === "business" && !vatNumber.trim() && tr("btw-nummer", "VAT number"),
  ].filter(Boolean) as string[]
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
    if (!sessionData?.user) {
      setSubmitError("Log in of maak een account aan via de knoppen bovenaan om je aanvraag te versturen. Je ingevulde gegevens blijven bewaard.")
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
      setSubmitError(
        tr(
          "Het uploaden van je muziek is niet gelukt, dus je aanvraag is nog niet verstuurd. Probeer het opnieuw, kies een ander bestand of gebruik een link.",
          "Uploading your music failed, so your request has not been sent yet. Try again, choose another file or use a link.",
        ),
      )
      setSubmitting(false)
      return
    } finally {
      setUploadPercent(null)
    }
    try {
      const result = await createBooking({
        professionalId: String(professional.id),
        professionalName: professional.name,
        professionalType: artist ? "artist" : "photographer",
        professionalPrice: professional.price,
        eventName,
        eventDate: effectiveEventDate,
        startTime: startTime || "20:00",
        endTime: endTime || "00:00",
        eventTypes: selectedEventTypes,
        musicGenres: selectedMusicGenres,
        capacity,
        description,
        specialRequests,
        dressCode,
        playlistLink: linkOption === "playlist" ? playlistLink : "",
        openingDanceLink: openingDanceOption === "link" ? openingDanceLink : "",
        openingDanceFileName: openingDanceUpload,
        lastSongLink: lastSongOption === "link" ? lastSongLink : "",
        lastSongFileName: lastSongUpload,
        street: streetName,
        houseNumber,
        houseNumberExt,
        postalCode,
        city: city || eventLocation,
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
      })
      setBookingId(result.id)
      setSubmitted(true)
      setCurrentStep(5)
    } catch (error) {
      console.error("Booking submit failed:", error)
      const message = error instanceof Error ? error.message : ""
      setSubmitError(
        message.includes("travel range")
          ? "Deze locatie ligt buiten het werkgebied van deze professional."
          : message.includes("hours")
            ? "De gekozen tijden passen niet bij de minimale of maximale speelduur van deze professional."
            : "Het versturen is niet gelukt. Controleer je gegevens en probeer het opnieuw.",
      )
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
      const unavailable = isDateUnavailable(day)
      const isSelected = selectedDate === day
      const isPast = isDateInPast(day)

      let dayClasses = "aspect-square w-full text-sm rounded-md flex items-center justify-center transition-colors "

      if (isPast) {
        dayClasses += "bg-zinc-500 dark:bg-zinc-800 text-zinc-300 dark:text-zinc-500 cursor-not-allowed line-through"
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
          onClick={() => !unavailable && !isPast && setSelectedDate(isSelected ? null : day)}
          aria-pressed={isSelected}
          aria-label={`${new Date(currentYear, currentMonth, day).toLocaleDateString(dateLocale, { weekday: "long", day: "numeric", month: "long" })}${isPast ? ` (${tr("voorbij", "past")})` : unavailable ? ` (${tr("al geboekt", "already booked")})` : ""}`}
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
    if (!selectedDate) return language === "nl" ? "Niet gekozen" : "Not selected"
    const date = new Date(currentYear, currentMonth, selectedDate)
    return date.toLocaleDateString(dateLocale, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const professionalImage = professional.image || `/placeholder.svg?height=400&width=400&query=${encodeURIComponent(professional.name)}`

  const upcomingEvents = professional.unavailableDates?.slice(0, 5).map((dateStr, idx) => {
    const date = new Date(dateStr)
    return {
      id: idx + 1,
      name: `${tr("Geboekt evenement", "Booked Event")} ${idx + 1}`,
      date: date.toLocaleDateString(dateLocale, { weekday: "long", month: "long", day: "numeric", year: "numeric" }),
      location: professional.location,
    }
  }) || []

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
                <Button onClick={() => window.dispatchEvent(new Event("arsi:open-login"))} className="bg-red-600 hover:bg-red-700 text-white px-8">
                  {tr("Inloggen", "Log in")}
                </Button>
                <Button onClick={() => window.dispatchEvent(new Event("arsi:open-signup"))} className="bg-accent text-foreground hover:bg-muted px-8">
                  {tr("Account aanmaken", "Create account")}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background transition-colors">
      <Header />
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Progress Steps */}
        <div className="mb-4 sm:mb-8 bg-card rounded-lg p-3 sm:p-6 shadow border border-border">
          <div className="flex items-center justify-between max-w-4xl mx-auto overflow-x-auto">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center flex-shrink-0">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm sm:text-base font-bold transition-colors ${
                      currentStep === step.number
                        ? "bg-red-600 text-white"
                        : currentStep > step.number
                          ? "bg-green-600 text-white"
                          : "bg-gray-300 text-gray-800 dark:bg-gray-600 dark:text-white"
                    }`}
                  >
                    {step.number}
                  </div>
                  <span className="text-[10px] sm:text-xs mt-1 sm:mt-2 text-foreground font-medium text-center max-w-[60px] sm:max-w-none leading-tight">{step.label}</span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-4 sm:w-8 md:w-16 h-0.5 mx-1 sm:mx-2 flex-shrink-0 ${currentStep > step.number ? "bg-green-600" : "bg-border"}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-4 sm:gap-6">
          {/* Left Column - Professional Card */}
          <div className="bg-card rounded-lg shadow border border-border overflow-hidden">
            <div className="relative h-32 sm:h-48 bg-gradient-to-br from-red-600 to-red-800">
              <img 
                src={professional.banner || professionalImage} 
                alt={`${professional.name} header`} 
                className="w-full h-full object-cover" 
              />
            </div>
            
            <div className="p-4 sm:p-6 -mt-12 sm:-mt-16 relative">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-card bg-card overflow-hidden mx-auto mb-3 sm:mb-4">
                <img 
                  src={professional.avatar || professionalImage} 
                  alt={professional.name} 
                  className="w-full h-full object-cover" 
                />
              </div>
              
              <h2 className="text-lg sm:text-xl font-bold text-center text-foreground mb-1">{professional.name}</h2>
              <div className="flex items-center justify-center gap-1.5 text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>{professional.location}</span>
              </div>
              
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
              {artist?.musicStyles && artist?.musicStyles.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-medium text-muted-foreground mb-2">{t.musicGenresLabel}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {artist?.musicStyles.slice(0, 2).map((genre: string) => (
                      <span
                        key={genre}
                        className="px-2.5 py-0.5 bg-muted text-muted-foreground text-xs rounded-md capitalize"
                      >
                        {genre}
                      </span>
                    ))}
                    {artist?.musicStyles.length > 2 && (
                      <span className="px-2.5 py-0.5 bg-muted text-muted-foreground text-xs rounded-md">
                        +{artist?.musicStyles.length - 2}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Event Types */}
              {professional.eventTypes && professional.eventTypes.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">{t.eventTypesLabel}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {professional.eventTypes.slice(0, 2).map((event: string) => (
                      <span
                        key={event}
                        className="px-2.5 py-0.5 bg-muted text-muted-foreground text-xs rounded-md capitalize"
                      >
                        {event}
                      </span>
                    ))}
                    {professional.eventTypes.length > 2 && (
                      <span className="px-2.5 py-0.5 bg-muted text-muted-foreground text-xs rounded-md">
                        +{professional.eventTypes.length - 2}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Content Based on Step */}
          {currentStep === 1 && (
            <div className="space-y-4 sm:space-y-6">
              <div className="bg-card rounded-lg shadow border border-border p-4 sm:p-6">
                <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-foreground">{t.selectDateLocation}</h2>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  {/* Calendar */}
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
                      {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => (
                        <div
                          key={index}
                          className="text-center text-[10px] sm:text-xs font-semibold text-muted-foreground h-6 sm:h-8 flex items-center justify-center"
                        >
                          {day}
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-7 gap-0.5 sm:gap-1">{renderCalendar()}</div>

                    <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground" aria-label={tr("Legenda", "Legend")}>
                      <li className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-zinc-200 dark:bg-zinc-700" aria-hidden />{tr("Beschikbaar", "Available")}</li>
                      <li className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-green-600 dark:bg-green-500" aria-hidden />{tr("Gekozen", "Selected")}</li>
                      <li className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-red-600 dark:bg-red-500" aria-hidden />{tr("Al geboekt", "Already booked")}</li>
                      <li className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-zinc-500 dark:bg-zinc-800" aria-hidden />{tr("Voorbij", "Past")}</li>
                    </ul>

                    <div className="mt-4 p-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium text-muted-foreground">{t.selectedDateLabel}</p>
                      <p className="text-sm text-foreground font-semibold">{formatSelectedDate()}</p>
                    </div>
                  </div>

                  {/* Upcoming Events */}
                  <div>
                    <h3 className="text-lg font-bold mb-3 text-foreground">{t.upcomingEvents}</h3>
                    {upcomingEvents.length > 0 ? (
                      <div className="space-y-3 max-h-[400px] overflow-y-auto">
                        {upcomingEvents.map((event) => (
                          <div key={event.id} className="border-l-4 border-red-500 bg-muted rounded-r-lg p-3">
                            <h4 className="font-semibold text-foreground text-sm mb-1">{event.name}</h4>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                              <Calendar className="w-3 h-3" />
                              <span>{event.date}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <MapPin className="w-3 h-3" />
                              <span>{event.location}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">{t.noUpcomingEvents}</p>
                    )}
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
                    onChange={(e) => setEventLocation(lettersOnly(e.target.value))}
                    onKeyDown={(e) => {
                      // Enter does the same as the "Check distance" button.
                      if (e.key !== "Enter") return
                      e.preventDefault()
                      if (eventLocation.trim() && !calculating) calculateDistance()
                    }}
                    enterKeyHint="search"
                    aria-label={t.eventLocationLabel}
                    autoComplete="address-level2"
                    placeholder={t.enterCityName}
                    className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-border rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent bg-background text-foreground"
                  />
                  <Button
                    onClick={calculateDistance}
                    disabled={!eventLocation.trim() || calculating}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base whitespace-nowrap"
                  >
                    {calculating ? t.calculating : t.checkDistance}
                  </Button>
                </div>

                {distanceError && (
                  <p role="alert" className="mt-3 text-sm text-red-500">{distanceError}</p>
                )}
                {distance !== null && (
                  <div className="mt-4 p-4 bg-muted border border-border rounded-lg">
                    <p className="text-sm font-medium text-foreground">
                      {t.distanceFromTo} {professional.location} {t.city.toLowerCase()} {eventLocation}:
                    </p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{distance} km</p>
                    <p className="text-xs text-foreground mt-2">
                      {t.estimatedTravelCost} {formatEuro(distance * 2 * 25)} {tr("excl. btw", "excl. VAT")} ({tr("retour", "round trip")}: {distance * 2} km)
                    </p>
                  </div>
                )}
              </div>
              
              {/* Continue Button */}
              <div className="mt-6">
                <Button
                  onClick={() => {
                    if (!eventDate && selectedIsoDate) setEventDate(selectedIsoDate)
                    setCurrentStep(2)
                  }}
                  disabled={!selectedDate || !eventLocation.trim() || distance === null}
                  className="w-full py-3 text-base font-semibold bg-red-600 hover:bg-red-700 text-white disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed"
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
                <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-foreground">{tr("Evenementdetails", "Event Details")}</h2>
                
                {/* Event Name */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-foreground mb-2">{tr("Naam van het evenement", "Event Name")}</label>
                  <input
                    type="text"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    placeholder={tr("Naam van je evenement", "Enter event name")}
                    className="w-full px-3 sm:px-4 py-2.5 text-sm sm:text-base border border-border rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent bg-background text-foreground"
                  />
                  {eventName.length < 3 && eventName.length > 0 && (
                    <p className="text-xs text-red-500 mt-1">Event name must be at least 3 characters.</p>
                  )}
                </div>
                
                {/* Date and Times */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">{tr("Datum", "Event Date")}</label>
                    <input
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="w-full px-3 sm:px-4 py-2.5 text-sm sm:text-base border border-border rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent bg-background text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">{tr("Starttijd", "Start Time")}</label>
                    <select
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-3 sm:px-4 py-2.5 text-sm sm:text-base border border-border rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent bg-background text-foreground"
                    >
                      <option value="">{tr("Kies", "Select")}</option>
                      {TIME_OPTIONS.map((time) => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">{tr("Eindtijd", "End Time")}</label>
                    <select
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full px-3 sm:px-4 py-2.5 text-sm sm:text-base border border-border rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent bg-background text-foreground"
                    >
                      <option value="">{tr("Kies", "Select")}</option>
                      {TIME_OPTIONS.map((time) => (
                        <option key={time} value={time}>{time}</option>
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
                  <p role="alert" className="-mt-2 mb-4 text-sm text-red-500">
                    {tr("De start- en eindtijd zijn gelijk. Kies een andere eindtijd.", "The start and end time are the same. Choose another end time.")}
                  </p>
                )}
                {hoursIssue && bookingOptions && (
                  <p role="alert" className="-mt-2 mb-4 text-sm text-red-500">
                    {hoursIssue === "min"
                      ? tr(`${professional.name} speelt minimaal ${bookingOptions.minHours} uur. Kies een latere eindtijd.`, `${professional.name} plays at least ${bookingOptions.minHours} ${bookingOptions.minHours === 1 ? "hour" : "hours"}. Choose a later end time.`)
                      : tr(`${professional.name} speelt maximaal ${bookingOptions.maxHours} uur. Kies een eerdere eindtijd.`, `${professional.name} plays at most ${bookingOptions.maxHours} ${bookingOptions.maxHours === 1 ? "hour" : "hours"}. Choose an earlier end time.`)}
                  </p>
                )}

                {/* Event Types and Music Genres */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">{tr("Type evenement", "Event Types")}</label>
                    <div className="flex flex-wrap gap-2">
                      {eventTypes.map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => {
                            setSelectedEventTypes(prev =>
                              prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
                            )
                          }}
                          className={`px-3 py-1.5 text-xs sm:text-sm rounded-full font-medium transition-colors ${
                            selectedEventTypes.includes(type)
                              ? 'bg-red-600 text-white'
                              : 'bg-accent text-foreground hover:bg-muted'
                          }`}
                        >
                          {language === "nl" ? eventTypeLabels[type] ?? type : type}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">{tr("Aantal gasten", "Capacity")}</label>
                    <input
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
                
                {/* Music Genres */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-foreground mb-2">{tr("Muziekgenres", "Music Genres")}</label>
                  <div className="flex flex-wrap gap-2">
                    {musicGenres.map((genre) => (
                      <button
                        key={genre}
                        type="button"
                        onClick={() => {
                          setSelectedMusicGenres(prev =>
                            prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
                          )
                        }}
                        className={`px-3 py-1.5 text-xs sm:text-sm rounded-full font-medium transition-colors ${
                          selectedMusicGenres.includes(genre)
                            ? 'bg-red-600 text-white'
                            : 'bg-accent text-foreground hover:bg-muted'
                        }`}
                      >
                        {genre}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Description */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-foreground mb-2">{tr("Omschrijving", "Description")}</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={tr("Beschrijf je evenement...", "Describe your event...")}
                    rows={4}
                    maxLength={5000}
                    className="w-full px-3 sm:px-4 py-2.5 text-sm sm:text-base border border-border rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent bg-background text-foreground resize-none"
                  />
                  <p className="text-xs text-muted-foreground mt-1">{description.length}/5000 characters</p>
                </div>
                
                {/* Special Requests */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-foreground mb-2">{tr("Speciale wensen", "Special Requests")}</label>
                  <textarea
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    placeholder={tr("Speciale wensen of eisen...", "Any special requests or requirements...")}
                    rows={3}
                    className="w-full px-3 sm:px-4 py-2.5 text-sm sm:text-base border border-border rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent bg-background text-foreground resize-none"
                  />
                </div>
                
                {/* Link Option */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-foreground mb-2">{tr("Soort link", "Link Option")}</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={linkOption === "playlist"}
                        onChange={() => setLinkOption("playlist")}
                        className="w-4 h-4 text-red-600 focus:ring-2 focus:ring-red-600"
                      />
                      <span className="text-sm text-foreground">{tr("Link naar favoriete playlist", "Favorite Playlist Link")}</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={linkOption === "individual"}
                        onChange={() => setLinkOption("individual")}
                        className="w-4 h-4 text-red-600 focus:ring-2 focus:ring-red-600"
                      />
                      <span className="text-sm text-foreground">{tr("Link per nummer", "Links for Each Song")}</span>
                    </label>
                  </div>
                </div>
                
                {/* Playlist Link */}
                {linkOption === "playlist" && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-foreground mb-2">{tr("Playlistlink", "Playlist Link")}</label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={playlistLink}
                        onChange={(e) => setPlaylistLink(e.target.value)}
                        placeholder="https://..."
                        className="flex-1 px-3 sm:px-4 py-2.5 text-sm sm:text-base border border-border rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent bg-background text-foreground"
                      />
                      <Button className="bg-accent text-foreground hover:bg-muted px-4">{tr("Link toevoegen", "Add Link")}</Button>
                    </div>
                  </div>
                )}
                
                {/* Opening Dance Music */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-foreground mb-2">{tr("Muziek voor de openingsdans", "Opening Dance Music")}</label>
                  <div className="flex gap-4 mb-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={openingDanceOption === "upload"}
                        onChange={() => setOpeningDanceOption("upload")}
                        className="w-4 h-4 text-red-600 focus:ring-2 focus:ring-red-600"
                      />
                      <span className="text-sm text-foreground">{tr("Bestand uploaden", "Upload File")}</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
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
                    <input
                      type="url"
                      value={openingDanceLink}
                      onChange={(e) => setOpeningDanceLink(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3 sm:px-4 py-2.5 text-sm sm:text-base border border-border rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent bg-background text-foreground"
                    />
                  )}
                </div>
                
                {/* Last Song Music */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-foreground mb-2">{tr("Muziek voor het laatste nummer", "Last Song Music")}</label>
                  <div className="flex gap-4 mb-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={lastSongOption === "upload"}
                        onChange={() => setLastSongOption("upload")}
                        className="w-4 h-4 text-red-600 focus:ring-2 focus:ring-red-600"
                      />
                      <span className="text-sm text-foreground">{tr("Bestand uploaden", "Upload File")}</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
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
                    <input
                      type="url"
                      value={lastSongLink}
                      onChange={(e) => setLastSongLink(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3 sm:px-4 py-2.5 text-sm sm:text-base border border-border rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent bg-background text-foreground"
                    />
                  )}
                </div>
                
                {/* DJ Dress Code Preference */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-foreground mb-2">{tr("Gewenste dresscode voor de DJ (bijv. formeel of thema)", "DJ Dress Code Preference (e.g. Formal or theme)")}</label>
                  <input
                    type="text"
                    value={dressCode}
                    onChange={(e) => setDressCode(e.target.value)}
                    placeholder={tr("bijv. formeel, casual, thema", "e.g. Formal, Casual, Theme-based")}
                    className="w-full px-3 sm:px-4 py-2.5 text-sm sm:text-base border border-border rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent bg-background text-foreground"
                  />
                </div>
                
                {/* Event Venue Address */}
                <div className="border-t border-border pt-4">
                  <h3 className="text-lg font-semibold text-foreground mb-3">{tr("Adres van de locatie", "Event Venue Address")}</h3>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">{tr("Straat", "Street Name")}</label>
                      <input
                        type="text"
                        value={streetName}
                        onChange={(e) => setStreetName(e.target.value)}
                        className="w-full px-3 sm:px-4 py-2.5 text-sm sm:text-base border border-border rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent bg-background text-foreground"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">{tr("Huisnummer", "House Number")}</label>
                        <input
                          type="text"
                          value={houseNumber}
                          onChange={(e) => setHouseNumber(digitsOnly(e.target.value))}
                          className="w-full px-3 sm:px-4 py-2.5 text-sm sm:text-base border border-border rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent bg-background text-foreground"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">{tr("Toevoeging", "House Number Extension")}</label>
                        <input
                          type="text"
                          value={houseNumberExt}
                          onChange={(e) => setHouseNumberExt(e.target.value)}
                          className="w-full px-3 sm:px-4 py-2.5 text-sm sm:text-base border border-border rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent bg-background text-foreground"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">{tr("Postcode", "Postal Code")}</label>
                        <input
                          type="text"
                          value={postalCode}
                          onChange={(e) => setPostalCode(postalCodeChars(e.target.value))}
                          className="w-full px-3 sm:px-4 py-2.5 text-sm sm:text-base border border-border rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent bg-background text-foreground"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">{tr("Plaats", "City")}</label>
                        <input
                          type="text"
                          value={city}
                          onChange={(e) => setCity(lettersOnly(e.target.value))}
                          className="w-full px-3 sm:px-4 py-2.5 text-sm sm:text-base border border-border rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent bg-background text-foreground"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">{tr("Land", "Country")}</label>
                      <input
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

              {/* Navigation Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={() => setCurrentStep(1)}
                  className="px-6 py-3 bg-accent text-foreground hover:bg-muted"
                >
                  {tr("Terug", "Back")}
                </Button>
                <Button
                  onClick={() => setCurrentStep(3)}
                  disabled={!eventName || eventName.length < 3 || !startTime || !endTime || sameTime || Boolean(hoursIssue) || !bookingOptions}
                  className="flex-1 py-3 text-base font-semibold bg-red-600 hover:bg-red-700 text-white disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed"
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
                <h2 className="text-xl sm:text-2xl font-bold mb-2 text-foreground">{tr("Persoonlijke gegevens", "Personal details")}</h2>
                <p className="text-sm text-muted-foreground mb-6">{tr("Vul je gegevens in zodat de professional contact met je kan opnemen.", "Fill in your details so the professional can contact you.")}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="space-y-2 text-sm font-medium text-foreground">{tr("Voornaam", "First name")}<input required value={firstName} autoComplete="given-name" onChange={(event) => setFirstName(lettersOnly(event.target.value))} className="w-full rounded-md border border-border bg-background px-3 py-2" placeholder={tr("Voornaam", "First name")} /></label>
                  <label className="space-y-2 text-sm font-medium text-foreground">{tr("Achternaam", "Last name")}<input required value={lastName} autoComplete="family-name" onChange={(event) => setLastName(lettersOnly(event.target.value))} className="w-full rounded-md border border-border bg-background px-3 py-2" placeholder={tr("Achternaam", "Last name")} /></label>
                  <label className="space-y-2 text-sm font-medium text-foreground">{tr("E-mailadres", "Email address")}<input required autoComplete="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2" placeholder={tr("jij@voorbeeld.nl", "you@example.com")} /></label>
                  <label className="space-y-2 text-sm font-medium text-foreground">{tr("Telefoonnummer", "Phone number")}<input required autoComplete="tel" type="tel" value={phone} onChange={(event) => setPhone(phoneChars(event.target.value))} className="w-full rounded-md border border-border bg-background px-3 py-2" placeholder="06 12345678" /></label>
                </div>
                <div className="mt-6 border-t border-border pt-5">
                  <h3 className="font-semibold text-foreground">{tr("Factuurgegevens", "Billing details")}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{tr("Deze gegevens gebruiken we om de factuur op te stellen.", "We use these details to prepare the invoice.")}</p>
                  <div className="mt-4 flex gap-2" role="radiogroup" aria-label={tr("Type klant", "Customer type")}>
                    <button type="button" onClick={() => setCustomerType("private")} className={`rounded-md border px-4 py-2 text-sm ${customerType === "private" ? "border-red-500 bg-red-500/10" : "border-border"}`}>{tr("Particulier", "Private")}</button>
                    <button type="button" onClick={() => setCustomerType("business")} className={`rounded-md border px-4 py-2 text-sm ${customerType === "business" ? "border-red-500 bg-red-500/10" : "border-border"}`}>{tr("Zakelijk", "Business")}</button>
                  </div>
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {customerType === "business" && <label className="space-y-2 text-sm font-medium text-foreground sm:col-span-2">{tr("Bedrijfsnaam", "Company name")}<input required autoComplete="organization" value={companyName} onChange={(event) => setCompanyName(event.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2" placeholder={tr("Bedrijfsnaam", "Company name")} /></label>}
                    <label className="space-y-2 text-sm font-medium text-foreground">{tr("Straat", "Street")}<input required autoComplete="address-line1" value={billingStreet} onChange={(event) => setBillingStreet(event.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2" placeholder={tr("Straatnaam", "Street name")} /></label>
                    <label className="space-y-2 text-sm font-medium text-foreground">{tr("Huisnummer", "House number")}<input required value={billingHouseNumber} onChange={(event) => setBillingHouseNumber(event.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2" placeholder="12A" /></label>
                    <label className="space-y-2 text-sm font-medium text-foreground">{tr("Postcode", "Postal code")}<input required autoComplete="postal-code" value={billingPostalCode} onChange={(event) => setBillingPostalCode(postalCodeChars(event.target.value))} className="w-full rounded-md border border-border bg-background px-3 py-2" placeholder="1234 AB" /></label>
                    <label className="space-y-2 text-sm font-medium text-foreground">{tr("Plaats", "City")}<input required autoComplete="address-level2" value={billingCity} onChange={(event) => setBillingCity(lettersOnly(event.target.value))} className="w-full rounded-md border border-border bg-background px-3 py-2" placeholder="Amsterdam" /></label>
                    <label className="space-y-2 text-sm font-medium text-foreground">{tr("Land", "Country")}<select value={billingCountry} onChange={(event) => setBillingCountry(event.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2"><option value="Nederland">{tr("Nederland", "Netherlands")}</option><option value="België">{tr("België", "Belgium")}</option><option value="Duitsland">{tr("Duitsland", "Germany")}</option><option value="Anders">{tr("Anders", "Other")}</option></select></label>
                    {customerType === "business" && <label className="space-y-2 text-sm font-medium text-foreground">{tr("Btw-nummer", "VAT number")}<input required value={vatNumber} onChange={(event) => setVatNumber(event.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2" placeholder="NL123456789B01" /></label>}
                  </div>
                </div>
              </div>
              <div className="flex gap-3"><Button onClick={() => setCurrentStep(2)} className="px-6 bg-accent text-foreground">{tr("Terug", "Back")}</Button><Button onClick={() => setCurrentStep(4)} disabled={!firstName.trim() || !lastName.trim() || !email.includes("@") || !phone.trim() || !billingStreet.trim() || !billingHouseNumber.trim() || !billingPostalCode.trim() || !billingCity.trim() || (customerType === "business" && (!companyName.trim() || !vatNumber.trim()))} className="flex-1 bg-red-600 hover:bg-red-700 text-white">{tr("Naar overzicht", "To overview")}</Button></div>
              {missingHint(missingStep3)}
            </div>
          )}

          {/* Step 4 - Overview and payment */}
          {currentStep === 4 && (
            <div className="space-y-4 sm:space-y-6">
              <div className="bg-card rounded-lg shadow border border-border p-4 sm:p-6">
                <h2 className="text-xl sm:text-2xl font-bold mb-5 text-foreground">{tr("Overzicht", "Overview")}</h2>
                <div className="space-y-3 text-sm border-b border-border pb-4">
                  <div className="flex justify-between"><span className="text-muted-foreground">Professional</span><span className="font-medium text-foreground">{professional.name}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">{tr("Datum", "Date")}</span><span className="font-medium text-foreground">{formatSelectedDate()}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">{tr("Locatie", "Location")}</span><span className="font-medium text-foreground">{eventLocation}</span></div>
                  <div className="flex justify-between gap-4"><span className="text-muted-foreground">{tr("Factuuradres", "Billing address")}</span><span className="text-right font-medium text-foreground">{customerType === "business" ? `${companyName}, ` : ""}{billingStreet} {billingHouseNumber}, {billingPostalCode} {billingCity}, {billingCountry}</span></div>
                  {customerType === "business" && <div className="flex justify-between"><span className="text-muted-foreground">{tr("Btw-nummer", "VAT number")}</span><span className="font-medium text-foreground">{vatNumber}</span></div>}
                  {pricing && <>
                  <div className="flex justify-between"><span className="text-muted-foreground">{tr("Optreden", "Performance")} ({pricing.hours} {tr("uur", "hrs")} x {formatEuro(pricing.hourlyRateCents)})</span><span className="font-medium text-foreground">{formatEuro(pricing.performanceCents)}</span></div>
                  {pricing.equipmentCents > 0 && <div className="flex justify-between"><span className="text-muted-foreground">{artist ? tr("Apparatuur en extra's", "Equipment and extras") : tr("Extra's", "Extras")} ({pricing.equipmentLabels.join(", ")})</span><span className="font-medium text-foreground">{formatEuro(pricing.equipmentCents)}</span></div>}
                  <div className="flex justify-between"><span className="text-muted-foreground">{tr("Reiskosten", "Travel")} ({(distance ?? 0) * 2} km {tr("retour", "round trip")})</span><span className="font-medium text-foreground">{formatEuro(pricing.travelCents)}</span></div>
                  <div className="flex justify-between border-t border-border pt-2"><span className="text-muted-foreground">{tr("Subtotaal excl. btw", "Subtotal excl. VAT")}</span><span className="font-medium text-foreground">{formatEuro(pricing.netCents)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">{tr("Btw", "VAT")}</span><span className="font-medium text-foreground">{formatEuro(pricing.vatCents)}</span></div>
                  <div className="flex justify-between text-base pt-2"><span className="font-bold text-foreground">{tr("Totaal incl. btw", "Total incl. VAT")}</span><span className="font-bold text-red-500">{formatEuro(pricing.totalCents)}</span></div>
                  </>}
                  <p className="text-xs text-muted-foreground">{tr("De professional bevestigt dit bedrag als je aanvraag wordt geaccepteerd. Je betaalt pas daarna.", "The professional confirms this amount when your request is accepted. You only pay after that.")}</p>
                </div>
                <div className="mt-5">
                  <h3 className="font-semibold text-foreground mb-3">{tr("Zo betaal je", "How you pay")}</h3>
                  <ol className="space-y-3 text-sm">
                    {[
                      [tr("Nu", "Now"), tr("Je verstuurt je aanvraag en betaalt nog niets.", "You send your request and pay nothing yet.")],
                      [`${tr("Na goedkeuring", "After approval")}: ${formatEuro(depositCents(pricing?.totalCents ?? 0))}`, tr(`Je krijgt een offerte en betaalt ${DEPOSIT_PERCENT}% aan. Daarmee is je boeking definitief.`, `You receive a quote and pay a ${DEPOSIT_PERCENT}% deposit. That makes your booking final.`)],
                      [`${tr("Na het evenement", "After the event")}: ${formatEuro((pricing?.totalCents ?? 0) - depositCents(pricing?.totalCents ?? 0))}`, tr("Je betaalt het restant met de eindfactuur. Extra kosten, zoals een extra uur of parkeren, staan daar apart op.", "You pay the rest with the final invoice. Extra costs, such as an extra hour or parking, are listed there separately.")],
                    ].map(([title, text], index) => (
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
                <div role="alert" className="flex items-start gap-2 rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-500">
                  <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}
              <div className="flex gap-3"><Button onClick={() => setCurrentStep(3)} disabled={submitting} className="px-6 bg-accent text-foreground">{tr("Terug", "Back")}</Button><Button onClick={handleSubmitBooking} disabled={submitting || !effectiveEventDate || !pricing} className="flex-1 bg-red-600 hover:bg-red-700 text-white">{submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{uploadPercent !== null ? tr(`Muziek uploaden... ${uploadPercent}%`, `Uploading music... ${uploadPercent}%`) : tr("Versturen...", "Sending...")}</> : tr("Verstuur aanvraag", "Send request")}</Button></div>
            </div>
          )}

          {/* Step 5 - Confirmation */}
          {currentStep === 5 && (
            <div className="bg-card rounded-lg shadow border border-border p-8 text-center"><CheckCircle2 className="mx-auto h-16 w-16 text-green-500" /><h2 className="mt-4 text-2xl font-bold text-foreground">{tr("Boekingsaanvraag verzonden", "Booking request sent")}</h2><p className="mx-auto mt-3 max-w-lg text-muted-foreground">{tr(`Bedankt ${firstName || "voor je aanvraag"}. We hebben je aanvraag ontvangen en doorgestuurd naar ${professional.name}. Je vindt de status en de reactie van de professional in je eigen dashboard.`, `Thank you${firstName ? `, ${firstName}` : ""}. We received your request and sent it to ${professional.name}. You can follow the status and the professional's reply in your dashboard.`)}</p>{bookingId && <p className="mt-3 text-sm text-muted-foreground">{tr("Aanvraagnummer", "Request number")} <span className="font-mono font-medium text-foreground">#{bookingId.toString().padStart(5, "0")}</span></p>}<Button onClick={() => router.push(bookingId ? `/account/boekingen/${bookingId}` : "/account/boekingen")} className="mt-6 bg-red-600 hover:bg-red-700 text-white">{tr("Bekijk mijn boeking", "View my booking")}</Button></div>
          )}
        </div>
      </div>
    </div>
  )
}
