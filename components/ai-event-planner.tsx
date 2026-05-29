"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Lightbulb, Euro, Clock } from "lucide-react"

export function AiEventPlanner() {
  const [eventType, setEventType] = useState("")
  const [season, setSeason] = useState("")
  const [budget, setBudget] = useState("")
  const [suggestions, setSuggestions] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const getSuggestions = async () => {
    if (!eventType || !season || !budget) return

    setLoading(true)
    try {
      const response = await fetch("/api/ai/event-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventType, season, budget: Number.parseInt(budget) }),
      })
      const data = await response.json()
      setSuggestions(data)
    } catch (error) {
      console.error("Error getting suggestions:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            AI Evenement Planner
          </CardTitle>
          <p className="text-gray-600">Laat AI je helpen met creatieve evenementideeën op maat</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="eventType">Type Evenement</Label>
              <Select value={eventType} onValueChange={setEventType}>
                <SelectTrigger>
                  <SelectValue placeholder="Kies evenement type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bruiloft">Bruiloft</SelectItem>
                  <SelectItem value="bedrijfsfeest">Bedrijfsfeest</SelectItem>
                  <SelectItem value="verjaardag">Verjaardag</SelectItem>
                  <SelectItem value="jubileum">Jubileum</SelectItem>
                  <SelectItem value="opening">Opening</SelectItem>
                  <SelectItem value="gala">Gala</SelectItem>
                  <SelectItem value="festival">Festival</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="season">Seizoen</Label>
              <Select value={season} onValueChange={setSeason}>
                <SelectTrigger>
                  <SelectValue placeholder="Kies seizoen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lente">Lente</SelectItem>
                  <SelectItem value="zomer">Zomer</SelectItem>
                  <SelectItem value="herfst">Herfst</SelectItem>
                  <SelectItem value="winter">Winter</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget">Budget (€)</Label>
              <Input
                id="budget"
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="5000"
                min="500"
                step="500"
              />
            </div>
          </div>

          <Button
            onClick={getSuggestions}
            disabled={loading || !eventType || !season || !budget}
            className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
          >
            {loading ? "AI genereert ideeën..." : "Genereer Evenement Ideeën"}
          </Button>
        </CardContent>
      </Card>

      {suggestions && (
        <div className="space-y-6">
          {/* Trending Ideas */}
          <Card className="border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50">
            <CardHeader>
              <CardTitle className="text-yellow-800">Trending Ideeën</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {suggestions.trendingIdeas.map((idea: string, index: number) => (
                  <Badge key={index} variant="secondary" className="bg-yellow-100 text-yellow-800">
                    {idea}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Seasonal Tips */}
          <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50">
            <CardHeader>
              <CardTitle className="text-blue-800">Seizoen Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {suggestions.seasonalTips.map((tip: string, index: number) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    {tip}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Event Suggestions */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">AI Gegenereerde Evenement Ideeën</h3>
            <div className="grid gap-6">
              {suggestions.suggestions.map((suggestion: any, index: number) => (
                <Card key={index} className="border-l-4 border-l-orange-500">
                  <CardHeader>
                    <CardTitle className="text-lg">{suggestion.title}</CardTitle>
                    <p className="text-gray-600">{suggestion.description}</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-orange-700">
                          <Euro className="h-4 w-4" />
                          Budget Schatting
                        </div>
                        <p className="text-sm">
                          €{suggestion.estimatedBudget.min.toLocaleString()} - €
                          {suggestion.estimatedBudget.max.toLocaleString()}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-orange-700">
                          <Clock className="h-4 w-4" />
                          Planning Timeline
                        </div>
                        <p className="text-sm">{suggestion.timeline}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h5 className="font-medium text-orange-800">Aanbevolen Artiesten:</h5>
                      <div className="flex flex-wrap gap-2">
                        {suggestion.recommendedArtists.map((artist: string, i: number) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {artist}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h5 className="font-medium text-orange-800">Belangrijke Overwegingen:</h5>
                      <ul className="space-y-1">
                        {suggestion.keyConsiderations.map((consideration: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                            {consideration}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
