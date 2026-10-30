"use server"

import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { professionalProfiles } from "@/lib/db/schema"
import { requireAdmin } from "@/lib/session"
import { REVIEW_STATUSES } from "@/lib/admin/submissions"
import type { ChecklistState, InternalNote, SubmissionStatus, TimelineEvent } from "@/contexts/admin-submissions-context"

export interface SaveReviewInput {
  id: string
  status: SubmissionStatus
  reviewer: string | null
  checklist: ChecklistState
  notes: InternalNote[]
  timeline: TimelineEvent[]
  /** Message shown to the professional after "request info" or "reject". */
  message?: string
}

export async function saveReview(input: SaveReviewInput): Promise<{ ok: boolean }> {
  const admin = await requireAdmin()
  if (!REVIEW_STATUSES.includes(input.status)) return { ok: false }

  const decided = input.status === "goedgekeurd" || input.status === "afgewezen"
  const hasMessage = input.status === "wacht-op-aanvulling" || input.status === "afgewezen"

  try {
    await db
      .update(professionalProfiles)
      .set({
        reviewStatus: input.status,
        reviewerName: input.reviewer ?? admin.name,
        reviewMessage: hasMessage ? (input.message?.slice(0, 2000) ?? null) : null,
        reviewData: {
          checklist: { ...input.checklist },
          notes: input.notes.slice(-200),
          timeline: input.timeline.slice(-200),
        },
        reviewedAt: decided ? new Date() : null,
      })
      .where(eq(professionalProfiles.professionalId, input.id))
  } catch (error) {
    console.error("Failed to save review:", error)
    return { ok: false }
  }

  revalidatePath("/admin", "layout")
  revalidatePath("/dashboard", "layout")
  revalidatePath("/artiest/[slug]", "page")
  revalidatePath("/artiesten")
  return { ok: true }
}
