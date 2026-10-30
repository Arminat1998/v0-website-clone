import { NextResponse } from "next/server"
import { listLiveProfessionalArtists } from "@/lib/professional-artist"

export const dynamic = "force-dynamic"

export async function GET() {
  const artists = await listLiveProfessionalArtists()
  return NextResponse.json({ artists })
}
