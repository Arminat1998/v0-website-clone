"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

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

const emptyChecklist: ChecklistState = {
  profielCompleet: false,
  portfolioBekeken: false,
  contactGecontroleerd: false,
  passendBijArsi: false,
}

const initialSubmissions: Submission[] = [
  {
    id: "1",
    name: "DJ Marco Vermeer",
    discipline: "DJ",
    photo: "/admin-artists/marco.png",
    email: "marco.vermeer@example.com",
    phone: "06 12345678",
    city: "Amsterdam",
    submittedAt: "2026-08-28T10:15:00",
    status: "nieuw",
    reviewer: null,
    bio: "Ervaren clubdj met een voorliefde voor house en techno. Meer dan tien jaar actief in de Amsterdamse nachtscene.",
    experience: "10+ jaar, resident bij twee clubs, meer dan 400 optredens.",
    availability: "Weekenden en feestdagen, beschikbaar in heel Noord-Holland.",
    hourlyRate: "€150",
    dayRate: "€850",
    genres: ["House", "Techno", "Deep House"],
    eventTypes: ["Club", "Dance Party", "Bedrijfsfeest"],
    website: "https://djmarco.example.com",
    socials: [
      { platform: "Instagram", url: "https://instagram.com/djmarco" },
      { platform: "SoundCloud", url: "https://soundcloud.com/djmarco" },
    ],
    portfolioImages: ["/admin-artists/marco.png", "/admin-artists/velvet-echo.png"],
    videoLinks: [{ title: "Liveset Amsterdam", url: "https://youtube.com/watch?v=demo1" }],
    checklist: { ...emptyChecklist },
    notes: [],
    timeline: [
      {
        id: "t1",
        type: "aanmelding",
        date: "2026-08-28T10:15:00",
        title: "Aanmelding ontvangen",
        author: "Systeem",
      },
    ],
  },
  {
    id: "2",
    name: "Sanne de Vries",
    discipline: "Zangeres",
    photo: "/admin-artists/sanne.png",
    email: "sanne.devries@example.com",
    phone: "06 23456789",
    city: "Utrecht",
    submittedAt: "2026-08-30T14:40:00",
    status: "nieuw",
    reviewer: null,
    bio: "Veelzijdige zangeres, van akoestische ballads tot uptempo feestrepertoire.",
    experience: "6 jaar, bruiloften, bedrijfsevents en theatershows.",
    availability: "Doordeweeks en weekenden, landelijk beschikbaar.",
    hourlyRate: "€120",
    dayRate: "€700",
    genres: ["Pop", "Soul", "Jazz"],
    eventTypes: ["Bruiloft", "Bedrijfsfeest", "Gala"],
    website: null,
    socials: [{ platform: "Instagram", url: "https://instagram.com/sannedevries" }],
    portfolioImages: ["/admin-artists/sanne.png"],
    videoLinks: [{ title: "Showreel 2026", url: "https://youtube.com/watch?v=demo2" }],
    checklist: { ...emptyChecklist },
    notes: [],
    timeline: [
      {
        id: "t1",
        type: "aanmelding",
        date: "2026-08-30T14:40:00",
        title: "Aanmelding ontvangen",
        author: "Systeem",
      },
    ],
  },
  {
    id: "3",
    name: "The Velvet Echo",
    discipline: "Band",
    photo: "/admin-artists/velvet-echo.png",
    email: "booking@velvetecho.example.com",
    phone: "06 34567890",
    city: "Rotterdam",
    submittedAt: "2026-08-22T09:05:00",
    status: "in-beoordeling",
    reviewer: "Noor Bakker",
    bio: "Vierkoppige liveband met een strak repertoire aan funk, soul en pop covers.",
    experience: "8 jaar, festivals en grote bedrijfsevenementen.",
    availability: "Vooral weekenden, minimaal 6 weken vooraf boeken.",
    hourlyRate: "€600",
    dayRate: "€3200",
    genres: ["Funk", "Soul", "Pop"],
    eventTypes: ["Festival", "Bedrijfsfeest", "Bruiloft"],
    website: "https://velvetecho.example.com",
    socials: [
      { platform: "Instagram", url: "https://instagram.com/velvetecho" },
      { platform: "YouTube", url: "https://youtube.com/@velvetecho" },
    ],
    portfolioImages: ["/admin-artists/velvet-echo.png", "/admin-artists/bright-lights.png"],
    videoLinks: [{ title: "Live op Zomerfestival", url: "https://youtube.com/watch?v=demo3" }],
    checklist: { profielCompleet: true, portfolioBekeken: true, contactGecontroleerd: false, passendBijArsi: false },
    notes: [
      {
        id: "n1",
        author: "Noor Bakker",
        date: "2026-08-24T11:20:00",
        text: "Sterke showreel. Nog even de referenties van vorig jaar navragen.",
      },
    ],
    timeline: [
      { id: "t1", type: "aanmelding", date: "2026-08-22T09:05:00", title: "Aanmelding ontvangen", author: "Systeem" },
      {
        id: "t2",
        type: "status",
        date: "2026-08-24T11:00:00",
        title: "Beoordeling gestart",
        description: "Status naar In beoordeling",
        author: "Noor Bakker",
      },
    ],
  },
  {
    id: "4",
    name: "Youssef El Amrani",
    discipline: "Saxofonist",
    photo: "/admin-artists/youssef.png",
    email: "youssef.elamrani@example.com",
    phone: "06 45678901",
    city: "Den Haag",
    submittedAt: "2026-08-25T16:30:00",
    status: "in-beoordeling",
    reviewer: "Daan Visser",
    bio: "Saxofonist die live meespeelt met dj-sets en akoestische optredens verzorgt.",
    experience: "5 jaar, clubs, rooftop-events en bruiloften.",
    availability: "Flexibel, ook last-minute beschikbaar in de Randstad.",
    hourlyRate: "€180",
    dayRate: "€900",
    genres: ["Deep House", "Lounge", "Jazz"],
    eventTypes: ["Club", "Rooftop", "Bruiloft"],
    website: null,
    socials: [{ platform: "Instagram", url: "https://instagram.com/saxyoussef" }],
    portfolioImages: ["/admin-artists/youssef.png"],
    videoLinks: [{ title: "Sax x DJ set", url: "https://youtube.com/watch?v=demo4" }],
    checklist: { profielCompleet: true, portfolioBekeken: false, contactGecontroleerd: true, passendBijArsi: false },
    notes: [],
    timeline: [
      { id: "t1", type: "aanmelding", date: "2026-08-25T16:30:00", title: "Aanmelding ontvangen", author: "Systeem" },
      {
        id: "t2",
        type: "status",
        date: "2026-08-26T09:15:00",
        title: "Beoordeling gestart",
        description: "Status naar In beoordeling",
        author: "Daan Visser",
      },
    ],
  },
  {
    id: "5",
    name: "Lisa Bakker",
    discipline: "Pianist",
    photo: "/admin-artists/lisa.png",
    email: "lisa.bakker@example.com",
    phone: "06 56789012",
    city: "Eindhoven",
    submittedAt: "2026-08-18T12:00:00",
    status: "wacht-op-aanvulling",
    reviewer: "Noor Bakker",
    bio: "Klassiek geschoolde pianiste voor sfeervolle achtergrondmuziek en ceremonies.",
    experience: "12 jaar conservatorium en live-ervaring.",
    availability: "Weekenden, bij voorkeur binnen Noord-Brabant.",
    hourlyRate: "€140",
    dayRate: null,
    genres: ["Klassiek", "Jazz"],
    eventTypes: ["Ceremonie", "Gala", "Diner"],
    website: null,
    socials: [],
    portfolioImages: ["/admin-artists/lisa.png"],
    videoLinks: [],
    checklist: { profielCompleet: false, portfolioBekeken: true, contactGecontroleerd: true, passendBijArsi: false },
    notes: [
      {
        id: "n1",
        author: "Noor Bakker",
        date: "2026-08-20T10:00:00",
        text: "Dagtarief en videovoorbeeld ontbreken. Aanvulling gevraagd.",
      },
    ],
    timeline: [
      { id: "t1", type: "aanmelding", date: "2026-08-18T12:00:00", title: "Aanmelding ontvangen", author: "Systeem" },
      {
        id: "t2",
        type: "status",
        date: "2026-08-19T09:00:00",
        title: "Beoordeling gestart",
        author: "Noor Bakker",
      },
      {
        id: "t3",
        type: "aanvulling",
        date: "2026-08-20T10:05:00",
        title: "Aanvulling gevraagd",
        description: "Dagtarief en minimaal één videovoorbeeld opgevraagd.",
        author: "Noor Bakker",
      },
    ],
  },
  {
    id: "6",
    name: "DJ Nova (Nina Koster)",
    discipline: "DJ",
    photo: "/admin-artists/nova.png",
    email: "nina.koster@example.com",
    phone: "06 67890123",
    city: "Groningen",
    submittedAt: "2026-08-15T18:45:00",
    status: "wacht-op-aanvulling",
    reviewer: "Daan Visser",
    bio: "Melodic-techno dj met eigen producties en een groeiende online fanbase.",
    experience: "4 jaar, studentenfeesten en clubnachten in het noorden.",
    availability: "Weekenden, bereid te reizen.",
    hourlyRate: "€110",
    dayRate: "€600",
    genres: ["Melodic Techno", "House"],
    eventTypes: ["Club", "Studentenfeest"],
    website: null,
    socials: [{ platform: "SoundCloud", url: "https://soundcloud.com/djnova" }],
    portfolioImages: ["/admin-artists/nova.png"],
    videoLinks: [],
    checklist: { profielCompleet: false, portfolioBekeken: false, contactGecontroleerd: true, passendBijArsi: false },
    notes: [
      {
        id: "n1",
        author: "Daan Visser",
        date: "2026-08-17T14:30:00",
        text: "Portfoliofoto's van lage kwaliteit. Betere beelden opgevraagd.",
      },
    ],
    timeline: [
      { id: "t1", type: "aanmelding", date: "2026-08-15T18:45:00", title: "Aanmelding ontvangen", author: "Systeem" },
      {
        id: "t2",
        type: "aanvulling",
        date: "2026-08-17T14:35:00",
        title: "Aanvulling gevraagd",
        description: "Portfoliofoto's in hogere resolutie opgevraagd.",
        author: "Daan Visser",
      },
    ],
  },
  {
    id: "7",
    name: "Tomas Wolff",
    discipline: "Gitarist",
    photo: "/admin-artists/tomas.png",
    email: "tomas.wolff@example.com",
    phone: "06 78901234",
    city: "Tilburg",
    submittedAt: "2026-08-05T11:10:00",
    status: "goedgekeurd",
    reviewer: "Noor Bakker",
    bio: "Akoestisch gitarist en zanger voor intieme optredens en recepties.",
    experience: "9 jaar, honderden recepties en diners.",
    availability: "Flexibel, hele week beschikbaar.",
    hourlyRate: "€130",
    dayRate: "€650",
    genres: ["Akoestisch", "Pop", "Folk"],
    eventTypes: ["Receptie", "Diner", "Bruiloft"],
    website: "https://tomaswolff.example.com",
    socials: [{ platform: "Instagram", url: "https://instagram.com/tomaswolffmusic" }],
    portfolioImages: ["/admin-artists/tomas.png"],
    videoLinks: [{ title: "Akoestische set", url: "https://youtube.com/watch?v=demo7" }],
    checklist: { profielCompleet: true, portfolioBekeken: true, contactGecontroleerd: true, passendBijArsi: true },
    notes: [
      {
        id: "n1",
        author: "Noor Bakker",
        date: "2026-08-07T13:00:00",
        text: "Compleet dossier, sterke referenties. Goedgekeurd.",
      },
    ],
    timeline: [
      { id: "t1", type: "aanmelding", date: "2026-08-05T11:10:00", title: "Aanmelding ontvangen", author: "Systeem" },
      { id: "t2", type: "status", date: "2026-08-06T09:30:00", title: "Beoordeling gestart", author: "Noor Bakker" },
      {
        id: "t3",
        type: "beoordeling",
        date: "2026-08-07T13:05:00",
        title: "Goedgekeurd",
        description: "Profiel gepubliceerd op het platform.",
        author: "Noor Bakker",
      },
    ],
  },
  {
    id: "8",
    name: "Amara Okonkwo",
    discipline: "Performer",
    photo: "/admin-artists/amara.png",
    email: "amara.okonkwo@example.com",
    phone: "06 89012345",
    city: "Amsterdam",
    submittedAt: "2026-08-02T15:20:00",
    status: "goedgekeurd",
    reviewer: "Daan Visser",
    bio: "Danseres en performer voor opvallende openingsacts en themafeesten.",
    experience: "7 jaar, internationale shows en events.",
    availability: "Weekenden en avonden, internationaal beschikbaar.",
    hourlyRate: "€200",
    dayRate: "€1100",
    genres: ["Dans", "Performance"],
    eventTypes: ["Gala", "Themafeest", "Productlancering"],
    website: "https://amaraperforms.example.com",
    socials: [{ platform: "Instagram", url: "https://instagram.com/amaraperforms" }],
    portfolioImages: ["/admin-artists/amara.png"],
    videoLinks: [{ title: "Opening act reel", url: "https://youtube.com/watch?v=demo8" }],
    checklist: { profielCompleet: true, portfolioBekeken: true, contactGecontroleerd: true, passendBijArsi: true },
    notes: [],
    timeline: [
      { id: "t1", type: "aanmelding", date: "2026-08-02T15:20:00", title: "Aanmelding ontvangen", author: "Systeem" },
      { id: "t2", type: "status", date: "2026-08-03T10:00:00", title: "Beoordeling gestart", author: "Daan Visser" },
      {
        id: "t3",
        type: "beoordeling",
        date: "2026-08-04T16:00:00",
        title: "Goedgekeurd",
        description: "Profiel gepubliceerd op het platform.",
        author: "Daan Visser",
      },
    ],
  },
  {
    id: "9",
    name: "Ravi Sharma",
    discipline: "Violist",
    photo: "/admin-artists/ravi.png",
    email: "ravi.sharma@example.com",
    phone: "06 90123456",
    city: "Maastricht",
    submittedAt: "2026-07-28T13:50:00",
    status: "afgewezen",
    reviewer: "Noor Bakker",
    bio: "Elektrische violist voor crossover-optredens met dj's.",
    experience: "2 jaar, beperkt aantal optredens.",
    availability: "Alleen weekenden, regio Limburg.",
    hourlyRate: "€90",
    dayRate: null,
    genres: ["Crossover", "Klassiek"],
    eventTypes: ["Club", "Bruiloft"],
    website: null,
    socials: [],
    portfolioImages: ["/admin-artists/ravi.png"],
    videoLinks: [],
    checklist: { profielCompleet: false, portfolioBekeken: true, contactGecontroleerd: true, passendBijArsi: false },
    notes: [
      {
        id: "n1",
        author: "Noor Bakker",
        date: "2026-07-30T11:00:00",
        text: "Te weinig ervaring en portfolio voor het platform op dit moment.",
      },
    ],
    timeline: [
      { id: "t1", type: "aanmelding", date: "2026-07-28T13:50:00", title: "Aanmelding ontvangen", author: "Systeem" },
      { id: "t2", type: "status", date: "2026-07-29T09:00:00", title: "Beoordeling gestart", author: "Noor Bakker" },
      {
        id: "t3",
        type: "beoordeling",
        date: "2026-07-30T11:05:00",
        title: "Afgewezen",
        description: "Reden: onvoldoende ervaring en portfolio.",
        author: "Noor Bakker",
      },
    ],
  },
  {
    id: "10",
    name: "Bright Lights Collective",
    discipline: "Band",
    photo: "/admin-artists/bright-lights.png",
    email: "hello@brightlights.example.com",
    phone: "06 11223344",
    city: "Breda",
    submittedAt: "2026-09-01T08:30:00",
    status: "nieuw",
    reviewer: null,
    bio: "Electronic live-duo dat dj-cultuur combineert met live-instrumenten en visuals.",
    experience: "3 jaar, festivals en clubshows.",
    availability: "Weekenden, landelijk en België.",
    hourlyRate: "€400",
    dayRate: "€2000",
    genres: ["Electronic", "Live House"],
    eventTypes: ["Festival", "Club", "Productlancering"],
    website: "https://brightlights.example.com",
    socials: [{ platform: "Instagram", url: "https://instagram.com/brightlightscollective" }],
    portfolioImages: ["/admin-artists/bright-lights.png"],
    videoLinks: [{ title: "Live AV show", url: "https://youtube.com/watch?v=demo10" }],
    checklist: { ...emptyChecklist },
    notes: [],
    timeline: [
      { id: "t1", type: "aanmelding", date: "2026-09-01T08:30:00", title: "Aanmelding ontvangen", author: "Systeem" },
    ],
  },
]

