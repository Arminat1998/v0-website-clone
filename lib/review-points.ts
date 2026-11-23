/** What an admin can ask a professional to add, and where the professional fills it in. Stored by key. */
export const MISSING_POINTS = {
  bio: { nl: "Bio", en: "Bio", href: "/dashboard/edit-profile" },
  contact: { nl: "Contactgegevens", en: "Contact details", href: "/dashboard/edit-profile" },
  availability: { nl: "Beschikbaarheid", en: "Availability", href: "/dashboard/edit-profile" },
  photos: { nl: "Portfoliofoto's", en: "Portfolio photos", href: "/dashboard/my-page" },
  video: { nl: "Videovoorbeeld", en: "Video sample", href: "/dashboard/my-page" },
} as const

export type MissingPoint = keyof typeof MISSING_POINTS

export const MISSING_POINT_KEYS = Object.keys(MISSING_POINTS) as MissingPoint[]

export function missingPoints(stored: unknown): MissingPoint[] {
  return Array.isArray(stored) ? MISSING_POINT_KEYS.filter((key) => stored.includes(key)) : []
}

export function missingLabel(key: MissingPoint, nl: boolean) {
  return nl ? MISSING_POINTS[key].nl : MISSING_POINTS[key].en
}

/** Why an application was declined. For admins only. */
export const REJECT_REASONS = {
  experience: { nl: "Onvoldoende ervaring", en: "Insufficient experience" },
  portfolio: { nl: "Onvolledig portfolio", en: "Incomplete portfolio" },
  fit: { nl: "Past niet bij ARSI", en: "Doesn't fit ARSI" },
  duplicate: { nl: "Dubbele aanmelding", en: "Duplicate submission" },
  other: { nl: "Anders", en: "Other" },
} as const

export type RejectReason = keyof typeof REJECT_REASONS

export const REJECT_REASON_KEYS = Object.keys(REJECT_REASONS) as RejectReason[]

export function rejectReasonLabel(key: RejectReason, nl: boolean) {
  return nl ? REJECT_REASONS[key].nl : REJECT_REASONS[key].en
}
