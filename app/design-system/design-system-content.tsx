"use client"

import { useEffect, useState } from "react"
import { useLanguage } from "@/contexts/language-context"
import { useTheme } from "@/contexts/theme-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import {
  Sun,
  Moon,
  ArrowLeft,
  MapPin,
  Clock,
  Star,
  CheckCircle,
  Sparkles,
  Zap,
  Search,
  Music,
  Camera,
  Calendar,
  Heart,
  MessageCircle,
} from "lucide-react"
import Link from "next/link"

export default function DesignSystemContent() {
  const { language } = useLanguage()
  const { theme, toggleTheme } = useTheme()
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setHydrated(true)
  }, [])

  const colorSections = [
    {
      title: language === "nl" ? "Achtergronden" : "Backgrounds",
      colors: [
        {
          name: "Background",
          light: "oklch(1 0 0)",
          dark: "oklch(0.12 0 0)",
          lightHex: "#FFFFFF",
          darkHex: "#1A1A1A",
          class: "bg-background",
        },
        {
          name: "Card",
          light: "oklch(1 0 0)",
          dark: "oklch(0.17 0 0)",
          lightHex: "#FFFFFF",
          darkHex: "#262626",
          class: "bg-card",
        },
        {
          name: "Muted",
          light: "oklch(0.97 0 0)",
          dark: "oklch(0.25 0 0)",
          lightHex: "#F5F5F5",
          darkHex: "#3D3D3D",
          class: "bg-muted",
        },
        {
          name: "Secondary",
          light: "oklch(0.97 0 0)",
          dark: "oklch(0.25 0 0)",
          lightHex: "#F5F5F5",
          darkHex: "#3D3D3D",
          class: "bg-secondary",
        },
      ],
    },
    {
      title: language === "nl" ? "Tekst Kleuren" : "Text Colors",
      colors: [
        {
          name: "Foreground",
          light: "oklch(0.145 0 0)",
          dark: "oklch(0.95 0 0)",
          lightHex: "#171717",
          darkHex: "#F5F5F5",
          class: "text-foreground",
          isText: true,
        },
        {
          name: "Muted Foreground",
          light: "oklch(0.556 0 0)",
          dark: "oklch(0.7 0 0)",
          lightHex: "#737373",
          darkHex: "#A3A3A3",
          class: "text-muted-foreground",
          isText: true,
        },
      ],
    },
    {
      title: language === "nl" ? "Accent Kleuren" : "Accent Colors",
      colors: [
        {
          name: "Primary Red (Destructive)",
          light: "oklch(0.577 0.245 27.325)",
          dark: "oklch(0.5 0.2 25)",
          lightHex: "#CC2222",
          darkHex: "#991B1B",
          class: "bg-destructive",
        },
        {
          name: "Blue (View Profile)",
          light: "#2563EB",
          dark: "#3B82F6",
          lightHex: "#2563EB",
          darkHex: "#3B82F6",
          class: "bg-blue-600 dark:bg-blue-500",
        },
        {
          name: "Red Button (Book Now)",
          light: "#B91C1C",
          dark: "#B91C1C",
          lightHex: "#B91C1C",
          darkHex: "#B91C1C",
          class: "bg-red-700",
        },
      ],
    },
    {
      title: language === "nl" ? "Border & Input" : "Border & Input",
      colors: [
        {
          name: "Border",
          light: "oklch(0.922 0 0)",
          dark: "oklch(0.3 0 0)",
          lightHex: "#E5E5E5",
          darkHex: "#404040",
          class: "border-border",
        },
        {
          name: "Input",
          light: "oklch(0.922 0 0)",
          dark: "oklch(0.25 0 0)",
          lightHex: "#E5E5E5",
          darkHex: "#3D3D3D",
          class: "bg-input",
        },
      ],
    },
  ]

  const overviewPageColors = [
    {
      title: language === "nl" ? "Kaart Elementen" : "Card Elements",
      items: [
        { name: "Card Background", lightClass: "bg-white", darkClass: "dark:bg-card", preview: "bg-card" },
        {
          name: "Card Border",
          lightClass: "border-gray-200",
          darkClass: "dark:border-border",
          preview: "border border-border",
        },
        {
          name: "Profile Ring",
          lightClass: "border-white",
          darkClass: "dark:border-card",
          preview: "border-4 border-card",
        },
        { name: "Image Overlay", lightClass: "bg-black/20", darkClass: "dark:bg-black/20", preview: "bg-black/20" },
      ],
    },
    {
      title: language === "nl" ? "Badge Kleuren" : "Badge Colors",
      items: [
        {
          name: "Genre Badge",
          lightClass: "bg-gray-100 text-gray-800",
          darkClass: "dark:bg-secondary dark:text-secondary-foreground",
          preview: "bg-secondary text-secondary-foreground",
        },
        {
          name: "Event Type Badge",
          lightClass: "bg-gray-100 text-gray-800",
          darkClass: "dark:bg-secondary dark:text-secondary-foreground",
          preview: "bg-secondary text-secondary-foreground",
        },
        {
          name: "AI Badge",
          lightClass: "bg-blue-100 text-blue-700",
          darkClass: "dark:bg-blue-950/40 dark:text-blue-300",
          preview: "bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300",
        },
        {
          name: "Viewed Badge",
          lightClass: "bg-blue-500/50",
          darkClass: "dark:bg-blue-500/50",
          preview: "bg-blue-500/50 text-white",
        },
      ],
    },
    {
      title: language === "nl" ? "Filter Panel" : "Filter Panel",
      items: [
        { name: "Filter Background", lightClass: "bg-white", darkClass: "dark:bg-card", preview: "bg-card" },
        {
          name: "Selected Date",
          lightClass: "bg-red-50 border-red-200 text-red-700",
          darkClass: "dark:bg-red-950/40 dark:border-red-800 dark:text-red-300",
          preview: "bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800",
        },
        {
          name: "Calendar Selected",
          lightClass: "bg-red-500 text-white",
          darkClass: "dark:bg-red-500 dark:text-white",
          preview: "bg-red-500 text-white",
        },
        {
          name: "Smart Suggestion",
          lightClass: "bg-blue-50 border-blue-200",
          darkClass: "dark:bg-blue-950/40 dark:border-blue-800",
          preview: "bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800",
        },
      ],
    },
  ]

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">{language === "nl" ? "Terug naar home" : "Back to home"}</span>
            </Link>
          </div>
          <h1 className="text-xl font-bold text-foreground">Design System</h1>
          <Button variant="outline" size="sm" onClick={toggleTheme} className="gap-2 bg-transparent">
              {hydrated && theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              <span className="hidden sm:inline">{hydrated && theme === "dark" ? "Light" : "Dark"}</span>
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Introduction */}
        <section className="mb-16">
          <div className="max-w-3xl">
            <h2 className="text-4xl font-bold text-foreground mb-4">ArsiEvents Design System</h2>
            <p className="text-lg text-muted-foreground mb-6">
              {language === "nl"
                ? "Een complete referentie voor alle visuele elementen, kleuren, typografie en componenten gebruikt in het ArsiEvents platform. Dit systeem ondersteunt zowel Light als Dark mode."
                : "A complete reference for all visual elements, colors, typography, and components used in the ArsiEvents platform. This system supports both Light and Dark mode."}
            </p>
            <div className="flex items-center gap-4 p-4 rounded-lg bg-muted">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-foreground"></div>
                <span className="text-sm font-medium text-foreground">
                  {language === "nl" ? "Huidige modus:" : "Current mode:"} {hydrated && theme === "dark" ? "Dark" : "Light"}
                </span>
              </div>
              <span className="text-muted-foreground">|</span>
              <span className="text-sm text-muted-foreground">
                {language === "nl" ? "Klik op de knop rechtsboven om te wisselen" : "Click the button above to switch"}
              </span>
            </div>
          </div>
        </section>

        {/* Color Palette */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            {language === "nl" ? "Kleurenpalet" : "Color Palette"}
          </h2>
          <p className="text-muted-foreground mb-8">
            {language === "nl"
              ? "Alle kleuren worden gedefinieerd in CSS variabelen en passen zich automatisch aan de actieve modus aan."
              : "All colors are defined as CSS variables and automatically adapt to the active mode."}
          </p>

          {colorSections.map((section) => (
            <div key={section.title} className="mb-10">
              <h3 className="text-xl font-semibold text-foreground mb-4">{section.title}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {section.colors.map((color) => (
                  <Card key={color.name} className="overflow-hidden">
                    <div className="grid grid-cols-2 h-24">
                      <div className="flex items-end p-2" style={{ backgroundColor: color.lightHex }}>
                        <span className="text-xs font-mono text-black/70">Light</span>
                      </div>
                      <div className="flex items-end p-2" style={{ backgroundColor: color.darkHex }}>
                        <span className="text-xs font-mono text-white/70">Dark</span>
                      </div>
                    </div>
                    <CardContent className="p-3">
                      <p className="font-medium text-sm text-foreground mb-1">{color.name}</p>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">
                          <span className="font-medium">L:</span> {color.lightHex}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          <span className="font-medium">D:</span> {color.darkHex}
                        </p>
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded block mt-2">{color.class}</code>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </section>

        {/* Overview Page Specific Colors */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            {language === "nl" ? "Overview Page Kleuren" : "Overview Page Colors"}
          </h2>
          <p className="text-muted-foreground mb-8">
            {language === "nl"
              ? "Specifieke kleuren gebruikt in de Artiesten en Photo/Videograaf overview pagina's."
              : "Specific colors used in the Artists and Photo/Videographer overview pages."}
          </p>

          {overviewPageColors.map((section) => (
            <div key={section.title} className="mb-10">
              <h3 className="text-xl font-semibold text-foreground mb-4">{section.title}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {section.items.map((item) => (
                  <Card key={item.name} className="overflow-hidden">
                    <div className={`h-16 ${item.preview}`}></div>
                    <CardContent className="p-3">
                      <p className="font-medium text-sm text-foreground mb-2">{item.name}</p>
                      <div className="space-y-1 text-xs">
                        <p className="text-muted-foreground">
                          <span className="font-medium">Light:</span> {item.lightClass}
                        </p>
                        <p className="text-muted-foreground">
                          <span className="font-medium">Dark:</span> {item.darkClass}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </section>

        {/* Typography */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-2">{language === "nl" ? "Typografie" : "Typography"}</h2>
          <p className="text-muted-foreground mb-8">
            {language === "nl"
              ? "Typografische schaal gebaseerd op Inter font family."
              : "Typographic scale based on Inter font family."}
          </p>

          <Card className="p-6">
            <div className="space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
                <div>
                  <h1 className="text-4xl md:text-5xl font-bold text-foreground">Heading 1</h1>
                  <p className="text-sm text-muted-foreground mt-1">Hero titles, page headers</p>
                </div>
                <code className="text-xs bg-muted px-2 py-1 rounded whitespace-nowrap">
                  text-4xl md:text-5xl font-bold
                </code>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
                <div>
                  <h2 className="text-3xl font-bold text-foreground">Heading 2</h2>
                  <p className="text-sm text-muted-foreground mt-1">Section titles</p>
                </div>
                <code className="text-xs bg-muted px-2 py-1 rounded whitespace-nowrap">text-3xl font-bold</code>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
                <div>
                  <h3 className="text-2xl font-bold text-foreground">Heading 3</h3>
                  <p className="text-sm text-muted-foreground mt-1">Card titles, subsections</p>
                </div>
                <code className="text-xs bg-muted px-2 py-1 rounded whitespace-nowrap">text-2xl font-bold</code>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
                <div>
                  <h4 className="text-lg font-bold text-foreground">Heading 4</h4>
                  <p className="text-sm text-muted-foreground mt-1">Artist names, small headers</p>
                </div>
                <code className="text-xs bg-muted px-2 py-1 rounded whitespace-nowrap">text-lg font-bold</code>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
                <div>
                  <p className="text-base text-foreground">Body Text</p>
                  <p className="text-sm text-muted-foreground mt-1">Default paragraph text</p>
                </div>
                <code className="text-xs bg-muted px-2 py-1 rounded whitespace-nowrap">text-base</code>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
                <div>
                  <p className="text-sm text-muted-foreground">Small Text / Labels</p>
                  <p className="text-xs text-muted-foreground mt-1">Helper text, metadata</p>
                </div>
                <code className="text-xs bg-muted px-2 py-1 rounded whitespace-nowrap">
                  text-sm text-muted-foreground
                </code>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Extra Small / Captions</p>
                  <p className="text-xs text-muted-foreground mt-1">Badges, fine print</p>
                </div>
                <code className="text-xs bg-muted px-2 py-1 rounded whitespace-nowrap">text-xs</code>
              </div>
            </div>
          </Card>
        </section>

        {/* Buttons */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-2">{language === "nl" ? "Knoppen" : "Buttons"}</h2>
          <p className="text-muted-foreground mb-8">
            {language === "nl"
              ? "Alle button varianten gebruikt in het platform."
              : "All button variants used in the platform."}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Primary Buttons */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                {language === "nl" ? "Primaire Acties" : "Primary Actions"}
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <Button className="bg-red-700 hover:bg-red-600 text-white">
                    {language === "nl" ? "Boek Nu" : "Book Now"}
                  </Button>
                  <code className="text-xs bg-muted px-2 py-1 rounded">bg-red-700 hover:bg-red-600</code>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <Button className="bg-red-700 hover:bg-red-600 text-white">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Chat
                  </Button>
                  <code className="text-xs bg-muted px-2 py-1 rounded">bg-red-700 hover:bg-red-600</code>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <Button className="bg-red-700 hover:bg-red-600 text-white">
                    <Sparkles className="w-4 h-4 mr-2" />
                    {language === "nl" ? "Zoeken" : "Search"}
                  </Button>
                  <code className="text-xs bg-muted px-2 py-1 rounded">bg-red-700 hover:bg-red-600</code>
                </div>
              </div>
            </Card>

            {/* Secondary Buttons */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                {language === "nl" ? "Secundaire Acties" : "Secondary Actions"}
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <Button
                    variant="outline"
                    className="text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/40 bg-transparent"
                  >
                    {language === "nl" ? "Bekijk Profiel" : "View Profile"}
                  </Button>
                  <code className="text-xs bg-muted px-2 py-1 rounded">text-blue-600</code>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <Button variant="outline">{language === "nl" ? "Outline Knop" : "Outline Button"}</Button>
                  <code className="text-xs bg-muted px-2 py-1 rounded">variant="outline"</code>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <Button variant="ghost">{language === "nl" ? "Ghost Knop" : "Ghost Button"}</Button>
                  <code className="text-xs bg-muted px-2 py-1 rounded">variant="ghost"</code>
                </div>
              </div>
            </Card>

            {/* Sign Up Button */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                {language === "nl" ? "Authenticatie" : "Authentication"}
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <Button className="bg-red-600 hover:bg-red-700 text-white rounded-full px-6">Sign Up</Button>
                  <code className="text-xs bg-muted px-2 py-1 rounded">bg-red-600 rounded-full</code>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <Button variant="ghost" className="text-red-600 dark:text-red-500 hover:text-red-700">
                    Log In
                  </Button>
                  <code className="text-xs bg-muted px-2 py-1 rounded">text-red-600</code>
                </div>
              </div>
            </Card>

            {/* Button Sizes */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">{language === "nl" ? "Groottes" : "Sizes"}</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <Button size="sm" className="bg-red-700 hover:bg-red-600 text-white">
                    Small
                  </Button>
                  <code className="text-xs bg-muted px-2 py-1 rounded">size="sm"</code>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <Button className="bg-red-700 hover:bg-red-600 text-white">Default</Button>
                  <code className="text-xs bg-muted px-2 py-1 rounded">default</code>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <Button size="lg" className="bg-red-700 hover:bg-red-600 text-white">
                    Large
                  </Button>
                  <code className="text-xs bg-muted px-2 py-1 rounded">size="lg"</code>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* Form Elements */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            {language === "nl" ? "Formulier Elementen" : "Form Elements"}
          </h2>
          <p className="text-muted-foreground mb-8">
            {language === "nl"
              ? "Input velden, selects en andere formulier componenten."
              : "Input fields, selects and other form components."}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Input Fields</h3>
              <div className="space-y-4">
                <div>
                  <Label className="mb-2 block">Default Input</Label>
                  <Input placeholder="Placeholder text..." />
                </div>
                <div>
                  <Label className="mb-2 block">Search Input</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input className="pl-10" placeholder="Zoek artiesten..." />
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Select & Switch</h3>
              <div className="space-y-4">
                <div>
                  <Label className="mb-2 block">Select Dropdown</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Sorteer op..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="relevance">Relevantie</SelectItem>
                      <SelectItem value="price-low">Prijs (laag-hoog)</SelectItem>
                      <SelectItem value="price-high">Prijs (hoog-laag)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-3">
                  <Switch id="ai-toggle" />
                  <Label htmlFor="ai-toggle" className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-blue-500" />
                    AI Slimme Zoeken
                  </Label>
                </div>
              </div>
            </Card>

            <Card className="p-6 md:col-span-2">
              <h3 className="text-lg font-semibold text-foreground mb-4">Slider</h3>
              <div className="space-y-4">
                <Label>Prijs Range: €100 - €5000</Label>
                <Slider defaultValue={[100, 2500]} max={5000} min={100} step={50} className="w-full" />
              </div>
            </Card>
          </div>
        </section>

        {/* Badges */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-2">Badges</h2>
          <p className="text-muted-foreground mb-8">
            {language === "nl"
              ? "Labels en tags voor categorisering en status indicators."
              : "Labels and tags for categorization and status indicators."}
          </p>

          <Card className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-medium text-foreground mb-3">
                  {language === "nl" ? "Genre Badges" : "Genre Badges"}
                </h4>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">House</Badge>
                  <Badge variant="secondary">Techno</Badge>
                  <Badge variant="secondary">Pop</Badge>
                  <Badge variant="secondary">+3</Badge>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-3">
                  {language === "nl" ? "Event Type Badges" : "Event Type Badges"}
                </h4>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Wedding</Badge>
                  <Badge variant="secondary">Corporate</Badge>
                  <Badge variant="secondary">+2</Badge>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-3">
                  {language === "nl" ? "Status Badges" : "Status Badges"}
                </h4>
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-blue-500/50 text-white">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Bekeken
                  </Badge>
                  <Badge className="bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300">
                    <Sparkles className="w-3 h-3 mr-1" />
                    AI Match
                  </Badge>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* Cards Preview */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            {language === "nl" ? "Kaart Voorbeelden" : "Card Examples"}
          </h2>
          <p className="text-muted-foreground mb-8">
            {language === "nl"
              ? "Voorbeelden van kaarten zoals ze verschijnen in de overview pagina's."
              : "Examples of cards as they appear in the overview pages."}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Mini Artist Card Preview */}
            <Card className="overflow-hidden">
              <div className="h-32 bg-gradient-to-br from-purple-600 to-pink-500"></div>
              <CardContent className="p-4">
                <div className="flex items-start gap-3 -mt-10 mb-3">
                  <div className="w-16 h-16 rounded-full border-4 border-card bg-muted flex items-center justify-center">
                    <Music className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div className="mt-6">
                    <h3 className="font-bold text-foreground">DJ Marco</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> Amsterdam
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm mb-3">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" /> 1-8 hrs
                  </span>
                  <span className="font-bold text-foreground">€150 per uur</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  <Badge variant="secondary" className="text-xs">
                    House
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    Techno
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400 text-xs bg-transparent"
                  >
                    Bekijk Profiel
                  </Button>
                  <Button size="sm" className="flex-1 bg-red-700 hover:bg-red-600 text-white text-xs">
                    Boek Nu
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Mini Photo Card Preview */}
            <Card className="overflow-hidden">
              <div className="h-32 bg-gradient-to-br from-teal-600 to-blue-500"></div>
              <CardContent className="p-4">
                <div className="flex items-start gap-3 -mt-10 mb-3">
                  <div className="w-16 h-16 rounded-full border-4 border-card bg-muted flex items-center justify-center">
                    <Camera className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div className="mt-6">
                    <h3 className="font-bold text-foreground">Studio Light</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> Rotterdam
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm mb-3">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" /> 1-8 hrs
                  </span>
                  <span className="font-bold text-foreground">€200 per uur</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  <Badge variant="secondary" className="text-xs">
                    Photographer
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    Wedding
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400 text-xs bg-transparent"
                  >
                    Bekijk Profiel
                  </Button>
                  <Button size="sm" className="flex-1 bg-red-700 hover:bg-red-600 text-white text-xs">
                    Boek Nu
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Filter Panel Preview */}
            <Card className="p-4">
              <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-500" />
                Filter Panel
              </h4>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Artiest Type</Label>
                  <Select>
                    <SelectTrigger className="h-8 text-xs mt-1">
                      <SelectValue placeholder="Selecteer..." />
                    </SelectTrigger>
                  </Select>
                </div>
                <div className="p-2 rounded bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800">
                  <p className="text-xs text-red-700 dark:text-red-300 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    15 januari 2026
                  </p>
                </div>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="default" className="text-xs">
                    House <span className="ml-1">×</span>
                  </Badge>
                  <Badge variant="default" className="text-xs">
                    Wedding <span className="ml-1">×</span>
                  </Badge>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* Icons */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-2">{language === "nl" ? "Iconen" : "Icons"}</h2>
          <p className="text-muted-foreground mb-8">
            {language === "nl" ? "Lucide icons gebruikt in het platform." : "Lucide icons used in the platform."}
          </p>

          <Card className="p-6">
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-4">
              {[
                { icon: MapPin, name: "MapPin" },
                { icon: Clock, name: "Clock" },
                { icon: Star, name: "Star" },
                { icon: CheckCircle, name: "CheckCircle" },
                { icon: Sparkles, name: "Sparkles" },
                { icon: Zap, name: "Zap" },
                { icon: Search, name: "Search" },
                { icon: Music, name: "Music" },
                { icon: Camera, name: "Camera" },
                { icon: Calendar, name: "Calendar" },
                { icon: Heart, name: "Heart" },
                { icon: MessageCircle, name: "MessageCircle" },
                { icon: Sun, name: "Sun" },
                { icon: Moon, name: "Moon" },
                { icon: ArrowLeft, name: "ArrowLeft" },
              ].map(({ icon: Icon, name }) => (
                <div key={name} className="flex flex-col items-center gap-2 p-2">
                  <Icon className="w-5 h-5 text-foreground" />
                  <span className="text-xs text-muted-foreground">{name}</span>
                </div>
              ))}
            </div>
          </Card>
        </section>

        {/* Spacing & Layout */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            {language === "nl" ? "Spacing & Layout" : "Spacing & Layout"}
          </h2>
          <p className="text-muted-foreground mb-8">
            {language === "nl"
              ? "Consistente spacing schaal en layout patronen."
              : "Consistent spacing scale and layout patterns."}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Spacing Scale</h3>
              <div className="space-y-3">
                {[
                  { size: "4px", class: "p-1", name: "xs" },
                  { size: "8px", class: "p-2", name: "sm" },
                  { size: "16px", class: "p-4", name: "md" },
                  { size: "24px", class: "p-6", name: "lg" },
                  { size: "32px", class: "p-8", name: "xl" },
                ].map((item) => (
                  <div key={item.class} className="flex items-center gap-4">
                    <div className={`bg-destructive ${item.class}`}></div>
                    <span className="text-sm text-foreground font-medium w-8">{item.name}</span>
                    <code className="text-xs bg-muted px-2 py-1 rounded">{item.class}</code>
                    <span className="text-xs text-muted-foreground">{item.size}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Border Radius</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { class: "rounded-sm", name: "sm", size: "2px" },
                  { class: "rounded-md", name: "md", size: "6px" },
                  { class: "rounded-lg", name: "lg", size: "10px" },
                  { class: "rounded-full", name: "full", size: "9999px" },
                ].map((item) => (
                  <div key={item.class} className="text-center">
                    <div className={`h-16 bg-destructive ${item.class} mb-2`}></div>
                    <code className="text-xs bg-muted px-2 py-1 rounded">{item.class}</code>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </section>

        {/* Back to Home */}
        <div className="text-center pt-8 border-t border-border">
          <Link href="/">
            <Button variant="outline" className="gap-2 bg-transparent">
              <ArrowLeft className="w-4 h-4" />
              {language === "nl" ? "Terug naar startpagina" : "Back to Home"}
            </Button>
          </Link>
        </div>
      </div>
    </main>
  )
}
