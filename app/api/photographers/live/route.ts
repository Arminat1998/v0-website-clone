import { NextResponse } from "next/server"
import { listLivePhotographers } from "@/lib/professional-artist"
import { logError } from "@/lib/log-error"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    return NextResponse.json({ photographers: await listLivePhotographers() })
  } catch (error) {
    // An error status, so the page offers "try again" instead of an empty list.
    logError("Failed to list live photographers:", error)
    return NextResponse.json({ error: "unavailable" }, { status: 500 })
  }
}
