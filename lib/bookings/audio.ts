import { isSafeBlobPath } from "@/lib/blob-paths"

/** Uploaded booking music lives under booking-audio/<customerId>/<uuid>/<file name>. */
export const BOOKING_AUDIO_PREFIX = "booking-audio/"
export const MAX_AUDIO_BYTES = 25 * 1024 * 1024

// By extension: browsers report different types (or none) for the same audio file.
const AUDIO_TYPES: Record<string, string> = {
  mp3: "audio/mpeg",
  m4a: "audio/mp4",
  aac: "audio/aac",
  wav: "audio/wav",
  ogg: "audio/ogg",
  flac: "audio/flac",
}

export const AUDIO_CONTENT_TYPES = Object.values(AUDIO_TYPES)
export const AUDIO_ACCEPT = Object.keys(AUDIO_TYPES).map((extension) => `.${extension}`).join(",") + ",audio/*"

export const AUDIO_KINDS = ["opening-dance", "last-song"] as const
export type AudioKind = (typeof AUDIO_KINDS)[number]

export function audioContentType(fileName: string) {
  const extension = /[^/.]\.([a-z0-9]+)$/i.exec(fileName)?.[1].toLowerCase() ?? ""
  return AUDIO_TYPES[extension] ?? null
}

/** What is wrong with a chosen file, or null when it can be uploaded. */
export function audioProblem(file: { name: string; size: number }): "type" | "size" | "empty" | null {
  if (!audioContentType(file.name)) return "type"
  if (file.size === 0) return "empty"
  return file.size > MAX_AUDIO_BYTES ? "size" : null
}

export function newAudioPath(customerId: string, fileName: string) {
  const safeName = fileName
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9.-]+/g, "_")
    .slice(-80)
    .replace(/^[^A-Za-z0-9_]+/, "")
  return `${BOOKING_AUDIO_PREFIX}${customerId}/${crypto.randomUUID()}/${safeName}`
}

/** True when `pathname` is an audio file this customer uploaded. */
export function isOwnAudioPath(pathname: unknown, customerId: string): pathname is string {
  return isSafeBlobPath(pathname, `${BOOKING_AUDIO_PREFIX}${customerId}/`) && audioContentType(pathname) !== null
}

/** Older bookings only stored a file name; there is no file behind those. */
export function hasAudioFile(stored: string | null): stored is string {
  return Boolean(stored?.startsWith(BOOKING_AUDIO_PREFIX))
}

export function audioDisplayName(stored: string) {
  return hasAudioFile(stored) ? (stored.split("/").pop() ?? stored) : stored
}

export function audioUrl(bookingId: number, kind: AudioKind, download = false) {
  return `/api/booking-audio?bookingId=${bookingId}&kind=${kind}${download ? "&download=1" : ""}`
}
