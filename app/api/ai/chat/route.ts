import { streamText, tool } from "ai"
import { z } from "zod"

export const maxDuration = 30

const tools = {
  searchArtists: tool({
    description: "Zoek artiesten op basis van criteria zoals genre, prijs, locatie, etc.",
    inputSchema: z.object({
      genre: z.string().optional().describe("Muziekgenre zoals House, Jazz, Rock"),
      priceRange: z
        .object({
          min: z.number().describe("Minimum prijs in euros"),
          max: z.number().describe("Maximum prijs in euros"),
        })
        .optional()
        .describe("Prijsrange voor de artiest"),
      location: z.string().optional().describe("Locatie zoals Amsterdam, Utrecht, Rotterdam"),
      eventType: z.string().optional().describe("Type evenement zoals bruiloft, bedrijfsfeest, festival"),
    }),
    execute: async ({ genre, priceRange, location, eventType }) => {
      console.log("[v0] AI Chat tool called with:", { genre, priceRange, location, eventType })
      return {
        results: [
          { name: "DJ Mike", genre: "House", price: 800, location: "Amsterdam" },
          { name: "Sarah Jazz Trio", genre: "Jazz", price: 1200, location: "Utrecht" },
          { name: "Rock Band Thunder", genre: "Rock", price: 1500, location: "Rotterdam" },
        ],
        count: 3,
      }
    },
  }),
  getEventAdvice: tool({
    description: "Geef advies over evenementplanning, timing, budget, etc.",
    inputSchema: z.object({
      eventType: z.string().describe("Type evenement"),
      budget: z.number().optional().describe("Budget in euros"),
      guestCount: z.number().optional().describe("Aantal gasten"),
      date: z.string().optional().describe("Datum van het evenement"),
    }),
    execute: async ({ eventType, budget, guestCount, date }) => {
      console.log("[v0] AI Event advice tool called with:", { eventType, budget, guestCount, date })
      return {
        advice: `Voor een ${eventType} met ${guestCount || "onbekend aantal"} gasten adviseren we een budget van €${budget ? budget * 1.2 : 1000} voor de beste ervaring.`,
        tips: [
          "Boek minimaal 6 weken van tevoren",
          "Overweeg een backup plan voor slecht weer",
          "Zorg voor goede geluidsapparatuur",
        ],
      }
    },
  }),
}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    console.log("[v0] AI Chat API called with messages:", messages.length)

    const result = streamText({
      model: "groq/llama-3.3-70b-versatile",
      messages: messages,
      tools,
      system: `
        Je bent een AI-assistent voor ArsiEvents, een premium platform voor het boeken van artiesten en entertainers in Nederland.
        
        Je helpt klanten met:
        - Het vinden van de perfecte artiest voor hun evenement
        - Advies over evenementplanning en budget
        - Informatie over beschikbaarheid en prijzen
        - Tips voor een succesvol evenement
        
        Wees altijd:
        - Vriendelijk en professioneel
        - Specifiek en behulpzaam
        - Gericht op het creëren van onvergetelijke evenementen
        - Transparant over prijzen en voorwaarden
        
        Spreek Nederlands tenzij de klant een andere taal gebruikt.
      `,
      maxOutputTokens: 1500,
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.error("[v0] AI Chat error:", error)
    return Response.json({ error: "Failed to process chat" }, { status: 500 })
  }
}
