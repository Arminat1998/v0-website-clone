import { generateObject } from "ai"
import { z } from "zod"
import { aiRateLimited, readLimitedJson } from "@/lib/ai-guard"

const inputSchema = z.object({
  eventType: z.string().trim().min(1).max(80),
  season: z.string().trim().min(1).max(40),
  budget: z.number().finite().min(0).max(1_000_000),
})

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
  if (aiRateLimited(req)) return Response.json({ error: "Too many requests" }, { status: 429 })
  const parsed = inputSchema.safeParse(await readLimitedJson(req))
  if (!parsed.success) return Response.json({ error: "Invalid input" }, { status: 400 })
  const { eventType, season, budget } = parsed.data
  try {

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

    return Response.json(object)
  } catch (error) {
    console.error("AI event suggestions failed:", error instanceof Error ? error.message : "unknown error")
    return Response.json({ error: "Failed to generate event suggestions" }, { status: 500 })
  }
}