export const CURRENT_ADMIN = "Noor Bakker"

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

export function AdminSubmissionsProvider({ children }: { children: ReactNode }) {
  const [submissions, setSubmissions] = useState<Submission[]>(initialSubmissions)
  const [filters, setFilters] = useState<FilterState>(defaultFilters)

  const getSubmission = useCallback((id: string) => submissions.find((s) => s.id === id), [submissions])

  const updateSubmission = useCallback((id: string, updater: (s: Submission) => Submission) => {
    setSubmissions((prev) => prev.map((s) => (s.id === id ? updater(s) : s)))
  }, [])

  const startReview = useCallback(
    (id: string) => {
      updateSubmission(id, (s) => ({
        ...s,
        status: "in-beoordeling",
        reviewer: s.reviewer ?? CURRENT_ADMIN,
        timeline: [
          ...s.timeline,
          {
            id: makeId(),
            type: "status",
            date: nowIso(),
            title: "Beoordeling gestart",
            description: "Status naar In beoordeling",
            author: CURRENT_ADMIN,
          },
        ],
      }))
    },
    [updateSubmission],
  )

  const approve = useCallback(
    (id: string) => {
      updateSubmission(id, (s) => ({
        ...s,
        status: "goedgekeurd",
        reviewer: s.reviewer ?? CURRENT_ADMIN,
        timeline: [
          ...s.timeline,
          {
            id: makeId(),
            type: "beoordeling",
            date: nowIso(),
            title: "Goedgekeurd",
            description: "Profiel gepubliceerd op het platform.",
            author: CURRENT_ADMIN,
          },
        ],
      }))
    },
    [updateSubmission],
  )

  const requestInfo = useCallback(
    (id: string, message: string, missing: string[]) => {
      updateSubmission(id, (s) => ({
        ...s,
        status: "wacht-op-aanvulling",
        reviewer: s.reviewer ?? CURRENT_ADMIN,
        timeline: [
          ...s.timeline,
          {
            id: makeId(),
            type: "aanvulling",
            date: nowIso(),
            title: "Aanvulling gevraagd",
            description:
              (missing.length ? `Ontbrekend: ${missing.join(", ")}. ` : "") + `Bericht aan artiest: "${message}"`,
            author: CURRENT_ADMIN,
          },
        ],
      }))
    },
    [updateSubmission],
  )

  const reject = useCallback(
    (id: string, reason: string, message: string) => {
      updateSubmission(id, (s) => ({
        ...s,
        status: "afgewezen",
        reviewer: s.reviewer ?? CURRENT_ADMIN,
        timeline: [
          ...s.timeline,
          {
            id: makeId(),
            type: "beoordeling",
            date: nowIso(),
            title: "Afgewezen",
            description: `Reden: ${reason}. Bericht aan artiest: "${message}"`,
            author: CURRENT_ADMIN,
          },
        ],
      }))
    },
    [updateSubmission],
  )

  const toggleChecklist = useCallback(
    (id: string, key: keyof ChecklistState) => {
      updateSubmission(id, (s) => ({ ...s, checklist: { ...s.checklist, [key]: !s.checklist[key] } }))
    },
    [updateSubmission],
  )

  const addNote = useCallback(
    (id: string, text: string) => {
      updateSubmission(id, (s) => ({
        ...s,
        notes: [...s.notes, { id: makeId(), author: CURRENT_ADMIN, date: nowIso(), text }],
        timeline: [
          ...s.timeline,
          {
            id: makeId(),
            type: "notitie",
            date: nowIso(),
            title: "Interne notitie toegevoegd",
            author: CURRENT_ADMIN,
          },
        ],
      }))
    },
    [updateSubmission],
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
