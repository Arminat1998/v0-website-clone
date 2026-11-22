import { get, issueSignedToken } from "@vercel/blob"
import { handleUploadPresigned, type HandleUploadPresignedBody } from "@vercel/blob/client"
import { and, eq, or } from "drizzle-orm"
import { after, type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { bookings } from "@/lib/db/schema"
import { getSession, isAdmin } from "@/lib/session"
import { takeToken } from "@/lib/rate-limit"
import { sweepLooseAudio, tidyLooseAudio } from "@/lib/bookings/audio-storage"
import { AUDIO_KINDS, MAX_AUDIO_BYTES, audioContentType, audioDisplayName, isOwnAudioPath, type AudioKind } from "@/lib/bookings/audio"
import { logError } from "@/lib/log-error"

const UPLOAD_WINDOW_MS = 10 * 60 * 1000

/**
 * Hands out a short-lived upload URL for one audio file, so the browser sends the file straight to the private
 * store (a request through the server is capped at 4.5 MB). The URL only works for this path, type and size.
 */
export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  // Admins have no bookings of their own and no access to the music of others.
  if (isAdmin(session.user)) return NextResponse.json({ error: "forbidden" }, { status: 403 })
  const userId = session.user.id
  if (!takeToken(`booking-audio:${userId}`, 10, UPLOAD_WINDOW_MS)) return NextResponse.json({ error: "too_many" }, { status: 429 })

  const body = (await request.json().catch(() => null)) as HandleUploadPresignedBody | null
  if (body?.type !== "blob.generate-presigned-url" || !isOwnAudioPath(body.payload?.pathname, userId)) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 })
  }
  if (!(await tidyLooseAudio(userId))) return NextResponse.json({ error: "too_many" }, { status: 429 })

  try {
    const result = await handleUploadPresigned({
      body,
      request,
      // Only used to verify completion callbacks, which this route does not accept.
      webhookPublicKey: "unused",
      getSignedToken: async (pathname) => {
        const contentType = audioContentType(pathname)
        const limits = {
          allowedContentTypes: contentType ? [contentType] : [],
          maximumSizeInBytes: MAX_AUDIO_BYTES,
          validUntil: Date.now() + UPLOAD_WINDOW_MS,
        }
        return {
          token: await issueSignedToken({ ...limits, pathname, operations: ["put"] }),
          urlOptions: { ...limits, allowOverwrite: false, addRandomSuffix: false },
        }
      },
    })
    after(sweepLooseAudio)
    return NextResponse.json(result)
  } catch (error) {
    logError("Booking audio upload failed:", error)
    return NextResponse.json({ error: "upload_failed" }, { status: 500 })
  }
}

/** Plays or downloads the music of one booking, only for the customer and the professional of that booking. */
export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  if (isAdmin(session.user)) return NextResponse.json({ error: "forbidden" }, { status: 403 })

  const params = request.nextUrl.searchParams
  const bookingId = Number(params.get("bookingId"))
  const kind = params.get("kind") as AudioKind
  if (!Number.isSafeInteger(bookingId) || bookingId <= 0 || bookingId > 2_147_483_647 || !AUDIO_KINDS.includes(kind)) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 })
  }

  try {
    const [booking] = await db
      .select({
        customerId: bookings.customerId,
        openingDance: bookings.openingDanceFileName,
        lastSong: bookings.lastSongFileName,
      })
      .from(bookings)
      .where(
        and(
          eq(bookings.id, bookingId),
          or(eq(bookings.customerId, session.user.id), eq(bookings.professionalId, session.user.id)),
        ),
      )
      .limit(1)
    const pathname = kind === "opening-dance" ? booking?.openingDance : booking?.lastSong
    if (!booking?.customerId || !isOwnAudioPath(pathname, booking.customerId)) return new NextResponse("Not found", { status: 404 })

    // Safari only plays audio from a server that answers range requests.
    const range = request.headers.get("range")
    const result = await get(pathname, { access: "private", headers: range ? { range } : undefined })
    if (!result || result.statusCode !== 200) return new NextResponse("Not found", { status: 404 })

    const headers = new Headers({
      "Content-Type": audioContentType(pathname) ?? "application/octet-stream",
      "Content-Disposition": `${params.get("download") ? "attachment" : "inline"}; filename="${audioDisplayName(pathname)}"`,
      "Accept-Ranges": "bytes",
      "Cache-Control": "private, no-cache",
    })
    const contentRange = result.headers.get("content-range")
    const contentLength = result.headers.get("content-length")
    if (contentRange) headers.set("Content-Range", contentRange)
    if (contentLength) headers.set("Content-Length", contentLength)
    return new NextResponse(result.stream, { status: contentRange ? 206 : 200, headers })
  } catch (error) {
    logError("Booking audio read failed:", error)
    return NextResponse.json({ error: "fetch_failed" }, { status: 500 })
  }
}
