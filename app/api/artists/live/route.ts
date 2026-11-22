import { NextResponse } from "next/server"
import { listLiveProfessionalArtists } from "@/lib/professional-artist"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    return NextResponse.json({ artists: await listLiveProfessionalArtists() })
  } catch (error) {
    // An error status, so the page offers "try again" instead of an empty list.
    console.error("Failed to list live artists:", error)
    return NextResponse.json({ error: "unavailable" }, { status: 500 })
  }
}
