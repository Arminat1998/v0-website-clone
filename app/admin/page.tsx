import { AdminOverview } from "@/components/admin/overview-client"
import { ModerationStatsCards } from "@/components/admin/moderation-stats"
import { getModerationStats } from "@/lib/admin/users"

export default async function AdminOverviewPage() {
  const stats = await getModerationStats()
  return (
    <>
      <AdminOverview />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <ModerationStatsCards stats={stats} />
      </div>
    </>
  )
}
