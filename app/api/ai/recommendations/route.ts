import { generateObject } from "ai"
import { z } from "zod"

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
  try {
    const { eventDetails, availableArtists } = await req.json()

    console.log("[v0] AI Recommendations API called with:", { eventDetails, availableArtists })

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

    console.log("[v0] AI Recommendations generated successfully")
    return Response.json(object)
  } catch (error) {
    console.error("[v0] AI Recommendations error:", error)
    return Response.json({ error: "Failed to generate recommendations" }, { status: 500 })
  }
}
