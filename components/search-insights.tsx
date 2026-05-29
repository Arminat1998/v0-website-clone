"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Lightbulb, TrendingUp, Users, Clock } from "lucide-react"

interface SearchInsightsProps {
  query: string
  resultCount: number
  searchTime?: number
}

export function SearchInsights({ query, resultCount, searchTime }: SearchInsightsProps) {
  if (!query.trim()) return null

  const getSearchInsights = (query: string) => {
    const insights = []
    const lowerQuery = query.toLowerCase()

    // Event type insights
    if (lowerQuery.includes("bruiloft") || lowerQuery.includes("wedding")) {
      insights.push({
        type: "tip",
        icon: Lightbulb,
        title: "Bruiloft tip",
        description: "Overweeg een DJ met ervaring in alle leeftijdsgroepen voor de perfecte mix",
      })
    }

    if (lowerQuery.includes("corporate") || lowerQuery.includes("zakelijk")) {
      insights.push({
        type: "tip",
        icon: Users,
        title: "Corporate evenement",
        description: "Professionele DJ's begrijpen de balans tussen entertainment en networking",
      })
    }

    if (lowerQuery.includes("verjaardag") || lowerQuery.includes("birthday")) {
      insights.push({
        type: "tip",
        icon: TrendingUp,
        title: "Verjaardag feest",
        description: "Denk aan de leeftijd van de jarige en gasten voor de juiste muziekstijl",
      })
    }

    // Music style insights
    if (lowerQuery.includes("house") || lowerQuery.includes("techno")) {
      insights.push({
        type: "trend",
        icon: TrendingUp,
        title: "Electronic trending",
        description: "House en techno zijn populair voor club nights en dance events",
      })
    }

    if (lowerQuery.includes("klassiek") || lowerQuery.includes("classic")) {
      insights.push({
        type: "tip",
        icon: Clock,
        title: "Tijdloze keuze",
        description: "Klassieke hits werken perfect voor mixed-age crowds",
      })
    }

    // General insights based on result count
    if (resultCount > 15) {
      insights.push({
        type: "filter",
        icon: Users,
        title: "Veel opties gevonden",
        description: "Gebruik filters om je zoekopdracht te verfijnen",
      })
    } else if (resultCount < 3) {
      insights.push({
        type: "expand",
        icon: Lightbulb,
        title: "Weinig resultaten",
        description: "Probeer bredere zoektermen of verwijder enkele filters",
      })
    }

    return insights.slice(0, 2) // Limit to 2 insights
  }

  const insights = getSearchInsights(query)

  if (insights.length === 0) return null

  return (
    <div className="mb-6">
      <div className="flex flex-wrap gap-3">
        {insights.map((insight, index) => (
          <Card key={index} className="border-l-4 border-l-red-500">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <insight.icon className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm">{insight.title}</h4>
                    <Badge variant="secondary" className="text-xs">
                      {insight.type === "tip" && "Tip"}
                      {insight.type === "trend" && "Trending"}
                      {insight.type === "filter" && "Filter"}
                      {insight.type === "expand" && "Uitbreiden"}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600">{insight.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
