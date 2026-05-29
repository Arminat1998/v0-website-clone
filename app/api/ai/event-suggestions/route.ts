import { generateObject } from "ai"
import { z } from "zod"

const eventSuggestionSchema = z.object({
  suggestions: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      recommendedArtists: z.array(z.string()),
      estimatedBudget: z.object({
        min: z.number(),
        max: z.number(),
      }),
      timeline: z.string(),
      keyConsiderations: z.array(z.string()),
    }),
  ),
  seasonalTips: z.array(z.string()),
  trendingIdeas: z.array(z.string()),
})

export async function POST(req: Request) {
  try {
    const { eventType, season, budget } = await req.json()

    console.log("[v0] AI Event Suggestions API called with:", { eventType, season, budget })

    const { object } = await generateObject({
      model: "groq/llama-3.3-70b-versatile",
      schema: eventSuggestionSchema,
      prompt: `
        Genereer creatieve en praktische evenementideeën voor:
        - Type: ${eventType}
        - Seizoen: ${season}
        - Budget: €${budget}

        Geef 3-5 unieke suggesties met:
        1. Pakkende titel en beschrijving
        2. Aanbevolen artiesten/entertainment
        3. Realistische budgetschatting
        4. Planning timeline
        5. Belangrijke overwegingen

        Focus op Nederlandse context en actuele trends.
        Wees creatief maar praktisch uitvoerbaar.
      `,
      maxOutputTokens: 2000,
    })

    console.log("[v0] AI Event Suggestions generated successfully")
    return Response.json(object)
  } catch (error) {
    console.error("[v0] AI Event Suggestions error:", error)
    return Response.json({ error: "Failed to generate event suggestions" }, { status: 500 })
  }
}
