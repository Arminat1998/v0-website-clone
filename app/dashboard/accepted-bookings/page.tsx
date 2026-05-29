"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Calendar, MapPin, Check } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

// Mock accepted bookings data
const acceptedBookings = [
  {
    id: 1,
    clientName: "Lisa Jansen",
    date: "2025-05-20",
    time: "19:00",
    location: "Utrecht",
    message: "We kijken ernaar uit om je te verwelkomen op onze bruiloft!",
  },
  {
    id: 2,
    clientName: "Mark de Groot",
    date: "2025-06-02",
    time: "21:00",
    location: "Rotterdam",
    message: "Je draait op ons bedrijfsfeest. Alles staat al klaar!",
  },
]

export default function AcceptedBookingsPage() {
  const { t } = useLanguage()
  
  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 lg:p-10 bg-background min-h-screen">
        {/* Header */}
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-6 md:mb-8">
          {t.acceptedBookingsTitle}
        </h1>

        {/* Bookings List */}
        <div className="space-y-4 md:space-y-6">
          {acceptedBookings.length === 0 ? (
            <div className="bg-card rounded-lg border border-border p-8 text-center">
              <p className="text-muted-foreground">Geen geaccepteerde bookingen op dit moment.</p>
            </div>
          ) : (
            acceptedBookings.map((booking) => (
              <div key={booking.id} className="bg-card rounded-lg border border-border p-5 md:p-6 hover:bg-accent transition-colors">
                {/* Client Name */}
                <h3 className="text-lg md:text-xl font-semibold text-foreground mb-3">
                  {booking.clientName}
                </h3>

                {/* Date & Location */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span>
                      {booking.date} - {booking.time}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span>{booking.location}</span>
                  </div>
                </div>

                {/* Message */}
                <p className="text-foreground mb-4">{booking.message}</p>

                {/* Confirmed Status */}
                <div className="flex items-center gap-2 text-green-600">
                  <Check className="w-5 h-5" />
                  <span className="font-medium">{t.confirmed}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
