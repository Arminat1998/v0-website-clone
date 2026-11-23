import { DashboardLayout } from "@/components/dashboard-layout"
import { DashboardOverview } from "@/components/dashboard/dashboard-overview"
import { getDashboardSummary } from "@/app/actions/bookings"
import { requireProfessionalUser } from "@/lib/session"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  await requireProfessionalUser()
  const summary = await getDashboardSummary()

  return (
    <DashboardLayout>
      <DashboardOverview summary={summary} />
    </DashboardLayout>
  )
}
