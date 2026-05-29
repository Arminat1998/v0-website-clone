"use client"

import Link from "next/link"

import { useState } from "react"
import { X, MapPin, Star, MessageCircle, ChevronLeft, ChevronRight } from "lucide-react"
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Photographer } from "@/lib/smart-search"

interface PhotoVideoProfileModalProps {
  professional: Photographer | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PhotoVideoProfileModal({ professional, open, onOpenChange }: PhotoVideoProfileModalProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [selectedDate, setSelectedDate] = useState<number | null>(null)

  if (!professional) return null

  const heroImage =
    professional.image ||
    `/placeholder.svg?height=400&width=800&query=${encodeURIComponent(professional.name)} portfolio`
  const profileImage =
    professional.image ||
    `/placeholder.svg?height=144&width=144&query=${encodeURIComponent(professional.name)} profile portrait`

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (month: number, year: number) => {
    const day = new Date(year, month, 1).getDay()
    return day === 0 ? 6 : day - 1
  }

  const isDateUnavailable = (day: number) => {
    const dateStr = `${currentYear}-${(currentMonth + 1).toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`
    return professional.unavailableDates?.includes(dateStr)
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
      days.push(<div key={`empty-${i}`} className="h-10 w-10"></div>)
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const unavailable = isDateUnavailable(day)
      const isSelected = selectedDate === day
      const isPast = isDateInPast(day)

      let dayClasses = "h-10 w-10 text-sm rounded-md flex items-center justify-center transition-colors "

      if (isPast) {
        dayClasses += "bg-zinc-500 dark:bg-zinc-800 text-zinc-300 dark:text-zinc-500 cursor-not-allowed line-through"
      } else if (unavailable) {
        dayClasses += "bg-red-600 dark:bg-red-500 text-white font-medium cursor-not-allowed"
      } else if (isSelected) {
        dayClasses += "bg-green-600 dark:bg-green-500 text-white font-medium ring-2 ring-green-400 dark:ring-green-300"
      } else {
        dayClasses +=
          "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600 cursor-pointer bg-zinc-200 dark:bg-zinc-700"
      }

      days.push(
        <button
          key={day}
          onClick={() => !unavailable && !isPast && setSelectedDate(isSelected ? null : day)}
          disabled={unavailable || isPast}
          className={dayClasses}
        >
          {day}
        </button>,
      )
    }

    return days
  }

  const formatSelectedDate = () => {
    if (!selectedDate) return "Select a Date"
    const date = new Date(currentYear, currentMonth, selectedDate)
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
    setSelectedDate(null)
  }

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
    setSelectedDate(null)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-[600px] md:max-w-[900px] lg:max-w-[1200px] xl:max-w-[1400px] max-h-[95vh] sm:max-h-[90vh] overflow-y-auto p-0 bg-background">
        <div className="relative">
          <div className="relative h-48 sm:h-56 md:h-64">
            <img src={heroImage || "/placeholder.svg"} alt={professional.name} className="w-full h-full object-cover" />
            <DialogClose className="absolute top-4 right-4 rounded-full bg-red-700 text-white p-2 hover:bg-red-600 transition-colors z-10">
              <X className="h-4 w-4" />
            </DialogClose>
          </div>

