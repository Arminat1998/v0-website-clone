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
import { ArtiestCard } from "@/components/artiest-card"
import { PhotoVideoCard } from "@/components/photo-video-card"
import { ReplacementCard } from "@/components/account/replacement-card"
import { ComboSelect, comboGroups } from "@/components/combo-select"
import { GENRE_GROUPS, ALLROUND } from "@/lib/profile-options"
import type { Artist, Photographer } from "@/lib/smart-search"
import type { ReplacementSuggestion } from "@/lib/bookings/replacement"

const noop = () => {}

const sampleArtist: Artist = {
  id: 901,
  name: "DJ Marco",
  specialty: "DJ",
  location: "Amsterdam",
  rating: 4.8,
  reviews: 32,
  price: "€150",
  equipmentPrice: "€250",
  available: true,
  musicStyles: ["house", "techno", "trance"],
  eventTypes: ["Wedding", "Corporate", "Birthday"],
  category: "dj",
  artistTypes: ["dj"],
  minHours: 1,
  maxHours: 8,
  kind: "artist",
}

const samplePhotographer: Photographer = {
  id: 903,
  name: "Studio Light",
  specialty: "Photographer",
  location: "Rotterdam",
  rating: 4.9,
  reviews: 18,
  price: "€200",
  available: true,
  eventTypes: ["Wedding", "Corporate"],
  serviceTypes: ["photography"],
  category: "photographer",
  minHours: 1,
  maxHours: 8,
}

const sampleReplacement: ReplacementSuggestion = {
  id: "ds-sample",
  type: "artist",
  name: sampleArtist.name,
  specialty: "DJ",
  location: sampleArtist.location,
  hourlyRateCents: 15000,
  rating: 4.8,
  reviews: 32,
  image: null,
  match: 86,
  reasons: ["type", "genres", "city"],
  sharedGenres: ["house", "techno"],
  rateDiffPercent: -10,
  href: "#",
  profileHref: null,
  profile: sampleArtist,
}

