import { generateObject } from "ai"
import { z } from "zod"
import { aiRateLimited, readLimitedJson } from "@/lib/ai-guard"

const text = (max: number) => z.coerce.string().trim().max(max).optional().default("")
const inputSchema = z.object({
  eventDetails: z.object({
    eventType: text(80),
    budget: text(20),
    date: text(40),
    location: text(80),
    guestCount: text(20),
    atmosphere: text(120),
    specialRequests: text(500),
  }),
  availableArtists: z.array(z.unknown()).max(40),
})

const recommendationSchema = z.object({
  recommendations: z.array(
    z.object({
      artistId: z.string(),
      reason: z.string(),
      matchScore: z.number().min(0).max(100),
      highlights: z.array(z.string()),
    }),
  ),
  insights: z.object({
    budgetAnalysis: z.string(),
    eventTypeMatch: z.string(),
    locationConsiderations: z.string(),
    timingAdvice: z.string(),
  }),
})

export async function POST(req: Request) {
  if (aiRateLimited(req)) return Response.json({ error: "Too many requests" }, { status: 429 })
  const parsed = inputSchema.safeParse(await readLimitedJson(req))
  if (!parsed.success) return Response.json({ error: "Invalid input" }, { status: 400 })
  const { eventDetails, availableArtists } = parsed.data
  try {

    const { object } = await generateObject({
      model: "groq/llama-3.3-70b-versatile",
      schema: recommendationSchema,
      prompt: `
        Als AI-assistent voor ArsiEvents, analyseer de volgende evenementdetails en geef gepersonaliseerde aanbevelingen:

        Evenementdetails:
        - Type: ${eventDetails.eventType}
        - Budget: €${eventDetails.budget}
        - Datum: ${eventDetails.date}
        - Locatie: ${eventDetails.location}
        - Aantal gasten: ${eventDetails.guestCount}
        - Sfeer: ${eventDetails.atmosphere}
        - Speciale wensen: ${eventDetails.specialRequests}

        Beschikbare artiesten:
        ${JSON.stringify(availableArtists, null, 2)}

        Geef de top 3-5 aanbevelingen met:
        1. Waarom deze artiest perfect past bij het evenement
        2. Een match score (0-100)
        3. Specifieke highlights die relevant zijn
        4. Praktische inzichten over budget, timing, locatie en evenementtype

        Wees specifiek, professioneel en behulpzaam in je aanbevelingen.
      `,
      maxOutputTokens: 2000,
    })

    return Response.json(object)
  } catch (error) {
    console.error("AI recommendations failed:", error instanceof Error ? error.message : "unknown error")
    return Response.json({ error: "Failed to generate recommendations" }, { status: 500 })
  }
}
