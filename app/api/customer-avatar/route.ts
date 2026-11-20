import { del, get, put } from "@vercel/blob"
import { eq } from "drizzle-orm"
import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { user as userTable } from "@/lib/db/schema"
import { getSession } from "@/lib/session"
import { IMAGE_TYPES, MAX_IMAGE_BYTES } from "@/lib/artist-page-types"
import { isSafeBlobPath } from "@/lib/blob-paths"

const PREFIX = "customer-avatars/"
const ROUTE = "/api/customer-avatar"

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
}

function avatarUrl(pathname: string) {
  return `${ROUTE}?pathname=${encodeURIComponent(pathname)}`
}

/** The blob pathname behind a stored image URL, but only when it is this customer's own avatar. */
function ownPathname(image: string | null | undefined, userId: string) {
  if (!image?.startsWith(`${ROUTE}?`)) return null
  const pathname = new URL(image, "http://localhost").searchParams.get("pathname")
  return isSafeBlobPath(pathname, `${PREFIX}${userId}/`) ? pathname : null
}

async function customer() {
  const session = await getSession()
  return session?.user && session.user.role === "user" ? session.user : null
}

async function removeOld(image: string | null | undefined, userId: string) {
  const old = ownPathname(image, userId)
  if (!old) return
  try {
    await del(old)
  } catch (error) {
    console.error("Customer avatar cleanup failed:", error)
  }
}

export async function POST(request: NextRequest) {
  const account = await customer()
  if (!account) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  try {
    const formData = await request.formData()
    const file = formData.get("file")
    if (!(file instanceof File)) return NextResponse.json({ error: "no_file" }, { status: 400 })
    if (!(IMAGE_TYPES as readonly string[]).includes(file.type)) return NextResponse.json({ error: "invalid_type" }, { status: 400 })
    if (file.size > MAX_IMAGE_BYTES) return NextResponse.json({ error: "too_large" }, { status: 400 })

    const pathname = `${PREFIX}${account.id}/avatar-${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${EXTENSIONS[file.type]}`
    await put(pathname, file, { access: "private", addRandomSuffix: false, contentType: file.type })

    const image = avatarUrl(pathname)
    await db.update(userTable).set({ image }).where(eq(userTable.id, account.id))
    await removeOld(account.image, account.id)

    return NextResponse.json({ image })
  } catch (error) {
    console.error("Customer avatar upload failed:", error)
    return NextResponse.json({ error: "upload_failed" }, { status: 500 })
  }
}

export async function DELETE() {
  const account = await customer()
  if (!account) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  try {
    await db.update(userTable).set({ image: null }).where(eq(userTable.id, account.id))
    await removeOld(account.image, account.id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Customer avatar delete failed:", error)
    return NextResponse.json({ error: "delete_failed" }, { status: 500 })
  }
}

// The store is private: avatars are read through this route. Only files under customer-avatars/ are served.
export async function GET(request: NextRequest) {
  const pathname = request.nextUrl.searchParams.get("pathname")
  if (!isSafeBlobPath(pathname, PREFIX)) {
    return new NextResponse("Not found", { status: 404 })
  }

  try {
    const result = await get(pathname, {
      access: "private",
      ifNoneMatch: request.headers.get("if-none-match") ?? undefined,
    })
    if (!result) return new NextResponse("Not found", { status: 404 })

    const headers = { ETag: result.blob.etag, "Cache-Control": "public, max-age=31536000, immutable" }
    if (result.statusCode === 304) return new NextResponse(null, { status: 304, headers })

    return new NextResponse(result.stream, { headers: { ...headers, "Content-Type": result.blob.contentType } })
  } catch (error) {
    console.error("Customer avatar read failed:", error)
    return new NextResponse("Not found", { status: 404 })
  }
}
