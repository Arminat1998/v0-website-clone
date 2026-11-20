import { get, put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"
import { getProfessionalId } from "@/lib/bookings/professional"
import { IMAGE_TYPES, MAX_IMAGE_BYTES, MEDIA_PREFIX } from "@/lib/artist-page-types"
import { isSafeBlobPath } from "@/lib/blob-paths"

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
}

const KINDS = ["banner", "avatar", "gallery", "equipment"] as const

export async function POST(request: NextRequest) {
  try {
    const professionalId = await getProfessionalId()
    const formData = await request.formData()
    const file = formData.get("file")
    const kind = String(formData.get("kind") ?? "")

    if (!(file instanceof File)) return NextResponse.json({ error: "no_file" }, { status: 400 })
    if (!(KINDS as readonly string[]).includes(kind)) return NextResponse.json({ error: "invalid_kind" }, { status: 400 })
    if (!(IMAGE_TYPES as readonly string[]).includes(file.type)) return NextResponse.json({ error: "invalid_type" }, { status: 400 })
    if (file.size > MAX_IMAGE_BYTES) return NextResponse.json({ error: "too_large" }, { status: 400 })

    const pathname = `${MEDIA_PREFIX}${professionalId}/${kind}-${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${EXTENSIONS[file.type]}`
    const blob = await put(pathname, file, {
      access: "private",
      addRandomSuffix: false,
      contentType: file.type,
    })

    return NextResponse.json({ pathname: blob.pathname })
  } catch (error) {
    console.error("Artist media upload failed:", error)
    return NextResponse.json({ error: "upload_failed" }, { status: 500 })
  }
}

// The store is private, so the public artist pages read their images through this route.
// Only files under the artist-pages/ prefix are ever served.
export async function GET(request: NextRequest) {
  const pathname = request.nextUrl.searchParams.get("pathname")
  if (!isSafeBlobPath(pathname, MEDIA_PREFIX)) {
    return new NextResponse("Not found", { status: 404 })
  }

  try {
    const result = await get(pathname, {
      access: "private",
      ifNoneMatch: request.headers.get("if-none-match") ?? undefined,
    })
    if (!result) return new NextResponse("Not found", { status: 404 })

    const headers = {
      ETag: result.blob.etag,
      "Cache-Control": "public, max-age=31536000, immutable",
    }
    if (result.statusCode === 304) return new NextResponse(null, { status: 304, headers })

    return new NextResponse(result.stream, {
      headers: { ...headers, "Content-Type": result.blob.contentType },
    })
  } catch (error) {
    console.error("Artist media read failed:", error)
    return new NextResponse("Not found", { status: 404 })
  }
}
