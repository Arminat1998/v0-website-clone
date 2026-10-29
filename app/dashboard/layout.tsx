import type { ReactNode } from "react"
import { WarningBanner } from "@/components/warning-banner"
import { getActiveWarningsForUser } from "@/lib/admin/users"
import { requireProfessionalUser } from "@/lib/session"

export const dynamic = "force-dynamic"

export default async function DashboardRouteLayout({ children }: { children: ReactNode }) {
  const user = await requireProfessionalUser()
  const warnings = await getActiveWarningsForUser(user.id)
  return (
    <>
      <WarningBanner warnings={warnings} />
      {children}
    </>
  )
}
