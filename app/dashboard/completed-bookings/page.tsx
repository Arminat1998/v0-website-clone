"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Calendar, MapPin, Star } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

interface CompletedBooking {
  id: number
  clientName: string
  date: string
  location: string
  message: string
  rating: number
}

const completedBookings: CompletedBooking[] = [
  {
    id: 1,
    clientName: "Sophie van Dijk",
    date: "2025-04-05 – 20:00",
    location: "Eindhoven",
    message: "Heel erg bedankt voor het geweldige optreden!",
    rating: 5,
  },
  {
    id: 2,
    clientName: "Tom de Vries",
    date: "2025-03-21 – 22:00",
    location: "Amsterdam",
    message: "Iedereen was aan het dansen. Topavond!",
    rating: 4,
  },
]

export default function CompletedBookingsPage() {
  const { t } = useLanguage()
  
  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 md:p-8 lg:p-10 bg-background min-h-screen">
        {/* Header */}
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-4 sm:mb-6 md:mb-8">
          {t.completedBookingsTitle}
        </h1>

        {/* Completed Bookings List */}
        <div className="space-y-3 sm:space-y-4">
          {completedBookings.map((booking) => (
            <div
              key={booking.id}
              className="bg-card rounded-lg border border-border p-4 sm:p-5 md:p-6 hover:bg-accent transition-colors"
            >
              {/* Header with Name and Rating */}
              <div className="flex items-start justify-between gap-3 sm:gap-4 mb-2 sm:mb-3">
                <h2 className="text-base sm:text-lg md:text-xl font-semibold text-foreground">
                  {booking.clientName}
                </h2>
                
                {/* Star Rating */}
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 sm:w-5 sm:h-5 ${
                        star <= booking.rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "fill-muted text-muted"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Date and Location */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2 md:gap-4 text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
                  <span>{booking.date}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
                  <span>{booking.location}</span>
                </div>
              </div>

              {/* Client Message/Review */}
              <p className="text-sm sm:text-base text-foreground mb-2 sm:mb-3">{booking.message}</p>

              {/* Completion Message */}
              <p className="text-xs sm:text-sm text-muted-foreground italic">
                {t.bookingCompleted}
              </p>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {completedBookings.length === 0 && (
          <div className="bg-card rounded-lg border border-border p-6 sm:p-8 text-center">
            <p className="text-sm sm:text-base text-muted-foreground">Geen afgeronde bookingen gevonden.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
