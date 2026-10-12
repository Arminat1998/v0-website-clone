import { get } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"
import { getProfessionalId } from "@/lib/bookings/professional"

export async function GET(request: NextRequest) {
  const professionalId = await getProfessionalId()
  const pathname = request.nextUrl.searchParams.get("pathname")
  if (!pathname) return NextResponse.json({ error: "missing_pathname" }, { status: 400 })
  // Files live under invoices/<professionalId>/..., so the prefix check is the ownership check.
  if (!pathname.startsWith(`invoices/${professionalId}/`)) return NextResponse.json({ error: "forbidden" }, { status: 403 })

  try {
    const result = await get(pathname, {
      access: "private",
      ifNoneMatch: request.headers.get("if-none-match") ?? undefined,
    })
    if (!result) return new NextResponse("Not found", { status: 404 })

    if (result.statusCode === 304) {
      return new NextResponse(null, { status: 304, headers: { ETag: result.blob.etag, "Cache-Control": "private, no-cache" } })
    }

    const fileName = pathname.split("/").pop() ?? "factuur"
    return new NextResponse(result.stream, {
      headers: {
        "Content-Type": result.blob.contentType,
        "Content-Disposition": `inline; filename="${fileName}"`,
        ETag: result.blob.etag,
        "Cache-Control": "private, no-cache",
      },
    })
  } catch (error) {
    console.error("Invoice file fetch failed:", error)
    return NextResponse.json({ error: "fetch_failed" }, { status: 500 })
  }
}
