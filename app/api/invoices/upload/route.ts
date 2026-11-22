import { put } from "@vercel/blob"
import { and, eq } from "drizzle-orm"
import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { bookings } from "@/lib/db/schema"
import { professionalIdOrNull } from "@/lib/bookings/professional"
import { INVOICE_FILE_TYPES, invoiceBlobPrefix, MAX_INVOICE_FILE_BYTES } from "@/lib/bookings/invoicing"
import { takeToken } from "@/lib/rate-limit"

export async function POST(request: NextRequest) {
  const professionalId = await professionalIdOrNull()
  if (!professionalId) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  if (!takeToken(`invoice-upload:${professionalId}`, 40, 10 * 60 * 1000)) return NextResponse.json({ error: "too_many" }, { status: 429 })
  try {
    const formData = await request.formData()
    const file = formData.get("file")
    const bookingId = Number.parseInt(String(formData.get("bookingId") ?? ""), 10)

    if (!(file instanceof File)) return NextResponse.json({ error: "no_file" }, { status: 400 })
    if (!Number.isFinite(bookingId)) return NextResponse.json({ error: "invalid_booking" }, { status: 400 })
    if (!(INVOICE_FILE_TYPES as readonly string[]).includes(file.type)) return NextResponse.json({ error: "invalid_type" }, { status: 400 })
    if (file.size > MAX_INVOICE_FILE_BYTES) return NextResponse.json({ error: "too_large" }, { status: 400 })

    const [booking] = await db
      .select({ id: bookings.id, status: bookings.status })
      .from(bookings)
      .where(and(eq(bookings.id, bookingId), eq(bookings.professionalId, professionalId)))
      .limit(1)
    if (!booking || booking.status !== "completed") return NextResponse.json({ error: "invalid_booking" }, { status: 404 })

    const safeName = file.name.replace(/[^\w.-]+/g, "_").slice(-80)
    const blob = await put(`${invoiceBlobPrefix(professionalId, bookingId)}${Date.now()}-${safeName}`, file, {
      access: "private",
      addRandomSuffix: false,
      contentType: file.type,
    })

    return NextResponse.json({ pathname: blob.pathname, name: file.name, size: file.size, contentType: file.type })
  } catch (error) {
    console.error("Invoice upload failed:", error)
    return NextResponse.json({ error: "upload_failed" }, { status: 500 })
  }
}
