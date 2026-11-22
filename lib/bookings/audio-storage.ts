import "server-only"

import { BlobNotFoundError, del, head, list } from "@vercel/blob"
import { and, eq, isNotNull, or } from "drizzle-orm"
import { db } from "@/lib/db"
import { bookings } from "@/lib/db/schema"
import { BOOKING_AUDIO_PREFIX } from "@/lib/bookings/audio"

const HOUR = 60 * 60 * 1000

// A file can be booked for 23 hours and is only cleaned up after 24, so the cleanup can never hit a file that
// is being booked at the same moment.
const BOOKABLE_MS = 23 * HOUR
const CLEANUP_MS = 24 * HOUR

/** Files a customer may have waiting without a booking; a request has two at most. */
const MAX_LOOSE_FILES = 20

/** False when the file was never uploaded, is gone or too old to be booked; a storage problem does not stop a booking. */
export async function isBookableAudio(pathname: string) {
  try {
    const { uploadedAt } = await head(pathname, { abortSignal: AbortSignal.timeout(5000) })
    return Date.now() - uploadedAt.getTime() < BOOKABLE_MS
  } catch (error) {
    if (error instanceof BlobNotFoundError) return false
    console.error("Failed to check booking audio:", error)
    return true
  }
}

/**
 * Removes this customer's old uploads that no booking uses, and tells whether they may upload another file.
 * Files of a booking are never removed. A problem here does not stop the upload.
 */
export async function tidyLooseAudio(customerId: string): Promise<boolean> {
  try {
    const { blobs } = await list({
      prefix: `${BOOKING_AUDIO_PREFIX}${customerId}/`,
      limit: 1000,
      abortSignal: AbortSignal.timeout(5000),
    })
    if (blobs.length === 0) return true
    const rows = await db
      .select({ openingDance: bookings.openingDanceFileName, lastSong: bookings.lastSongFileName })
      .from(bookings)
      .where(and(eq(bookings.customerId, customerId), or(isNotNull(bookings.openingDanceFileName), isNotNull(bookings.lastSongFileName))))
    const used = new Set(rows.flatMap((row) => [row.openingDance, row.lastSong]))
    const loose = blobs.filter((blob) => !used.has(blob.pathname))
    const old = loose.filter((blob) => Date.now() - blob.uploadedAt.getTime() > CLEANUP_MS)
    if (old.length) await del(old.map((blob) => blob.pathname), { abortSignal: AbortSignal.timeout(5000) })
    return loose.length - old.length < MAX_LOOSE_FILES
  } catch (error) {
    console.error("Failed to tidy booking audio:", error)
    return true
  }
}
