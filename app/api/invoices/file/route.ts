import { get } from "@vercel/blob"
import { and, eq } from "drizzle-orm"
import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { invoices } from "@/lib/db/schema"
import { getSession, isAdmin, isProfessional } from "@/lib/session"
import { isSafeBlobPath } from "@/lib/blob-paths"
import { invoiceBlobPrefix } from "@/lib/bookings/invoicing"
import { logError } from "@/lib/log-error"

/** Admins only open the files an invoice refers to: the uploaded invoice itself and its receipts. */
async function isInvoiceFile(pathname: string) {
  const [, professionalId, bookingId] = /^invoices\/([^/]+)\/([1-9]\d{0,8})\//.exec(pathname) ?? []
  if (!professionalId || !isSafeBlobPath(pathname, invoiceBlobPrefix(professionalId, Number(bookingId)))) return false
  const rows = await db
    .select({ filePathname: invoices.filePathname, lines: invoices.lines })
    .from(invoices)
    .where(and(eq(invoices.professionalId, professionalId), eq(invoices.bookingId, Number(bookingId))))
  return rows.some((row) => row.filePathname === pathname || row.lines.some((line) => line.receipt?.pathname === pathname))
}

export async function GET(request: NextRequest) {
  try {
    const account = (await getSession())?.user
    if (!account) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
    const pathname = request.nextUrl.searchParams.get("pathname")
    if (!pathname) return NextResponse.json({ error: "missing_pathname" }, { status: 400 })
    // Files live under invoices/<professionalId>/..., so for the professional the prefix check is the ownership check.
    const allowed = isProfessional(account)
      ? isSafeBlobPath(pathname, `invoices/${account.id}/`)
      : isAdmin(account) && (await isInvoiceFile(pathname))
    if (!allowed) return NextResponse.json({ error: "forbidden" }, { status: 403 })

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
    logError("Invoice file fetch failed:", error)
    return NextResponse.json({ error: "fetch_failed" }, { status: 500 })
  }
}
