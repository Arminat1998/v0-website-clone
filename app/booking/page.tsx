"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import useSWR from "swr"
import { Calendar, MapPin, AlertTriangle, Euro, ChevronLeft, ChevronRight, Clock, Speaker, CheckCircle2, CreditCard, LockKeyhole, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { artists, photographers } from "@/lib/smart-search"
import { Header } from "@/components/header"
import { useLanguage } from "@/contexts/language-context"
import { createBooking, getBlockedDates } from "@/app/actions/bookings"
import { authClient } from "@/lib/auth-client"
import { getCustomerProfile } from "@/app/actions/customer"
import { calculatePricing, formatEuro, parseHourlyRateCents } from "@/lib/bookings/pricing"

export default function BookingPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { t } = useLanguage()
  
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
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>(["basic"])

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
  const [paymentMethod, setPaymentMethod] = useState<"ideal" | "card" | "invoice">("ideal")
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const { data: sessionData } = authClient.useSession()

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
  const photographer = professionalId ? photographers.find(p => p.id === Number(professionalId)) : null
  const professional = artist || photographer

  useEffect(() => {
    if (initialDate) {
      const [day, month, year] = initialDate.split("-").map(Number)
      setSelectedDate(day)
      setCurrentMonth(month - 1)
      setCurrentYear(year)
    }
  }, [initialDate])

  useEffect(() => {
    if (!professional && !liveLoading && (!needsLiveLookup || liveData)) {
      router.push("/")
    }
  }, [professional, router, liveLoading, needsLiveLookup, liveData])

  if (!professional) {
    return null
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

  const pricing = calculatePricing({
    hourlyRateCents: parseHourlyRateCents(professional.price),
    startTime: startTime || "20:00",
    endTime: endTime || "00:00",
    equipment: selectedEquipment,
    distanceKm: distance ?? 0,
  })

  const handleSubmitBooking = async () => {
    if (!sessionData?.user) {
      setSubmitError("Log in of maak een account aan via de knoppen bovenaan om je aanvraag te versturen. Je ingevulde gegevens blijven bewaard.")
      window.scrollTo({ top: 0, behavior: "smooth" })
      return
    }
    setSubmitting(true)
    setSubmitError(null)
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
        openingDanceFileName: openingDanceOption === "upload" ? (openingDanceFile?.name ?? "") : "",
        lastSongLink: lastSongOption === "link" ? lastSongLink : "",
        lastSongFileName: lastSongOption === "upload" ? (lastSongFile?.name ?? "") : "",
        street: streetName,
        houseNumber,
        houseNumberExt,
        postalCode,
        city: city || eventLocation,
        country,
        distanceKm: distance ?? 0,
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
        paymentMethod,
      })
      setBookingId(result.id)
      setSubmitted(true)
      setCurrentStep(5)
    } catch (error) {
      console.error("[v0] Booking submit failed:", error)
      setSubmitError("Het versturen is niet gelukt. Controleer je gegevens en probeer het opnieuw.")
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

  // Real distance calculation using OpenStreetMap Nominatim
  const calculateDistance = async () => {
    if (!eventLocation.trim()) return
    
    setCalculating(true)
    setDistance(null)
    
    try {
      // Geocode the professional's location
      const professionalLocationQuery = encodeURIComponent(professional.location)
      const profResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${professionalLocationQuery}&limit=1`,
        {
          headers: {
            'User-Agent': 'ARSIEvents-Booking-App'
          }
        }
      )
      const profData = await profResponse.json()
      
      // Geocode the event location
      const eventLocationQuery = encodeURIComponent(eventLocation.trim())
      const eventResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${eventLocationQuery},Netherlands&limit=1`,
        {
          headers: {
            'User-Agent': 'ARSIEvents-Booking-App'
          }
        }
      )
      const eventData = await eventResponse.json()
      
      if (profData.length === 0 || eventData.length === 0) {
        alert(t.locationNotFound || "Could not find one or both locations. Please check the spelling.")
        setCalculating(false)
        return
      }
      
      // Calculate distance using Haversine formula
      const lat1 = parseFloat(profData[0].lat)
      const lon1 = parseFloat(profData[0].lon)
      const lat2 = parseFloat(eventData[0].lat)
      const lon2 = parseFloat(eventData[0].lon)
      
      const R = 6371 // Earth's radius in km
      const dLat = (lat2 - lat1) * Math.PI / 180
      const dLon = (lon2 - lon1) * Math.PI / 180
      const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      const distanceKm = Math.round(R * c)
      
      setDistance(distanceKm)
    } catch (error) {
      console.error('[v0] Distance calculation error:', error)
      alert(t.distanceCalculationError || "Error calculating distance. Please try again.")
    } finally {
      setCalculating(false)
    }
  }

  const formatSelectedDate = () => {
    if (!selectedDate) return "Not selected"
    const date = new Date(currentYear, currentMonth, selectedDate)
    return date.toLocaleDateString("en-US", {
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
      name: `Booked Event ${idx + 1}`,
      date: date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }),
      location: professional.location,
    }
  }) || []

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
                src={professional.headerImage || professionalImage || "/placeholder.svg"} 
                alt={`${professional.name} header`} 
                className="w-full h-full object-cover" 
              />
            </div>
            
            <div className="p-4 sm:p-6 -mt-12 sm:-mt-16 relative">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-card bg-card overflow-hidden mx-auto mb-3 sm:mb-4">
                <img 
                  src={professional.image || professionalImage || "/placeholder.svg"} 
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
                    <span>1 - 8 hrs</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-foreground">
                      {professional.price} {t.perHour}
                    </span>
                    <span className="text-xs text-muted-foreground ml-1">({t.exVat})</span>
                  </div>
                </div>
                
                {professional.equipmentPrice && (
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Speaker className="w-3.5 h-3.5" />
                      <span>{t.apparatus}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-foreground">
                        {professional.equipmentPrice} {t.perDay}
                      </span>
                      <span className="text-xs text-muted-foreground ml-1">({t.exVat})</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Music Genres */}
              {professional.musicStyles && professional.musicStyles.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-medium text-muted-foreground mb-2">{t.musicGenresLabel}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {professional.musicStyles.slice(0, 2).map((genre: string) => (
                      <span
                        key={genre}
                        className="px-2.5 py-0.5 bg-muted text-muted-foreground text-xs rounded-md capitalize"
                      >
                        {genre}
                      </span>
                    ))}
                    {professional.musicStyles.length > 2 && (
                      <span className="px-2.5 py-0.5 bg-muted text-muted-foreground text-xs rounded-md">
                        +{professional.musicStyles.length - 2}
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
                    onChange={(e) => setEventLocation(e.target.value)}
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

                {distance !== null && (
                  <div className="mt-4 p-4 bg-muted border border-border rounded-lg">
                    <p className="text-sm font-medium text-foreground">
                      {t.distanceFromTo} {professional.location} {t.city.toLowerCase()} {eventLocation}:
                    </p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{distance} km</p>
                    <p className="text-xs text-foreground mt-2">
                      {t.estimatedTravelCost} €{(distance * 2 * 0.25).toFixed(2)} (round trip: {distance * 2} km)
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
                  Continue to Event Details
                </Button>
              </div>
            </div>
          )}
          
          {/* Step 2 - Event Details */}
          {currentStep === 2 && (
            <div className="space-y-4 sm:space-y-6">
              <div className="bg-card rounded-lg shadow border border-border p-4 sm:p-6">
                <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-foreground">Event Details</h2>
                
                {/* Event Name */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-foreground mb-2">Event Name</label>
                  <input
                    type="text"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    placeholder="Enter event name"
                    className="w-full px-3 sm:px-4 py-2.5 text-sm sm:text-base border border-border rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent bg-background text-foreground"
                  />
                  {eventName.length < 3 && eventName.length > 0 && (
                    <p className="text-xs text-red-500 mt-1">Event name must be at least 3 characters.</p>
                  )}
                </div>
                
                {/* Date and Times */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Event Date</label>
                    <input
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="w-full px-3 sm:px-4 py-2.5 text-sm sm:text-base border border-border rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent bg-background text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Start Time</label>
                    <select
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-3 sm:px-4 py-2.5 text-sm sm:text-base border border-border rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent bg-background text-foreground"
                    >
                      <option value="">Select</option>
                      {Array.from({ length: 24 }, (_, i) => (
                        <option key={i} value={`${i.toString().padStart(2, '0')}:00`}>
                          {`${i.toString().padStart(2, '0')}:00`}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">End Time</label>
                    <select
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full px-3 sm:px-4 py-2.5 text-sm sm:text-base border border-border rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent bg-background text-foreground"
                    >
                      <option value="">Select</option>
                      {Array.from({ length: 24 }, (_, i) => (
                        <option key={i} value={`${i.toString().padStart(2, '0')}:30`}>
                          {`${i.toString().padStart(2, '0')}:30`}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                {/* Event Types and Music Genres */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Event Types</label>
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
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Capacity</label>
                    <input
                      type="number"
                      value={capacity}
                      onChange={(e) => setCapacity(e.target.value)}
                      placeholder="Expected number of guests"
                      className="w-full px-3 sm:px-4 py-2.5 text-sm sm:text-base border border-border rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent bg-background text-foreground"
                    />
                  </div>
                </div>
                
                {/* Music Genres */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-foreground mb-2">Music Genres</label>
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
                  <label className="block text-sm font-medium text-foreground mb-2">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your event..."
                    rows={4}
                    maxLength={5000}
                    className="w-full px-3 sm:px-4 py-2.5 text-sm sm:text-base border border-border rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent bg-background text-foreground resize-none"
                  />
                  <p className="text-xs text-muted-foreground mt-1">{description.length}/5000 characters</p>
                </div>
                
                {/* Special Requests */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-foreground mb-2">Special Requests</label>
                  <textarea
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    placeholder="Any special requests or requirements..."
                    rows={3}
                    className="w-full px-3 sm:px-4 py-2.5 text-sm sm:text-base border border-border rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent bg-background text-foreground resize-none"
                  />
                </div>
                
                {/* Link Option */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-foreground mb-2">Link Option</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={linkOption === "playlist"}
                        onChange={() => setLinkOption("playlist")}
                        className="w-4 h-4 text-red-600 focus:ring-2 focus:ring-red-600"
                      />
                      <span className="text-sm text-foreground">Favorite Playlist Link</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={linkOption === "individual"}
                        onChange={() => setLinkOption("individual")}
                        className="w-4 h-4 text-red-600 focus:ring-2 focus:ring-red-600"
                      />
                      <span className="text-sm text-foreground">Links for Each Song</span>
                    </label>
                  </div>
                </div>
                
                {/* Playlist Link */}
                {linkOption === "playlist" && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-foreground mb-2">Playlist Link</label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={playlistLink}
                        onChange={(e) => setPlaylistLink(e.target.value)}
                        placeholder="https://..."
                        className="flex-1 px-3 sm:px-4 py-2.5 text-sm sm:text-base border border-border rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent bg-background text-foreground"
                      />
                      <Button className="bg-accent text-foreground hover:bg-muted px-4">Add Link</Button>
                    </div>
                  </div>
                )}
                
                {/* Opening Dance Music */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-foreground mb-2">Opening Dance Music</label>
                  <div className="flex gap-4 mb-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={openingDanceOption === "upload"}
                        onChange={() => setOpeningDanceOption("upload")}
                        className="w-4 h-4 text-red-600 focus:ring-2 focus:ring-red-600"
                      />
                      <span className="text-sm text-foreground">Upload File</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={openingDanceOption === "link"}
                        onChange={() => setOpeningDanceOption("link")}
                        className="w-4 h-4 text-red-600 focus:ring-2 focus:ring-red-600"
                      />
                      <span className="text-sm text-foreground">Add Link</span>
                    </label>
                  </div>
                  {openingDanceOption === "upload" ? (
                    <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                      <input
                        type="file"
                        accept="audio/*"
                        onChange={(e) => setOpeningDanceFile(e.target.files?.[0] || null)}
                        className="hidden"
                        id="opening-dance-upload"
                      />
                      <label htmlFor="opening-dance-upload" className="cursor-pointer">
                        <p className="text-sm text-muted-foreground">
                          {openingDanceFile ? openingDanceFile.name : 'Choose file No file chosen'}
                        </p>
                      </label>
                    </div>
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
                  <label className="block text-sm font-medium text-foreground mb-2">Last Song Music</label>
                  <div className="flex gap-4 mb-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={lastSongOption === "upload"}
                        onChange={() => setLastSongOption("upload")}
                        className="w-4 h-4 text-red-600 focus:ring-2 focus:ring-red-600"
                      />
                      <span className="text-sm text-foreground">Upload File</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={lastSongOption === "link"}
                        onChange={() => setLastSongOption("link")}
                        className="w-4 h-4 text-red-600 focus:ring-2 focus:ring-red-600"
                      />
                      <span className="text-sm text-foreground">Add Link</span>
                    </label>
                  </div>
                  {lastSongOption === "upload" ? (
                    <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                      <input
                        type="file"
                        accept="audio/*"
                        onChange={(e) => setLastSongFile(e.target.files?.[0] || null)}
                        className="hidden"
                        id="last-song-upload"
                      />
                      <label htmlFor="last-song-upload" className="cursor-pointer">
                        <p className="text-sm text-muted-foreground">
                          {lastSongFile ? lastSongFile.name : 'Choose file No file chosen'}
                        </p>
                      </label>
                    </div>
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
                  <label className="block text-sm font-medium text-foreground mb-2">DJ Dress Code Preference (e.g. Formal or theme)</label>
                  <input
                    type="text"
                    value={dressCode}
                    onChange={(e) => setDressCode(e.target.value)}
                    placeholder="e.g. Formal, Casual, Theme-based"
                    className="w-full px-3 sm:px-4 py-2.5 text-sm sm:text-base border border-border rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent bg-background text-foreground"
                  />
                </div>
                
                {/* Event Venue Address */}
                <div className="border-t border-border pt-4">
                  <h3 className="text-lg font-semibold text-foreground mb-3">Event Venue Address</h3>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Street Name</label>
                      <input
                        type="text"
                        value={streetName}
                        onChange={(e) => setStreetName(e.target.value)}
                        className="w-full px-3 sm:px-4 py-2.5 text-sm sm:text-base border border-border rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent bg-background text-foreground"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">House Number</label>
                        <input
                          type="text"
                          value={houseNumber}
                          onChange={(e) => setHouseNumber(e.target.value)}
                          className="w-full px-3 sm:px-4 py-2.5 text-sm sm:text-base border border-border rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent bg-background text-foreground"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">House Number Extension</label>
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
                        <label className="block text-sm font-medium text-foreground mb-2">Postal Code</label>
                        <input
                          type="text"
                          value={postalCode}
                          onChange={(e) => setPostalCode(e.target.value)}
                          className="w-full px-3 sm:px-4 py-2.5 text-sm sm:text-base border border-border rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent bg-background text-foreground"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">City</label>
                        <input
                          type="text"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="w-full px-3 sm:px-4 py-2.5 text-sm sm:text-base border border-border rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent bg-background text-foreground"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Country</label>
                      <input
                        type="text"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        className="w-full px-3 sm:px-4 py-2.5 text-sm sm:text-base border border-border rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent bg-background text-foreground"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Equipment Selection */}
              <div className="bg-card rounded-lg shadow border border-border p-4 sm:p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Equipment Selection</h3>
                
                {/* Basic DJ Package */}
                <div className={`border-2 rounded-lg p-4 mb-4 cursor-pointer transition-colors ${
                  selectedEquipment.includes("basic") 
                    ? 'border-red-500 bg-red-500/5' 
                    : 'border-border hover:border-muted-foreground'
                }`}
                onClick={() => {
                  setSelectedEquipment(prev => 
                    prev.includes("basic") ? prev.filter(e => e !== "basic") : [...prev, "basic"]
                  )
                }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Speaker className="w-5 h-5 text-red-500" />
                      <h4 className="font-semibold text-foreground">Basic DJ Package</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-accent text-foreground rounded-full text-sm font-medium">€450/day</span>
                      {selectedEquipment.includes("basic") && (
                        <div className="w-5 h-5 bg-red-500 rounded flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3">Complete Setup for Small to Medium Events</p>
                  
                  <p className="text-xs text-foreground mb-3">
                    Everything you need for a professional DJ setup in one package. Perfect for parties, small weddings, and corporate events up to 150 people.
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex gap-2">
                      <img src="/placeholder.svg?height=40&width=40" alt="Pioneer" className="w-10 h-10 object-contain" />
                      <div>
                        <p className="text-xs font-medium text-foreground">2x Pioneer CDJ-2000 Players</p>
                        <p className="text-xs text-muted-foreground">Professional-grade media players</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <img src="/placeholder.svg?height=40&width=40" alt="Mixer" className="w-10 h-10 object-contain" />
                      <div>
                        <p className="text-xs font-medium text-foreground">DJM-900NXS2 Mixer</p>
                        <p className="text-xs text-muted-foreground">Industry standard 4-channel mixer</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <img src="/placeholder.svg?height=40&width=40" alt="Table" className="w-10 h-10 object-contain" />
                      <div>
                        <p className="text-xs font-medium text-foreground">DJ Table with Cover</p>
                        <p className="text-xs text-muted-foreground">Professional setup with cable management</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <img src="/placeholder.svg?height=40&width=40" alt="Microphone" className="w-10 h-10 object-contain" />
                      <div>
                        <p className="text-xs font-medium text-foreground">Shure SM58 Microphone</p>
                        <p className="text-xs text-muted-foreground">Professional vocal microphone with stand</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <img src="/placeholder.svg?height=40&width=40" alt="Speakers" className="w-10 h-10 object-contain" />
                      <div>
                        <p className="text-xs font-medium text-foreground">2x QSC K12.2 Speakers</p>
                        <p className="text-xs text-muted-foreground">Powerful 2000W speakers with stands</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <img src="/placeholder.svg?height=40&width=40" alt="Lighting" className="w-10 h-10 object-contain" />
                      <div>
                        <p className="text-xs font-medium text-foreground">Basic Lighting Package</p>
                        <p className="text-xs text-muted-foreground">2 moving heads, 2 par cans, and controller</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Additional Equipment Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {/* Pioneer CDJ-3000 */}
                  <div className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                    selectedEquipment.includes("cdj3000") 
                      ? 'border-red-500 bg-red-500/5' 
                      : 'border-border hover:border-muted-foreground'
                  }`}
                  onClick={() => {
                    setSelectedEquipment(prev => 
                      prev.includes("cdj3000") ? prev.filter(e => e !== "cdj3000") : [...prev, "cdj3000"]
                    )
                  }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Speaker className="w-4 h-4 text-muted-foreground" />
                        <h4 className="text-sm font-semibold text-foreground">Pioneer CDJ-3000 (Pair)</h4>
                      </div>
                      {selectedEquipment.includes("cdj3000") && (
                        <div className="w-4 h-4 bg-red-500 rounded flex items-center justify-center flex-shrink-0">
                          <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">Latest CDJ model in excellent condition. Perfect for professional events. Includes all necessary cables.</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-foreground">€150/day</span>
                    </div>
                  </div>
                  
                  {/* DJM-900NXS2 Mixer */}
                  <div className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                    selectedEquipment.includes("mixer") 
                      ? 'border-red-500 bg-red-500/5' 
                      : 'border-border hover:border-muted-foreground'
                  }`}
                  onClick={() => {
                    setSelectedEquipment(prev => 
                      prev.includes("mixer") ? prev.filter(e => e !== "mixer") : [...prev, "mixer"]
                    )
                  }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Speaker className="w-4 h-4 text-muted-foreground" />
                        <h4 className="text-sm font-semibold text-foreground">DJM-900NXS2 Mixer</h4>
                      </div>
                      {selectedEquipment.includes("mixer") && (
                        <div className="w-4 h-4 bg-red-500 rounded flex items-center justify-center flex-shrink-0">
                          <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">Industry standard 4-channel mixer. Excellent condition with all features working perfectly.</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-foreground">€80/day</span>
                    </div>
                  </div>
                  
                  {/* QSC Speakers */}
                  <div className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                    selectedEquipment.includes("speakers") 
                      ? 'border-red-500 bg-red-500/5' 
                      : 'border-border hover:border-muted-foreground'
                  }`}
                  onClick={() => {
                    setSelectedEquipment(prev => 
                      prev.includes("speakers") ? prev.filter(e => e !== "speakers") : [...prev, "speakers"]
                    )
                  }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Speaker className="w-4 h-4 text-muted-foreground" />
                        <h4 className="text-sm font-semibold text-foreground">QSC K12.2 Speakers (Pair)</h4>
                      </div>
                      {selectedEquipment.includes("speakers") && (
                        <div className="w-4 h-4 bg-red-500 rounded flex items-center justify-center flex-shrink-0">
                          <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">Powerful 2000W speakers with stands. Great for medium to large venues up to 200 people.</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-foreground">€120/day</span>
                    </div>
                  </div>
                  
                  {/* Complete Lighting Package */}
                  <div className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                    selectedEquipment.includes("lighting") 
                      ? 'border-red-500 bg-red-500/5' 
                      : 'border-border hover:border-muted-foreground'
                  }`}
                  onClick={() => {
                    setSelectedEquipment(prev => 
                      prev.includes("lighting") ? prev.filter(e => e !== "lighting") : [...prev, "lighting"]
                    )
                  }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Speaker className="w-4 h-4 text-muted-foreground" />
                        <h4 className="text-sm font-semibold text-foreground">Complete Lighting Package</h4>
                      </div>
                      {selectedEquipment.includes("lighting") && (
                        <div className="w-4 h-4 bg-red-500 rounded flex items-center justify-center flex-shrink-0">
                          <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">Includes 4 moving heads, 2 par cans, fog machine, and DMX controller. Perfect for creating atmosphere.</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-foreground">€180/day</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Navigation Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={() => setCurrentStep(1)}
                  className="px-6 py-3 bg-accent text-foreground hover:bg-muted"
                >
                  Back
                </Button>
                <Button
                  onClick={() => setCurrentStep(3)}
                  disabled={!eventName || eventName.length < 3}
                  className="flex-1 py-3 text-base font-semibold bg-red-600 hover:bg-red-700 text-white disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed"
                >
                  Continue to Personal Details
                </Button>
              </div>
            </div>
          )}

          {/* Step 3 - Personal Details */}
          {currentStep === 3 && (
            <div className="space-y-4 sm:space-y-6">
              <div className="bg-card rounded-lg shadow border border-border p-4 sm:p-6">
                <h2 className="text-xl sm:text-2xl font-bold mb-2 text-foreground">Persoonlijke gegevens</h2>
                <p className="text-sm text-muted-foreground mb-6">Vul je gegevens in zodat de professional contact met je kan opnemen.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="space-y-2 text-sm font-medium text-foreground">Voornaam<input required value={firstName} onChange={(event) => setFirstName(event.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2" placeholder="Voornaam" /></label>
                  <label className="space-y-2 text-sm font-medium text-foreground">Achternaam<input required value={lastName} onChange={(event) => setLastName(event.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2" placeholder="Achternaam" /></label>
                  <label className="space-y-2 text-sm font-medium text-foreground">E-mailadres<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2" placeholder="jij@voorbeeld.nl" /></label>
                  <label className="space-y-2 text-sm font-medium text-foreground">Telefoonnummer<input required type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2" placeholder="06 12345678" /></label>
                </div>
                <div className="mt-6 border-t border-border pt-5">
                  <h3 className="font-semibold text-foreground">Factuurgegevens</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Deze gegevens gebruiken we om de factuur op te stellen.</p>
                  <div className="mt-4 flex gap-2" role="radiogroup" aria-label="Type klant">
                    <button type="button" onClick={() => setCustomerType("private")} className={`rounded-md border px-4 py-2 text-sm ${customerType === "private" ? "border-red-500 bg-red-500/10" : "border-border"}`}>Particulier</button>
                    <button type="button" onClick={() => setCustomerType("business")} className={`rounded-md border px-4 py-2 text-sm ${customerType === "business" ? "border-red-500 bg-red-500/10" : "border-border"}`}>Zakelijk</button>
                  </div>
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {customerType === "business" && <label className="space-y-2 text-sm font-medium text-foreground sm:col-span-2">Bedrijfsnaam<input required value={companyName} onChange={(event) => setCompanyName(event.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2" placeholder="Bedrijfsnaam" /></label>}
                    <label className="space-y-2 text-sm font-medium text-foreground">Straat<input required value={billingStreet} onChange={(event) => setBillingStreet(event.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2" placeholder="Straatnaam" /></label>
                    <label className="space-y-2 text-sm font-medium text-foreground">Huisnummer<input required value={billingHouseNumber} onChange={(event) => setBillingHouseNumber(event.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2" placeholder="12A" /></label>
                    <label className="space-y-2 text-sm font-medium text-foreground">Postcode<input required value={billingPostalCode} onChange={(event) => setBillingPostalCode(event.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2" placeholder="1234 AB" /></label>
                    <label className="space-y-2 text-sm font-medium text-foreground">Plaats<input required value={billingCity} onChange={(event) => setBillingCity(event.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2" placeholder="Amsterdam" /></label>
                    <label className="space-y-2 text-sm font-medium text-foreground">Land<select value={billingCountry} onChange={(event) => setBillingCountry(event.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2"><option>Nederland</option><option>België</option><option>Duitsland</option><option>Anders</option></select></label>
                    {customerType === "business" && <label className="space-y-2 text-sm font-medium text-foreground">BTW-nummer<input required value={vatNumber} onChange={(event) => setVatNumber(event.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2" placeholder="NL123456789B01" /></label>}
                  </div>
                </div>
              </div>
              <div className="flex gap-3"><Button onClick={() => setCurrentStep(2)} className="px-6 bg-accent text-foreground">Terug</Button><Button onClick={() => setCurrentStep(4)} disabled={!firstName.trim() || !lastName.trim() || !email.includes("@") || !phone.trim() || !billingStreet.trim() || !billingHouseNumber.trim() || !billingPostalCode.trim() || !billingCity.trim() || (customerType === "business" && (!companyName.trim() || !vatNumber.trim()))} className="flex-1 bg-red-600 hover:bg-red-700 text-white">Naar overzicht</Button></div>
            </div>
          )}

          {/* Step 4 - Overview and payment */}
          {currentStep === 4 && (
            <div className="space-y-4 sm:space-y-6">
              <div className="bg-card rounded-lg shadow border border-border p-4 sm:p-6">
                <h2 className="text-xl sm:text-2xl font-bold mb-5 text-foreground">Overzicht & betaling</h2>
                <div className="space-y-3 text-sm border-b border-border pb-4">
                  <div className="flex justify-between"><span className="text-muted-foreground">Professional</span><span className="font-medium text-foreground">{professional.name}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Datum</span><span className="font-medium text-foreground">{formatSelectedDate()}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Locatie</span><span className="font-medium text-foreground">{eventLocation}</span></div>
                  <div className="flex justify-between gap-4"><span className="text-muted-foreground">Factuuradres</span><span className="text-right font-medium text-foreground">{customerType === "business" ? `${companyName}, ` : ""}{billingStreet} {billingHouseNumber}, {billingPostalCode} {billingCity}, {billingCountry}</span></div>
                  {customerType === "business" && <div className="flex justify-between"><span className="text-muted-foreground">BTW-nummer</span><span className="font-medium text-foreground">{vatNumber}</span></div>}
                  <div className="flex justify-between"><span className="text-muted-foreground">Optreden ({pricing.hours} uur x {formatEuro(pricing.hourlyRateCents)})</span><span className="font-medium text-foreground">{formatEuro(pricing.performanceCents)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Apparatuur</span><span className="font-medium text-foreground">{formatEuro(pricing.equipmentCents)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Reiskosten ({(distance ?? 0) * 2} km retour)</span><span className="font-medium text-foreground">{formatEuro(pricing.travelCents)}</span></div>
                  <div className="flex justify-between text-base pt-2"><span className="font-bold text-foreground">Prijsindicatie</span><span className="font-bold text-red-500">{formatEuro(pricing.totalCents)}</span></div>
                  <p className="text-xs text-muted-foreground">Dit is een indicatie. De professional bevestigt het definitieve bedrag zodra je aanvraag is geaccepteerd. Je betaalt pas na acceptatie.</p>
                </div>
                <div className="mt-5"><h3 className="font-semibold text-foreground mb-3">Betaalmethode</h3><div className="grid gap-3 sm:grid-cols-3">{([['ideal', 'iDEAL'], ['card', 'Creditcard'], ['invoice', 'Factuur'] ] as const).map(([value, label]) => <button type="button" key={value} onClick={() => setPaymentMethod(value)} className={`rounded-md border p-3 text-left text-sm ${paymentMethod === value ? "border-red-500 bg-red-500/10" : "border-border"}`}><CreditCard className="mb-2 h-4 w-4" />{label}</button>)}</div></div>
                <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground"><LockKeyhole className="h-4 w-4" />Je gegevens worden veilig verwerkt.</div>
              </div>
              {submitError && (
                <div role="alert" className="flex items-start gap-2 rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-500">
                  <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}
              <div className="flex gap-3"><Button onClick={() => setCurrentStep(3)} disabled={submitting} className="px-6 bg-accent text-foreground">Terug</Button><Button onClick={handleSubmitBooking} disabled={submitting || !effectiveEventDate} className="flex-1 bg-red-600 hover:bg-red-700 text-white">{submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Versturen...</> : "Bevestig boeking"}</Button></div>
            </div>
          )}

          {/* Step 5 - Confirmation */}
          {currentStep === 5 && (
            <div className="bg-card rounded-lg shadow border border-border p-8 text-center"><CheckCircle2 className="mx-auto h-16 w-16 text-green-500" /><h2 className="mt-4 text-2xl font-bold text-foreground">Boekingsaanvraag verzonden</h2><p className="mx-auto mt-3 max-w-lg text-muted-foreground">Bedankt {firstName || "voor je aanvraag"}. We hebben je aanvraag ontvangen en doorgestuurd naar {professional.name}. Je vindt de status en de reactie van de professional in je eigen dashboard.</p>{bookingId && <p className="mt-3 text-sm text-muted-foreground">Aanvraagnummer <span className="font-mono font-medium text-foreground">#{bookingId.toString().padStart(5, "0")}</span></p>}<Button onClick={() => router.push(bookingId ? `/account/boekingen/${bookingId}` : "/account/boekingen")} className="mt-6 bg-red-600 hover:bg-red-700 text-white">Bekijk mijn boeking</Button></div>
          )}
        </div>
      </div>
    </div>
  )
}
