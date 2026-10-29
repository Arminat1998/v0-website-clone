import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { DashboardOverview } from "@/components/dashboard/dashboard-overview"
import { getDashboardSummary } from "@/app/actions/bookings"
import { getProfileRow } from "@/lib/professional-profile"
import { requireProfessionalUser } from "@/lib/session"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const account = await requireProfessionalUser()
  const [summary, profile] = await Promise.all([getDashboardSummary(), getProfileRow(account.id)])

  return (
    <DashboardLayout>
      {!profile && (
        <div className="px-4 pt-16 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 rounded-lg border border-red-500/40 bg-red-500/10 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-foreground">
              Je profiel is nog niet opgeslagen. Vul je gegevens, apparatuur en foto&apos;s in zodat ze op je dashboard
              en openbare pagina verschijnen.
            </p>
            <Link
              href="/dashboard/edit-profile"
              className="shrink-0 rounded-md bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600"
            >
              Profiel invullen
            </Link>
          </div>
        </div>
      )}
      <DashboardOverview summary={summary} />
    </DashboardLayout>
  )
}
