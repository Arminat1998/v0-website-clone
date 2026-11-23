import type { ReactNode } from "react"
import { eq } from "drizzle-orm"
import { ReviewStatusBanner, type ProfileReview } from "@/components/review-status-banner"
import { WarningBanner } from "@/components/warning-banner"
import { getActiveWarningsForUser } from "@/lib/admin/users"
import { db } from "@/lib/db"
import { professionalProfiles } from "@/lib/db/schema"
import { logError } from "@/lib/log-error"
import { requireProfessionalUser } from "@/lib/session"

export const dynamic = "force-dynamic"

async function getProfileReview(professionalId: string): Promise<ProfileReview | undefined> {
  try {
    const [profile] = await db
      .select({ status: professionalProfiles.reviewStatus, message: professionalProfiles.reviewMessage })
      .from(professionalProfiles)
      .where(eq(professionalProfiles.professionalId, professionalId))
      .limit(1)
    return profile ?? null
  } catch (error) {
    // Without a status the banner stays hidden rather than showing a wrong one.
    logError("Failed to load review status:", error)
    return undefined
  }
}

export default async function DashboardRouteLayout({ children }: { children: ReactNode }) {
  const user = await requireProfessionalUser()
  const [warnings, review] = await Promise.all([getActiveWarningsForUser(user.id), getProfileReview(user.id)])
  return (
    <>
      <WarningBanner warnings={warnings} />
      {review !== undefined && <ReviewStatusBanner review={review} />}
      {children}
    </>
  )
}
