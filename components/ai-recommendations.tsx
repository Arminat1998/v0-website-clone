"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sparkles, TrendingUp, MapPin, Calendar, Users, Euro } from "lucide-react"

interface RecommendationProps {
  eventDetails: {
    eventType: string
    budget: number
    date: string
    location: string
    guestCount: number
    atmosphere: string
    specialRequests: string
  }
  availableArtists: any[]
}

export function AiRecommendations({ eventDetails, availableArtists }: RecommendationProps) {
  const [recommendations, setRecommendations] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const getRecommendations = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/ai/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventDetails, availableArtists }),
      })
      const data = await response.json()
      setRecommendations(data)
    } catch (error) {
      console.error("Error getting recommendations:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Button
          onClick={getRecommendations}
          disabled={loading}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          <Sparkles className="mr-2 h-4 w-4" />
          {loading ? "AI analyseert..." : "Krijg AI Aanbevelingen"}
        </Button>
      </div>

      {recommendations && (
        <div className="space-y-6">
          {/* AI Insights */}
          <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-800">
                <TrendingUp className="h-5 w-5" />
                AI Inzichten voor jouw evenement
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-purple-700">
                    <Euro className="h-4 w-4" />
                    Budget Analyse
                  </div>
                  <p className="text-sm text-gray-700">{recommendations.insights.budgetAnalysis}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-purple-700">
                    <Calendar className="h-4 w-4" />
                    Timing Advies
                  </div>
                  <p className="text-sm text-gray-700">{recommendations.insights.timingAdvice}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-purple-700">
                    <Users className="h-4 w-4" />
                    Evenement Match
                  </div>
                  <p className="text-sm text-gray-700">{recommendations.insights.eventTypeMatch}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-purple-700">
                    <MapPin className="h-4 w-4" />
                    Locatie Overwegingen
                  </div>
                  <p className="text-sm text-gray-700">{recommendations.insights.locationConsiderations}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">AI Aanbevolen Artiesten</h3>
            <div className="grid gap-4">
              {recommendations.recommendations.map((rec: any, index: number) => {
                const artist = availableArtists.find((a) => a.id === rec.artistId)
                if (!artist) return null

                return (
                  <Card key={index} className="border-l-4 border-l-purple-500">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-4">
                          <img
                            src={artist.image || "/placeholder.svg"}
                            alt={artist.name}
                            className="w-16 h-16 rounded-full object-cover"
                          />
                          <div>
                            <h4 className="font-semibold text-lg">{artist.name}</h4>
                            <p className="text-gray-600">{artist.genre}</p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                          {rec.matchScore}% match
                        </Badge>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <h5 className="font-medium text-purple-800 mb-1">Waarom perfect voor jouw evenement:</h5>
                          <p className="text-sm text-gray-700">{rec.reason}</p>
                        </div>

                        <div>
                          <h5 className="font-medium text-purple-800 mb-2">Highlights:</h5>
                          <div className="flex flex-wrap gap-2">
                            {rec.highlights.map((highlight: string, i: number) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {highlight}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="flex justify-between items-center pt-3 border-t">
                          <span className="font-semibold text-lg">€{artist.price}</span>
                          <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                            Bekijk Profiel
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