export default function DesignSystemContent() {
  const { language } = useLanguage()
  const { theme, toggleTheme } = useTheme()
  const [hydrated, setHydrated] = useState(false)
  const [genres, setGenres] = useState<string[]>([ALLROUND, "house"])
  const [mainGenre, setMainGenre] = useState("")
  const genreOptions = [
    { label: language === "nl" ? "Algemeen" : "General", options: [{ value: ALLROUND, label: "Allround" }] },
    ...comboGroups(GENRE_GROUPS, language === "nl"),
  ]

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

            <Card className="p-6 md:col-span-2">
              <h3 className="text-lg font-semibold text-foreground mb-1">ComboSelect</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {language === "nl"
                  ? "Dropdown met zoeken en groepen. Hier met de genrelijst, Allround bovenaan voor DJs."
                  : "Dropdown with search and groups. Shown with the genre list, Allround at the top for DJs."}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p id="ds-genres-label" className="mb-2 text-sm font-medium text-foreground">
                    {language === "nl" ? "Muziekgenres (meerkeuze)" : "Music genres (multiple)"}
                  </p>
                  <ComboSelect
                    multiple
                    id="ds-genres"
                    labelledBy="ds-genres-label"
                    nl={language === "nl"}
                    value={genres}
                    onChange={setGenres}
                    groups={genreOptions}
                    placeholder={language === "nl" ? "Kies genres" : "Choose genres"}
                    searchPlaceholder={language === "nl" ? "Zoek een genre" : "Search a genre"}
                  />
                </div>
                <div>
                  <p id="ds-genre-label" className="mb-2 text-sm font-medium text-foreground">
                    {language === "nl" ? "Hoofdgenre (enkele keuze)" : "Main genre (single)"}
                  </p>
                  <ComboSelect
                    id="ds-genre"
                    labelledBy="ds-genre-label"
                    nl={language === "nl"}
                    value={mainGenre}
                    onChange={setMainGenre}
                    groups={genreOptions.slice(1)}
                    placeholder={language === "nl" ? "Kies een genre" : "Choose a genre"}
                    searchPlaceholder={language === "nl" ? "Zoek een genre" : "Search a genre"}
                  />
                </div>
              </div>
            </Card>

            <Card className="p-6 md:col-span-2">
              <h3 className="text-lg font-semibold text-foreground mb-1">
                {language === "nl" ? "Formuliervalidatie" : "Form validation"}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {language === "nl"
                  ? "Een foutmelding staat direct onder het veld (role=\"alert\") en het veld krijgt een rode rand (invalid)."
                  : "An error message sits right under the field (role=\"alert\") and the field gets a red border (invalid)."}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="ds-email" className="mb-2 block">E-mail</Label>
                  <Input
                    id="ds-email"
                    defaultValue="geen-geldig-adres"
                    aria-invalid="true"
                    aria-describedby="ds-email-error"
                    className="border-[var(--rf-red-text)]"
                  />
                  <p id="ds-email-error" role="alert" className="mt-1.5 text-sm text-[var(--rf-red-text)]">
                    {language === "nl" ? "Vul een geldig e-mailadres in." : "Enter a valid email address."}
                  </p>
                </div>
                <div>
                  <p id="ds-genres-invalid-label" className="mb-2 text-sm font-medium text-foreground">
                    {language === "nl" ? "Muziekgenres" : "Music genres"}
                  </p>
                  <ComboSelect
                    multiple
                    id="ds-genres-invalid"
                    labelledBy="ds-genres-invalid-label"
                    describedBy="ds-genres-error"
                    nl={language === "nl"}
                    value={[]}
                    onChange={noop}
                    groups={genreOptions}
                    invalid
                    placeholder={language === "nl" ? "Kies genres" : "Choose genres"}
                    searchPlaceholder={language === "nl" ? "Zoek een genre" : "Search a genre"}
                  />
                  <p id="ds-genres-error" role="alert" className="mt-1.5 text-sm text-[var(--rf-red-text)]">
                    {language === "nl" ? "Kies minstens één genre, of Allround." : "Choose at least one genre, or Allround."}
                  </p>
                </div>
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
                  <Badge className="bg-primary text-primary-foreground font-semibold">Allround</Badge>
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

        {/* Cards: the real production components with sample data */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            {language === "nl" ? "Kaart Voorbeelden" : "Card Examples"}
          </h2>
          <p className="text-muted-foreground mb-8">
            {language === "nl"
              ? "De echte kaartcomponenten met voorbeelddata, zoals ze verschijnen in de overzichten en in de zijbalk."
              : "The real card components with sample data, as they appear in the overviews and the side column."}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-1">ArtiestCard</h3>
              <code className="text-xs bg-muted px-2 py-1 rounded mb-3 inline-block">{"<ArtiestCard artist onClick />"}</code>
              <ArtiestCard artist={sampleArtist} onClick={noop} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-1">ArtiestCard compact</h3>
              <code className="text-xs bg-muted px-2 py-1 rounded mb-3 inline-block">{"<ArtiestCard compact />"}</code>
              <ArtiestCard artist={sampleArtist} onClick={noop} compact />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-1">
                {language === "nl" ? "Allround + bezocht" : "Allround + visited"}
              </h3>
              <code className="text-xs bg-muted px-2 py-1 rounded mb-3 inline-block">{"artist.allround · isVisited"}</code>
              <ArtiestCard artist={{ ...sampleArtist, id: 902, name: "DJ Nova", allround: true, equipmentPrice: undefined }} onClick={noop} isVisited />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-1">PhotoVideoCard</h3>
              <code className="text-xs bg-muted px-2 py-1 rounded mb-3 inline-block">{"<PhotoVideoCard professional />"}</code>
              <PhotoVideoCard professional={samplePhotographer} onClick={noop} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-1">ReplacementCard</h3>
              <code className="text-xs bg-muted px-2 py-1 rounded mb-3 inline-block">{"<ReplacementCard item nl badge onView />"}</code>
              <ReplacementCard
                item={sampleReplacement}
                nl={language === "nl"}
                badge={
                  <Badge variant="secondary" className="shadow-lg bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                    {language === "nl" ? "Sterke match" : "Strong match"}
                  </Badge>
                }
                onView={noop}
              />
            </div>
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
