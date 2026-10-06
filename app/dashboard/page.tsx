import { DashboardLayout } from "@/components/dashboard-layout"
import { DashboardOverview } from "@/components/dashboard/dashboard-overview"
import { getDashboardSummary } from "@/app/actions/bookings"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const summary = await getDashboardSummary()

  return (
    <DashboardLayout>
      <DashboardOverview summary={summary} />
    </DashboardLayout>
  )
}
