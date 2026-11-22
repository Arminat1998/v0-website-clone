import "server-only"

import { BlobNotFoundError, del, head, list } from "@vercel/blob"
import { and, eq, isNotNull, or, sql } from "drizzle-orm"
import { db } from "@/lib/db"
import { bookings } from "@/lib/db/schema"
import { BOOKING_AUDIO_PREFIX } from "@/lib/bookings/audio"

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0]

/** Files not used by a booking are kept this long, so someone can finish their request later. */
const ORPHAN_AGE_MS = 24 * 60 * 60 * 1000
/** Files a customer may have waiting without a booking; a request has two at most. */
const MAX_LOOSE_FILES = 20

/** Booking a file and cleaning up files of the same customer wait for each other. */
export async function lockAudio(tx: Tx, customerId: string) {
  await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`audio:${customerId}`}))`)
}

/** False when the file was never uploaded or is already gone; a storage problem does not stop a booking. */
export async function audioFileExists(pathname: string) {
  try {
    await head(pathname, { abortSignal: AbortSignal.timeout(5000) })
    return true
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
    return await db.transaction(async (tx) => {
      await lockAudio(tx, customerId)
      const { blobs } = await list({
        prefix: `${BOOKING_AUDIO_PREFIX}${customerId}/`,
        limit: 1000,
        abortSignal: AbortSignal.timeout(5000),
      })
      if (blobs.length === 0) return true
      const rows = await tx
        .select({ openingDance: bookings.openingDanceFileName, lastSong: bookings.lastSongFileName })
        .from(bookings)
        .where(
          and(eq(bookings.customerId, customerId), or(isNotNull(bookings.openingDanceFileName), isNotNull(bookings.lastSongFileName))),
        )
      const used = new Set(rows.flatMap((row) => [row.openingDance, row.lastSong]))
      const loose = blobs.filter((blob) => !used.has(blob.pathname))
      const old = loose.filter((blob) => Date.now() - blob.uploadedAt.getTime() > ORPHAN_AGE_MS)
      if (old.length) await del(old.map((blob) => blob.pathname), { abortSignal: AbortSignal.timeout(5000) })
      return loose.length - old.length < MAX_LOOSE_FILES
    })
  } catch (error) {
    console.error("Failed to tidy booking audio:", error)
    return true
  }
}
