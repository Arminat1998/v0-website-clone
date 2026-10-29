import { Header } from "@/components/header"
import { CustomerBookings } from "@/components/customer-bookings"
import { getMyBookings } from "@/app/actions/bookings"
import { requireUser } from "@/lib/session"

export const dynamic = "force-dynamic"

export default async function MyBookingsPage() {
  await requireUser()
  const bookings = await getMyBookings()

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
        <CustomerBookings bookings={bookings} />
      </main>
    </div>
  )
}