          <div className="absolute left-4 sm:left-6 top-[120px] sm:top-[152px] md:top-[176px] w-24 h-24 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-full border-4 sm:border-[6px] border-background bg-background z-30 overflow-hidden shadow-lg">
            <img
              src={profileImage || "/placeholder.svg"}
              alt={professional.name}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <div className="px-4 sm:px-6 pb-6 pt-14 sm:pt-16 md:pt-20">
          <div className="mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold mb-1 text-foreground">{professional.name}</h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-3">{professional.specialty}</p>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 sm:w-5 sm:h-5 ${
                      i < Math.floor(professional.rating) ? "fill-yellow-400 text-yellow-400" : "fill-muted text-muted"
                    }`}
                  />
                ))}
              </div>
              <span className="font-semibold text-base sm:text-lg text-foreground">{professional.rating}</span>
              <a href="#" className="text-sm sm:text-base text-blue-600 dark:text-blue-400 hover:underline">
                ({professional.reviews} reviews)
              </a>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button className="bg-red-700 hover:bg-red-600 text-white w-full sm:w-auto">
                <MessageCircle className="w-4 h-4 mr-2" />
                Chat
              </Button>
              <Button
                variant="outline"
                className="w-full sm:w-auto bg-transparent border-border text-foreground hover:bg-accent"
              >
                Book Now
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <div className="border-2 border-border rounded-xl p-4 sm:p-6 bg-card">
              <div className="text-sm text-muted-foreground mb-2">Per Hour</div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-3xl sm:text-4xl font-bold text-red-600">€</span>
                <span className="text-3xl sm:text-4xl font-bold text-foreground">
                  {professional.price.replace("€", "").trim()}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">excl. equipment</div>
            </div>

            <div className="border-2 border-border rounded-xl p-4 sm:p-6 bg-card">
              <div className="text-sm text-muted-foreground mb-2">Location</div>
              <div className="flex items-start gap-2">
                <MapPin className="w-5 h-5 text-red-600 flex-shrink-0 mt-1" />
                <div className="text-xl sm:text-2xl font-bold text-foreground">{professional.location}</div>
              </div>
            </div>

            <div className="border-2 border-border rounded-xl p-4 sm:p-6 bg-card">
              <div className="text-sm text-muted-foreground mb-2">Experience</div>
              <div className="text-xl sm:text-2xl font-bold text-foreground">10+ years</div>
            </div>

            <div className="border-2 border-border rounded-xl p-4 sm:p-6 bg-card">
              <div className="text-sm text-muted-foreground mb-2">Status</div>
              <div className="text-xl sm:text-2xl font-bold text-green-600">
                {professional.available ? "Available" : "Unavailable"}
              </div>
            </div>
          </div>

          <Tabs defaultValue="about" className="w-full">
            <TabsList className="w-full justify-start h-auto p-0 bg-transparent gap-0 mb-6 overflow-x-auto flex-nowrap">
              <TabsTrigger
                value="about"
                className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=inactive]:bg-muted px-4 sm:px-8 py-3 font-medium text-sm sm:text-base whitespace-nowrap text-foreground"
              >
                About
              </TabsTrigger>
              <TabsTrigger
                value="portfolio"
                className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=inactive]:bg-muted px-4 sm:px-8 py-3 font-medium text-sm sm:text-base whitespace-nowrap text-foreground"
              >
                Portfolio
              </TabsTrigger>
              <TabsTrigger
                value="equipment"
                className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=inactive]:bg-muted px-4 sm:px-8 py-3 font-medium text-sm sm:text-base whitespace-nowrap text-foreground"
              >
                Equipment
              </TabsTrigger>
              <TabsTrigger
                value="availability"
                className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=inactive]:bg-muted px-4 sm:px-8 py-3 font-medium text-sm sm:text-base whitespace-nowrap text-foreground"
              >
                Availability
              </TabsTrigger>
            </TabsList>

            <TabsContent value="about" className="mt-0">
              <h3 className="text-xl sm:text-2xl font-bold mb-4 text-foreground">About</h3>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-8">
                {professional.description ||
                  `Professional photographer and videographer with extensive experience capturing events. Known for delivering high-quality content and exceptional service.`}
              </p>

              <div>
                <h4 className="text-lg sm:text-xl font-bold mb-4 text-foreground">Event Types</h4>
                <div className="flex flex-wrap gap-2">
                  {(professional.eventTypes || []).map((event) => (
                    <button
                      key={event}
                      className="px-3 sm:px-4 py-2 border-2 border-foreground rounded-full text-xs sm:text-sm font-medium hover:bg-accent transition-colors text-foreground"
                    >
                      {event}
                    </button>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="portfolio" className="mt-0">
              <h3 className="text-xl sm:text-2xl font-bold mb-4 text-foreground">Portfolio</h3>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-6">
                View work samples and past projects from this professional photographer and videographer.
              </p>

              <div className="space-y-8">
                {/* Photos Section */}
                <div>
                  <h3 className="text-lg sm:text-xl font-bold mb-4 text-foreground">Photos</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div
                        key={i}
                        className="aspect-square rounded-lg overflow-hidden bg-muted border-2 border-border hover:border-foreground transition-colors cursor-pointer"
                      >
                        <img
                          src={`/portfolio-work-.jpg?key=ictgt&height=300&width=300&query=Portfolio%20work%20${i}`}
                          alt={`Portfolio ${i}`}
                          className="w-full h-full object-cover hover:scale-105 transition-transform"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Videos Section */}
                <div>
                  <h3 className="text-lg sm:text-xl font-bold mb-4 text-foreground">Videos</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[1, 2].map((i) => (
                      <div
                        key={i}
                        className="aspect-video rounded-lg overflow-hidden bg-muted border-2 border-border hover:border-foreground transition-colors cursor-pointer group"
                      >
                        <div className="w-full h-full flex items-center justify-center bg-slate-900 group-hover:scale-105 transition-transform">
                          <svg
                            className="w-12 h-12 text-white opacity-80 group-hover:opacity-100 transition-opacity"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Connect Section */}
                <div>
                  <h3 className="text-lg sm:text-xl font-bold mb-4 text-foreground">Connect</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                    <div className="border-2 border-border rounded-lg p-4 sm:p-6 flex items-center gap-3 hover:border-foreground transition-colors cursor-pointer bg-card">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center flex-shrink-0">
                        <svg viewBox="0 0 24 24" className="w-5 h-5 sm:w-6 sm:h-6 fill-red-600">
                          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93-.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                        </svg>
                      </div>
                      <span className="font-medium text-sm sm:text-base text-foreground">YouTube</span>
                    </div>
                    <div className="border-2 border-border rounded-lg p-4 sm:p-6 flex items-center gap-3 hover:border-foreground transition-colors cursor-pointer bg-card">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center flex-shrink-0">
                        <svg viewBox="0 0 24 24" className="w-5 h-5 sm:w-6 sm:h-6 fill-pink-600">
                          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm3.5 12c0 1.933-1.567 3.5-3.5 3.5S8.5 13.933 8.5 12 10.067 8.5 12 8.5s3.5 1.567 3.5 3.5zm5.5 0c0 .829-.671 1.5-1.5 1.5s-1.5-.671-1.5-1.5.671-1.5 1.5-1.5 1.5.671 1.5 1.5z" />
                        </svg>
                      </div>
                      <span className="font-medium text-sm sm:text-base text-foreground">Instagram</span>
                    </div>
                    <div className="border-2 border-border rounded-lg p-4 sm:p-6 flex items-center gap-3 hover:border-foreground transition-colors cursor-pointer bg-card">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center flex-shrink-0">
                        <svg viewBox="0 0 24 24" className="w-5 h-5 sm:w-6 sm:h-6 fill-blue-600">
                          <path d="M17 2H7c-3.86 0-7 3.14-7 7v11c0 3.86 3.14 7 7 7h10c3.86 0 7-3.14 7-7V9c0-3.86-3.14-7-7-7zm0 12h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" />
                        </svg>
                      </div>
                      <span className="font-medium text-sm sm:text-base text-foreground">Facebook</span>
                    </div>
                    <div className="border-2 border-border rounded-lg p-4 sm:p-6 flex items-center gap-3 hover:border-foreground transition-colors cursor-pointer bg-card">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center flex-shrink-0">
                        <svg viewBox="0 0 24 24" className="w-5 h-5 sm:w-6 sm:h-6 fill-black dark:fill-white">
                          <path d="M22.46 6c-.77.35-1.6.59-2.46.74 1.11-1.31 1.96-3.05 2.46-5.01-.97.58-2.07.96-3.27 1.11-.84-.37-1.74-.53-2.68-.53-3.74 0-6.87 2.53-6.87 6 0 4.42 3.35 7.68 7.59 7.91-.06-.26-.11-.52-.16-.78C7.19 12.71 6.1 10.61 6.1 8c0-3.19 2.55-5.74 5.74-5.74 1.58 0 3.14.35 4.59 1.01z" />
                        </svg>
                      </div>
                      <span className="font-medium text-sm sm:text-base text-foreground">X/Twitter</span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="equipment" className="mt-0">
              <h3 className="text-xl sm:text-2xl font-bold mb-4 text-foreground">Equipment</h3>
              <div className="space-y-4">
                <div className="border-2 border-border rounded-lg p-4 bg-card">
                  <h4 className="font-bold text-foreground mb-2">Camera</h4>
                  <p className="text-sm text-muted-foreground">Professional DSLR & Mirrorless cameras</p>
                </div>
                <div className="border-2 border-border rounded-lg p-4 bg-card">
                  <h4 className="font-bold text-foreground mb-2">Lenses</h4>
                  <p className="text-sm text-muted-foreground">
                    Full range of professional lenses (wide, standard, telephoto)
                  </p>
                </div>
                <div className="border-2 border-border rounded-lg p-4 bg-card">
                  <h4 className="font-bold text-foreground mb-2">Lighting</h4>
                  <p className="text-sm text-muted-foreground">Professional lighting rigs and flashes</p>
                </div>
                <div className="border-2 border-border rounded-lg p-4 bg-card">
                  <h4 className="font-bold text-foreground mb-2">Audio</h4>
                  <p className="text-sm text-muted-foreground">
                    Professional microphones and audio recording equipment
                  </p>
                </div>
                <div className="border-2 border-border rounded-lg p-4 bg-card">
                  <h4 className="font-bold text-foreground mb-2">Drones</h4>
                  <p className="text-sm text-muted-foreground">4K aerial photography and videography drones</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="availability" className="mt-0">
              <h3 className="text-xl sm:text-2xl font-bold mb-6 text-foreground">Availability Calendar</h3>

              <div className="flex flex-wrap items-center gap-4 sm:gap-6 mb-6 p-3 bg-card border border-border rounded-lg w-fit">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded border-2 border-green-600 bg-green-600 flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <span className="text-sm text-foreground">Selected</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded border-2 border-red-600 bg-red-600 flex items-center justify-center">
                    <X className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-sm text-foreground">Unavailable</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-zinc-200 dark:bg-zinc-700"></div>
                  <span className="text-sm text-muted-foreground">Not selected</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-zinc-500 dark:bg-zinc-800 flex items-center justify-center">
                    <span className="text-zinc-300 dark:text-zinc-500 text-xs line-through">31</span>
                  </div>
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">Past</span>
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column - Upcoming Bookings */}
                  <div>
                    <h3 className="text-xl font-semibold text-red-600 mb-4">Upcoming Bookings</h3>
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                      <div className="border-l-4 border-red-500 bg-muted rounded-r-lg p-4">
                        <h4 className="font-semibold text-foreground mb-2">Wedding Photography</h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                          </svg>
                          <span>Saturday, December 20, 2025</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="w-4 h-4 text-red-500" />
                          <span>Amsterdam, Netherlands</span>
                        </div>
                      </div>

                      <div className="border-l-4 border-red-500 bg-muted rounded-r-lg p-4">
                        <h4 className="font-semibold text-foreground mb-2">Corporate Event</h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                          </svg>
                          <span>Monday, December 29, 2025</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="w-4 h-4 text-red-500" />
                          <span>Rotterdam, Netherlands</span>
                        </div>
                      </div>

                      <div className="border-l-4 border-red-500 bg-muted rounded-r-lg p-4">
                        <h4 className="font-semibold text-foreground mb-2">Event Videography</h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                          </svg>
                          <span>Friday, January 16, 2026</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="w-4 h-4 text-red-500" />
                          <span>Utrecht, Netherlands</span>
                        </div>
                      </div>

                      <div className="border-l-4 border-red-500 bg-muted rounded-r-lg p-4">
                        <h4 className="font-semibold text-foreground mb-2">Portrait Session</h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                          </svg>
                          <span>Wednesday, February 5, 2026</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="w-4 h-4 text-red-500" />
                          <span>Groningen, Netherlands</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Calendar */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <button
                        onClick={goToPreviousMonth}
                        className="p-2 rounded-lg bg-secondary hover:bg-accent text-foreground transition-colors"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <span className="text-lg font-semibold text-foreground">
                        {new Date(currentYear, currentMonth).toLocaleDateString("en-US", {
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                      <button
                        onClick={goToNextMonth}
                        className="p-2 rounded-lg bg-secondary hover:bg-accent text-foreground transition-colors"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => (
                        <div key={index} className="text-center text-sm font-medium text-muted-foreground w-10">
                          {day}
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1">{renderCalendar()}</div>

                    <Link
                      href={selectedDate ? `/booking?professionalId=${professional.id}&type=photographer&date=${selectedDate}-${currentMonth + 1}-${currentYear}` : "#"}
                      className={`block w-full mt-3 sm:mt-4 py-2 sm:py-3 rounded-lg font-medium text-sm text-center transition-colors ${
                        selectedDate
                          ? "bg-red-600 hover:bg-red-700 text-white"
                          : "bg-secondary text-muted-foreground cursor-not-allowed pointer-events-none"
                      }`}
                      onClick={(e) => {
                        if (!selectedDate) {
                          e.preventDefault()
                        } else {
                          onOpenChange(false)
                        }
                      }}
                    >
                      {selectedDate ? "Book Now" : "Select a Date"}
                    </Link>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}
