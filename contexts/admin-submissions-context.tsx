"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import { addReviewNote, setChecklist, setReviewStatus, type ReviewStatusInput } from "@/app/actions/admin-review"
import type { MissingPoint, RejectReason } from "@/lib/review-points"

export type SubmissionStatus = "nieuw" | "in-beoordeling" | "wacht-op-aanvulling" | "goedgekeurd" | "afgewezen"

export type TimelineType = "aanmelding" | "status" | "aanvulling" | "beoordeling" | "notitie"

export interface TimelineEvent {
  id: string
  type: TimelineType
  date: string
  title: string
  description?: string
  author: string
  missing?: MissingPoint[]
  reason?: RejectReason
  message?: string
}

export interface ChecklistState {
  profielCompleet: boolean
  portfolioBekeken: boolean
  contactGecontroleerd: boolean
  passendBijArsi: boolean
}

export interface InternalNote {
  id: string
  author: string
  date: string
  text: string
}

export interface Submission {
  id: string
  name: string
  discipline: string
  photo: string
  banner: string
  email: string
  phone: string
  city: string
  submittedAt: string
  status: SubmissionStatus
  reviewer: string | null
  // Dossier
  bio: string
  experience: string
  availability: string
  hourlyRate: string | null
  dayRate: string | null
  genres: string[]
  eventTypes: string[]
  website: string | null
  socials: { platform: string; url: string }[]
  portfolioImages: string[]
  videoLinks: { title: string; url: string }[]
  // Review workspace
  checklist: ChecklistState
  notes: InternalNote[]
  timeline: TimelineEvent[]
}

export interface FilterState {
  search: string
  status: SubmissionStatus | "alle"
  discipline: string
  reviewer: string
}

export const defaultFilters: FilterState = {
  search: "",
  status: "alle",
  discipline: "alle",
  reviewer: "alle",
}

/** The part of a submission that admins change; the server decides what it becomes. */
export type ReviewState = Pick<Submission, "status" | "reviewer" | "checklist" | "notes" | "timeline">

export type ReviewResult =
  | { ok: true; review: ReviewState }
  /** Someone else was first; `review` is how it stands now. */
  | { ok: false; error: "changed"; review: ReviewState }
  | { ok: false; error: "invalid" | "failed" }

interface AdminContextValue {
  submissions: Submission[]
  filters: FilterState
  setFilters: (f: FilterState) => void
  getSubmission: (id: string) => Submission | undefined
  /** Saves and shows what the server answered. A lost connection counts as "failed". */
  saveStatus: (input: ReviewStatusInput) => Promise<ReviewResult>
  saveChecklist: (id: string, key: keyof ChecklistState, value: boolean) => Promise<ReviewResult>
  addNote: (id: string, text: string) => Promise<ReviewResult>
}

const AdminContext = createContext<AdminContextValue | null>(null)

export function AdminSubmissionsProvider({
  children,
  initialSubmissions,
}: {
  children: ReactNode
  initialSubmissions: Submission[]
}) {
  const [submissions, setSubmissions] = useState<Submission[]>(initialSubmissions)
  const [loaded, setLoaded] = useState(initialSubmissions)
  const [filters, setFilters] = useState<FilterState>(defaultFilters)

  // A refresh brings newer data than what is on screen.
  if (loaded !== initialSubmissions) {
    setLoaded(initialSubmissions)
    setSubmissions(initialSubmissions)
  }

  const getSubmission = useCallback((id: string) => submissions.find((s) => s.id === id), [submissions])

  const save = useCallback(async (id: string, action: Promise<ReviewResult>): Promise<ReviewResult> => {
    const result = await action.catch((): ReviewResult => ({ ok: false, error: "failed" }))
    if ("review" in result) {
      setSubmissions((list) => list.map((s) => (s.id === id ? { ...s, ...result.review } : s)))
    }
    return result
  }, [])

  const saveStatus = useCallback((input: ReviewStatusInput) => save(input.id, setReviewStatus(input)), [save])
  const saveChecklist = useCallback(
    (id: string, key: keyof ChecklistState, value: boolean) => save(id, setChecklist({ id, key, value })),
    [save],
  )
  const addNote = useCallback((id: string, text: string) => save(id, addReviewNote({ id, text })), [save])

  return (
    <AdminContext.Provider
      value={{ submissions, filters, setFilters, getSubmission, saveStatus, saveChecklist, addNote }}
    >
      {children}
    </AdminContext.Provider>
  )
}

export function useAdmin() {
  const ctx = useContext(AdminContext)
  if (!ctx) throw new Error("useAdmin must be used within AdminSubmissionsProvider")
  return ctx
}
