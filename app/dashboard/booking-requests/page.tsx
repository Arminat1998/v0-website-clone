"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Calendar, MapPin } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

interface BookingRequest {
  id: string
  name: string
  date: string
  time: string
  location: string
  message: string
  status: "pending" | "accepted" | "declined"
}

const initialBookings: BookingRequest[] = [
  {
    id: "1",
    name: "Lisa Jansen",
    date: "2025-05-12",
    time: "20:00",
    location: "Amsterdam",
    message: "We willen graag een DJ voor onze bruiloft in de avonduren.",
    status: "pending",
  },
  {
    id: "2",
    name: "Mark de Groot",
    date: "2025-06-04",
    time: "18:00",
    location: "Rotterdam",
    message: "DJ nodig voor bedrijfsfeest in restaurant.",
    status: "pending",
  },
]

export default function BookingRequestsPage() {
  const { t } = useLanguage()
  const [bookings, setBookings] = useState<BookingRequest[]>(initialBookings)

  const handleAccept = (id: string) => {
    console.log("[v0] Accepting booking:", id)
    setBookings((prev) =>
      prev.map((booking) =>
        booking.id === id ? { ...booking, status: "accepted" as const } : booking
      )
    )
  }

  const handleDecline = (id: string) => {
    console.log("[v0] Declining booking:", id)
    setBookings((prev) =>
      prev.map((booking) =>
        booking.id === id ? { ...booking, status: "declined" as const } : booking
      )
    )
  }

  // Filter to show only pending bookings
  const pendingBookings = bookings.filter((booking) => booking.status === "pending")

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 lg:p-10 bg-background min-h-screen">
        {/* Header */}
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-6 md:mb-8">
          {t.bookingRequestsTitle}
        </h1>

        {/* Booking Requests List */}
        {pendingBookings.length === 0 ? (
          <div className="bg-card rounded-lg border border-border p-8 text-center">
            <p className="text-muted-foreground">Geen boekingsaanvragen op dit moment.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingBookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-card rounded-lg border border-border p-5 md:p-6 relative hover:bg-accent transition-colors"
              >
                {/* Status Badge */}
                <div className="absolute top-5 right-5">
                  <span className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-amber-500/10 text-amber-500">
                    {t.pending}
                  </span>
                </div>

                {/* Booking Details */}
                <div className="pr-24">
                  <h3 className="text-lg md:text-xl font-semibold text-foreground mb-3">
                    {booking.name}
                  </h3>

                  {/* Date and Time */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Calendar className="w-4 h-4 flex-shrink-0" />
                    <span>
                      {booking.date} – {booking.time}
                    </span>
                  </div>

                  {/* Location */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span>{booking.location}</span>
                  </div>

                  {/* Message */}
                  <p className="text-foreground mb-5">{booking.message}</p>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleAccept(booking.id)}
                      className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors text-sm md:text-base"
                    >
                      {t.accept}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDecline(booking.id)}
                      className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors text-sm md:text-base"
                    >
                      {t.decline}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
