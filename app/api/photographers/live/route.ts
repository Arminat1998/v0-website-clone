import { NextResponse } from "next/server"
import { listLivePhotographers } from "@/lib/professional-artist"

export const dynamic = "force-dynamic"

export async function GET() {
  const photographers = await listLivePhotographers()
  return NextResponse.json({ photographers })
}
