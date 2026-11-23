"use server"

import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { professionalProfiles } from "@/lib/db/schema"
import { requireAdmin } from "@/lib/session"
import { CHECKLIST_KEYS, REVIEW_STATUSES, reviewState } from "@/lib/admin/submissions"
import { logAdminAction } from "@/lib/moderation"
import { missingPoints, REJECT_REASONS, REJECT_REASON_KEYS, type MissingPoint, type RejectReason } from "@/lib/review-points"
import type { ChecklistState, ReviewResult, SubmissionStatus, TimelineEvent } from "@/contexts/admin-submissions-context"
import { logError } from "@/lib/log-error"

type ProfileRow = typeof professionalProfiles.$inferSelect
type Change = Partial<typeof professionalProfiles.$inferInsert>

const OPEN: SubmissionStatus[] = ["nieuw", "in-beoordeling", "wacht-op-aanvulling"]

/** From which statuses a review step is possible. A decision is final here. */
const STEPS: Partial<Record<SubmissionStatus, SubmissionStatus[]>> = {
  "in-beoordeling": ["nieuw"],
  "wacht-op-aanvulling": OPEN,
  goedgekeurd: OPEN,
  afgewezen: OPEN,
}

const invalid: ReviewResult = { ok: false, error: "invalid" }

function clean(value: unknown, max: number) {
  return typeof value === "string" ? value.replaceAll("\u0000", "").trim().slice(0, max) : ""
}

function event(author: string, entry: Omit<TimelineEvent, "id" | "date" | "author">): TimelineEvent {
  return { id: crypto.randomUUID(), date: new Date().toISOString(), author, ...entry }
}

function withEvent(row: ProfileRow, entry: TimelineEvent) {
  return [...(row.reviewData?.timeline ?? []), entry].slice(-200)
}

/** Changes one profile while nobody else can, and returns how the review stands afterwards. */
async function changeReview(id: string, change: (row: ProfileRow) => Change | "changed"): Promise<ReviewResult> {
  try {
    return await db.transaction(async (tx): Promise<ReviewResult> => {
      const [row] = await tx
        .select()
        .from(professionalProfiles)
        .where(eq(professionalProfiles.professionalId, id))
        .limit(1)
        .for("update")
      if (!row) return invalid
      const next = change(row)
      if (next === "changed") return { ok: false, error: "changed", review: reviewState(row) }
      await tx.update(professionalProfiles).set(next).where(eq(professionalProfiles.professionalId, id))
      return { ok: true, review: reviewState({ ...row, ...next } as ProfileRow) }
    })
  } catch (error) {
    logError("Failed to save review:", error)
    return { ok: false, error: "failed" }
  }
}

export interface ReviewStatusInput {
  id: string
  status: SubmissionStatus
  /** The status the admin was looking at. When it is no longer true, nothing changes. */
  expectedStatus: SubmissionStatus
  /** What the professional reads. */
  message?: string
  /** What the professional still has to add. */
  missing?: MissingPoint[]
  /** Why an application was declined. The professional does not see this. */
  reason?: RejectReason
}

export async function setReviewStatus(input: ReviewStatusInput): Promise<ReviewResult> {
  const admin = await requireAdmin()
  const { id, status, expectedStatus } = input
  const from = STEPS[status]
  if (typeof id !== "string" || !REVIEW_STATUSES.includes(status) || !Object.hasOwn(STEPS, status) || !from || !REVIEW_STATUSES.includes(expectedStatus)) return invalid

  const message = clean(input.message, 2000)
  const missing = status === "wacht-op-aanvulling" ? missingPoints(input.missing) : []
  const reason = status === "afgewezen" ? REJECT_REASON_KEYS.find((key) => key === input.reason) : undefined
  if (status === "afgewezen" && (!message || !reason)) return invalid
  if (status === "wacht-op-aanvulling" && !message && missing.length === 0) return invalid

  const decided = status === "goedgekeurd" || status === "afgewezen"
  const entries: Partial<Record<SubmissionStatus, Omit<TimelineEvent, "id" | "date" | "author">>> = {
    "in-beoordeling": { type: "status", title: "Beoordeling gestart", description: "Status naar In beoordeling" },
    "wacht-op-aanvulling": { type: "aanvulling", title: "Aanvulling gevraagd", missing, message: message || undefined },
    goedgekeurd: { type: "beoordeling", title: "Goedgekeurd", description: "Profiel gepubliceerd op het platform." },
    afgewezen: { type: "beoordeling", title: "Afgewezen", reason, message },
  }
  const entry = entries[status]
  if (!entry) return invalid

  let label = ""
  const result = await changeReview(id, (row) => {
    if (row.reviewStatus !== expectedStatus || !from.includes(expectedStatus)) return "changed"
    label = row.stageName || row.fullName
    return {
      reviewStatus: status,
      reviewerName: decided ? admin.name : (row.reviewerName ?? admin.name),
      reviewMessage: status === "wacht-op-aanvulling" || status === "afgewezen" ? message || null : null,
      reviewData: { ...row.reviewData, missing, timeline: withEvent(row, event(admin.name, entry)) },
      reviewedAt: decided ? new Date() : null,
    }
  })
  if (!result.ok) return result

  if (status !== "in-beoordeling") {
    try {
      await logAdminAction({
        adminId: admin.id,
        adminName: admin.name,
        action: status === "goedgekeurd" ? "review_approve" : status === "afgewezen" ? "review_reject" : "review_info",
        targetUserId: id,
        targetLabel: label,
        details: reason ? `Reden: ${REJECT_REASONS[reason].nl}` : null,
      })
    } catch (error) {
      // The decision itself is saved and in the timeline.
      logError("Failed to log the review decision:", error)
    }
  }

  revalidatePath("/admin", "layout")
  revalidatePath("/dashboard", "layout")
  revalidatePath("/artiest/[slug]", "page")
  revalidatePath("/artiesten")
  revalidatePath("/foto-video/[slug]", "page")
  revalidatePath("/photo-video")
  return result
}

/** Ticks one point of the internal checklist. Status, message and decision date stay as they are. */
export async function setChecklist(input: { id: string; key: keyof ChecklistState; value: boolean }): Promise<ReviewResult> {
  await requireAdmin()
  const { id, key, value } = input
  if (typeof id !== "string" || !CHECKLIST_KEYS.includes(key) || typeof value !== "boolean") return invalid
  return changeReview(id, (row) => ({
    reviewData: { ...row.reviewData, checklist: { ...row.reviewData?.checklist, [key]: value } },
  }))
}

/** Adds one internal note. Status, message and decision date stay as they are. */
export async function addReviewNote(input: { id: string; text: string }): Promise<ReviewResult> {
  const admin = await requireAdmin()
  const text = clean(input.text, 2000)
  if (typeof input.id !== "string" || !text) return invalid
  return changeReview(input.id, (row) => ({
    reviewData: {
      ...row.reviewData,
      notes: [
        ...(row.reviewData?.notes ?? []),
        { id: crypto.randomUUID(), author: admin.name, date: new Date().toISOString(), text },
      ].slice(-200),
      timeline: withEvent(row, event(admin.name, { type: "notitie", title: "Interne notitie toegevoegd" })),
    },
  }))
}
