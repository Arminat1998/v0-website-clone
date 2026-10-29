"use client"

import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from "react"
import { saveReview } from "@/app/actions/admin-review"

export type SubmissionStatus = "nieuw" | "in-beoordeling" | "wacht-op-aanvulling" | "goedgekeurd" | "afgewezen"

export type TimelineType = "aanmelding" | "status" | "aanvulling" | "beoordeling" | "notitie"

export interface TimelineEvent {
  id: string
  type: TimelineType
  date: string
  title: string
  description?: string
  author: string
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

interface AdminContextValue {
  submissions: Submission[]
  filters: FilterState
  setFilters: (f: FilterState) => void
  getSubmission: (id: string) => Submission | undefined
  startReview: (id: string) => void
  approve: (id: string) => void
  requestInfo: (id: string, message: string, missing: string[]) => void
  reject: (id: string, reason: string, message: string) => void
  toggleChecklist: (id: string, key: keyof ChecklistState) => void
  addNote: (id: string, text: string) => void
}

const AdminContext = createContext<AdminContextValue | null>(null)

function nowIso() {
  return new Date().toISOString()
}

function makeId() {
  return Math.random().toString(36).slice(2, 10)
}

export function AdminSubmissionsProvider({
  children,
  initialSubmissions,
  adminName,
}: {
  children: ReactNode
  initialSubmissions: Submission[]
  adminName: string
}) {
  const [submissions, setSubmissions] = useState<Submission[]>(initialSubmissions)
  const submissionsRef = useRef(submissions)
  submissionsRef.current = submissions
  const [filters, setFilters] = useState<FilterState>(defaultFilters)

  const getSubmission = useCallback((id: string) => submissions.find((s) => s.id === id), [submissions])

  const updateSubmission = useCallback((id: string, updater: (s: Submission) => Submission, message?: string) => {
    const current = submissionsRef.current.find((s) => s.id === id)
    if (!current) return
    const next = updater(current)
    submissionsRef.current = submissionsRef.current.map((s) => (s.id === id ? next : s))
    setSubmissions(submissionsRef.current)
    void saveReview({
      id,
      status: next.status,
      reviewer: next.reviewer,
      checklist: next.checklist,
      notes: next.notes,
      timeline: next.timeline,
      message,
    })
  }, [])

  const startReview = useCallback(
    (id: string) => {
      updateSubmission(id, (s) => ({
        ...s,
        status: "in-beoordeling",
        reviewer: s.reviewer ?? adminName,
        timeline: [
          ...s.timeline,
          {
            id: makeId(),
            type: "status",
            date: nowIso(),
            title: "Beoordeling gestart",
            description: "Status naar In beoordeling",
            author: adminName,
          },
        ],
      }))
    },
    [updateSubmission, adminName],
  )

  const approve = useCallback(
    (id: string) => {
      updateSubmission(id, (s) => ({
        ...s,
        status: "goedgekeurd",
        reviewer: s.reviewer ?? adminName,
        timeline: [
          ...s.timeline,
          {
            id: makeId(),
            type: "beoordeling",
            date: nowIso(),
            title: "Goedgekeurd",
            description: "Profiel gepubliceerd op het platform.",
            author: adminName,
          },
        ],
      }))
    },
    [updateSubmission, adminName],
  )

  const requestInfo = useCallback(
    (id: string, message: string, missing: string[]) => {
      updateSubmission(id, (s) => ({
        ...s,
        status: "wacht-op-aanvulling",
        reviewer: s.reviewer ?? adminName,
        timeline: [
          ...s.timeline,
          {
            id: makeId(),
            type: "aanvulling",
            date: nowIso(),
            title: "Aanvulling gevraagd",
            description:
              (missing.length ? `Ontbrekend: ${missing.join(", ")}. ` : "") + `Bericht aan artiest: "${message}"`,
            author: adminName,
          },
        ],
      }), message)
    },
    [updateSubmission, adminName],
  )

  const reject = useCallback(
    (id: string, reason: string, message: string) => {
      updateSubmission(id, (s) => ({
        ...s,
        status: "afgewezen",
        reviewer: s.reviewer ?? adminName,
        timeline: [
          ...s.timeline,
          {
            id: makeId(),
            type: "beoordeling",
            date: nowIso(),
            title: "Afgewezen",
            description: `Reden: ${reason}. Bericht aan artiest: "${message}"`,
            author: adminName,
          },
        ],
      }), message)
    },
    [updateSubmission, adminName],
  )

  const toggleChecklist = useCallback(
    (id: string, key: keyof ChecklistState) => {
      updateSubmission(id, (s) => ({ ...s, checklist: { ...s.checklist, [key]: !s.checklist[key] } }))
    },
    [updateSubmission, adminName],
  )

  const addNote = useCallback(
    (id: string, text: string) => {
      updateSubmission(id, (s) => ({
        ...s,
        notes: [...s.notes, { id: makeId(), author: adminName, date: nowIso(), text }],
        timeline: [
          ...s.timeline,
          {
            id: makeId(),
            type: "notitie",
            date: nowIso(),
            title: "Interne notitie toegevoegd",
            author: adminName,
          },
        ],
      }))
    },
    [updateSubmission, adminName],
  )

  return (
    <AdminContext.Provider
      value={{
        submissions,
        filters,
        setFilters,
        getSubmission,
        startReview,
        approve,
        requestInfo,
        reject,
        toggleChecklist,
        addNote,
      }}
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
