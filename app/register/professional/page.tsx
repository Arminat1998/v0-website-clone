"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Music, Plus, X, Camera, Speaker, Mic, Lightbulb, Piano, Guitar, ChevronDown, Check, Moon, Sun } from "lucide-react"
import { DualRangeSlider } from "@/components/dual-range-slider"
import { LanguageSwitcher } from "@/components/language-switcher"
import { useLanguage } from "@/contexts/language-context"
import { useTheme } from "@/contexts/theme-context"
import { useState, useRef, useEffect } from "react" // Imported useEffect
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"

interface PackageEquipmentItem {
  id: string
  name: string
  price: string
  description: string
  image?: string
}

interface ExtraEquipmentItem {
  id: string
  name: string
  price: string
  description: string
  image?: string
}

interface SocialMediaLink {
  id: string
  platform: string
  url: string
}

interface EquipmentConfig {
  id: string
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  placeholder: string
}

export default function ProfessionalRegistrationPage() {
  const router = useRouter()
  const [minHours, setMinHours] = useState(1)
  const [maxHours, setMaxHours] = useState(8)
  const [artistType, setArtistType] = useState<string>("")
  const [bannerImage, setBannerImage] = useState<string>("")
  const [profileImage, setProfileImage] = useState<string>("")

  const { t, language } = useLanguage()
  const { theme, toggleTheme } = useTheme()
  const L = language === "nl"

  const [fullName, setFullName] = useState<string>("")
  const [email, setEmail] = useState<string>("")
  const [phone, setPhone] = useState<string>("")

  const [companyName, setCompanyName] = useState<string>("")
  const [kvkNumber, setKvkNumber] = useState<string>("")
  const [vatNumber, setVatNumber] = useState<string>("")
  const [kvkError, setKvkError] = useState<string>("")

  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([])

  const [socialMediaLinks, setSocialMediaLinks] = useState<SocialMediaLink[]>([])
  const [currentSocialMedia, setCurrentSocialMedia] = useState({ platform: "", url: "" })

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const signupData = sessionStorage.getItem("professionalSignupData")
    if (signupData) {
      try {
        const data = JSON.parse(signupData)
        console.log("[v0] Loading signup data:", data)

        // Pre-fill form fields
        if (data.fullName) setFullName(data.fullName)
        if (data.email) setEmail(data.email)
        if (data.phone) setPhone(data.phone)
        if (data.category) {
          // Map category to artist type
          const categoryMap: Record<string, string> = {
            artist: "DJ", // Default to DJ for artist category
            "photo-video": "",
            venue: "",
            catering: "",
          }
          const mappedArtistType = categoryMap[data.category] || ""
          if (mappedArtistType) setArtistType(mappedArtistType)
        }

        // Clear sessionStorage after using the data
        sessionStorage.removeItem("professionalSignupData")
      } catch (error) {
        console.error("[v0] Error parsing signup data:", error)
      }
    }
  }, [])

  const bannerInputRef = useRef<HTMLInputElement>(null)
  const profileInputRef = useRef<HTMLInputElement>(null)

  const [minimumEquipment, setMinimumEquipment] = useState<Record<string, PackageEquipmentItem>>({})
  const [currentEquipmentIndex, setCurrentEquipmentIndex] = useState(0)

  const [extraEquipment, setExtraEquipment] = useState<ExtraEquipmentItem[]>([])
  const [currentExtraEquipment, setCurrentExtraEquipment] = useState<ExtraEquipmentItem>({
    id: "",
    name: "",
    price: "",
    description: "",
  })
  const [currentExtraEquipmentImage, setCurrentExtraEquipmentImage] = useState<string>("")
  const extraFileInputRef = useRef<HTMLInputElement>(null)

  const handleNumberKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Prevent minus (-), plus (+), and 'e' (scientific notation)
    if (e.key === "-" || e.key === "+" || e.key === "e" || e.key === "E") {
      e.preventDefault()
    }
  }

  const getMinimumEquipmentConfig = (): EquipmentConfig[] => {
    const configs: Record<string, EquipmentConfig[]> = {
      DJ: [
        {
          id: "dj-controller",
          name: L ? "DJ-controller" : "DJ Controller",
          description: L
            ? "Professionele DJ-controller (Pioneer XDJ-RX2 of hoger) met DJ-tafel"
            : "Professional DJ controller (Pioneer XDJ-RX2 or higher) with DJ table",
          icon: Music,
          placeholder: L ? "bijv. Pioneer CDJ-3000 + Mixer" : "e.g. Pioneer CDJ-3000 + Mixer",
        },
        {
          id: "sound-system",
          name: L ? "Geluidssysteem op statieven" : "Sound System on Stands",
          description: L ? "Minimaal 2 speakers voor 300+ personen" : "At least 2 speakers for 300+ people",
          icon: Speaker,
          placeholder: L ? "bijv. 2x JBL PRX815W speakers" : "e.g. 2x JBL PRX815W Speakers",
        },
        {
          id: "microphone",
          name: L ? "Professionele microfoon" : "Professional Microphone",
          description: L ? "Hoogwaardige microfoon voor aankondigingen" : "High-quality microphone for announcements",
          icon: Mic,
          placeholder: L ? "bijv. Shure SM58 draadloos" : "e.g. Shure SM58 Wireless",
        },
        {
          id: "lighting",
          name: L ? "Volledige lichtset" : "Full Lighting Setup",
          description: L ? "Minimaal één party light bar" : "Minimum one party light bar",
          icon: Lightbulb,
          placeholder: L ? "bijv. Chauvet DJ 4BAR Flex T" : "e.g. Chauvet DJ 4BAR Flex T",
        },
      ],
      Saxophonist: [
        {
          id: "saxophone",
          name: L ? "Professionele saxofoon" : "Professional Saxophone",
          description: L ? "Alt- of tenorsaxofoon" : "Alto or Tenor saxophone",
          icon: Music,
          placeholder: L ? "bijv. Yamaha altsaxofoon YAS-62" : "e.g. Yamaha Alto Saxophone YAS-62",
        },
        {
          id: "wireless-mic",
          name: L ? "Draadloos microfoonsysteem" : "Wireless Microphone System",
          description: L ? "Voor versterking van de saxofoon" : "For saxophone amplification",
          icon: Mic,
          placeholder: L ? "bijv. Shure BLX14/CVL draadloos" : "e.g. Shure BLX14/CVL Wireless",
        },
        {
          id: "pa-system",
          name: L ? "Draagbaar PA-systeem" : "Portable PA System",
          description: L ? "Met statieven voor versterking" : "With stands for amplification",
          icon: Speaker,
          placeholder: L ? "bijv. Bose S1 Pro-systeem" : "e.g. Bose S1 Pro System",
        },
        {
          id: "music-stand",
          name: L ? "Muziekstandaard & bladmuziek" : "Music Stand & Sheet Music",
          description: L ? "Professionele muziekstandaard met collectie" : "Professional music stand with collection",
          icon: Music,
          placeholder: L ? "bijv. Manhasset muziekstandaard" : "e.g. Manhasset Music Stand",
        },
      ],
      Band: [
        {
          id: "pa-system",
          name: L ? "Volledig PA-systeem" : "Full PA System",
          description: L ? "Met mengpaneel" : "With mixing console",
          icon: Speaker,
          placeholder: L ? "bijv. Yamaha Stagepas 1K-systeem" : "e.g. Yamaha Stagepas 1K System",
        },
        {
          id: "microphones",
          name: L ? "Meerdere microfoons" : "Multiple Microphones",
          description: L ? "Zang- en instrumentmicrofoons" : "Vocal and instrument microphones",
          icon: Mic,
          placeholder: L ? "bijv. 4x Shure SM58 + 2x SM57" : "e.g. 4x Shure SM58 + 2x SM57",
        },
        {
          id: "amplifiers",
          name: L ? "Instrumentversterkers" : "Instrument Amplifiers",
          description: L ? "Voor gitaren en bas" : "For guitars and bass",
          icon: Music,
          placeholder: L ? "bijv. Fender Hot Rod Deluxe" : "e.g. Fender Hot Rod Deluxe",
        },
        {
          id: "monitors",
          name: L ? "Monitorsysteem" : "Monitor System",
          description: L ? "Voor bandleden" : "For band members",
          icon: Speaker,
          placeholder: L ? "bijv. 4x QSC K10.2 monitors" : "e.g. 4x QSC K10.2 Monitors",
        },
      ],
      Singer: [
        {
          id: "vocal-mic",
          name: L ? "Professionele zangmicrofoon" : "Professional Vocal Microphone",
          description: L ? "Hoogwaardige zangmicrofoon" : "High-quality vocal microphone",
          icon: Mic,
          placeholder: L ? "bijv. Shure SM58 of Beta 58A" : "e.g. Shure SM58 or Beta 58A",
        },
        {
          id: "wireless-system",
          name: L ? "Draadloos microfoonsysteem" : "Wireless Microphone System",
          description: L ? "Voor bewegingsvrijheid" : "For freedom of movement",
          icon: Mic,
          placeholder: L ? "bijv. Sennheiser EW 135 G4" : "e.g. Sennheiser EW 135 G4",
        },
        {
          id: "monitors",
          name: L ? "In-ear of podiummonitors" : "In-ear or Stage Monitors",
          description: L ? "Voor het monitoren van je optreden" : "For monitoring performance",
          icon: Speaker,
          placeholder: L ? "bijv. Shure SE215 in-ears" : "e.g. Shure SE215 In-Ears",
        },
        {
          id: "pa-system",
          name: L ? "Draagbaar PA-systeem" : "Portable PA System",
          description: L ? "Voor versterking" : "For amplification",
          icon: Speaker,
          placeholder: L ? "bijv. Bose L1 Pro32" : "e.g. Bose L1 Pro32",
        },
      ],
      Pianist: [
        {
          id: "piano",
          name: L ? "Digitale piano of keyboard" : "Digital Piano or Keyboard",
          description: L ? "88 toetsen, gewogen aanslag" : "88 keys, weighted action",
          icon: Piano,
          placeholder: L ? "bijv. Yamaha P-125 digitale piano" : "e.g. Yamaha P-125 Digital Piano",
        },
        {
          id: "bench",
          name: L ? "Pianokruk" : "Piano Bench",
          description: L ? "Verstelbare pianokruk" : "Adjustable piano bench",
          icon: Music,
          placeholder: L ? "bijv. verstelbare pianokruk" : "e.g. Adjustable Piano Bench",
        },
        {
          id: "amplifier",
          name: L ? "Keyboardversterker" : "Keyboard Amplifier",
          description: L ? "Of PA-systeem voor versterking" : "Or PA system for amplification",
          icon: Speaker,
          placeholder: L ? "bijv. Roland KC-550 versterker" : "e.g. Roland KC-550 Amp",
        },
        {
          id: "music-stand",
          name: L ? "Muziekstandaard" : "Music Stand",
          description: L ? "Voor bladmuziek" : "For sheet music",
          icon: Music,
          placeholder: L ? "bijv. Manhasset muziekstandaard" : "e.g. Manhasset Music Stand",
        },
      ],
      Guitarist: [
        {
          id: "guitar",
          name: L ? "Professionele gitaar" : "Professional Guitar",
          description: L ? "Akoestische of elektrische gitaar" : "Acoustic or electric guitar",
          icon: Guitar,
          placeholder: L ? "bijv. Fender Stratocaster" : "e.g. Fender Stratocaster",
        },
        {
          id: "amplifier",
          name: L ? "Gitaarversterker" : "Guitar Amplifier",
          description: L ? "Professionele versterker" : "Professional amplifier",
          icon: Speaker,
          placeholder: L ? "bijv. Fender Hot Rod Deluxe" : "e.g. Fender Hot Rod Deluxe",
        },
        {
          id: "effects",
          name: L ? "Effectpedalen & pedalboard" : "Effects Pedals & Pedalboard",
          description: L ? "Complete effectenset" : "Complete effects setup",
          icon: Music,
          placeholder: L ? "bijv. Boss multi-effects GT-1000" : "e.g. Boss Multi-Effects GT-1000",
        },
        {
          id: "wireless",
          name: L ? "Draadloos systeem" : "Wireless System",
          description: L ? "Voor bewegingsvrijheid" : "For freedom of movement",
          icon: Music,
          placeholder: L ? "bijv. Line 6 Relay G10S" : "e.g. Line 6 Relay G10S",
        },
      ],
      Violinist: [
        {
          id: "violin",
          name: L ? "Professionele viool" : "Professional Violin",
          description: L ? "Hoogwaardige viool" : "High-quality violin",
          icon: Music,
          placeholder: L ? "bijv. professionele viool" : "e.g. Professional Violin",
        },
        {
          id: "bow",
          name: L ? "Strijkstok en hars" : "Bow and Rosin",
          description: L ? "Professionele strijkstok met hars" : "Professional bow with rosin",
          icon: Music,
          placeholder: L ? "bijv. carbonvezel strijkstok" : "e.g. Carbon Fiber Bow",
        },
        {
          id: "pickup",
          name: L ? "Pickup-/microfoonsysteem" : "Pickup/Microphone System",
          description: L ? "Voor versterking" : "For amplification",
          icon: Mic,
          placeholder: L ? "bijv. Fishman V-200 pickup" : "e.g. Fishman V-200 Pickup",
        },
        {
          id: "amplifier",
          name: L ? "Draagbare versterker" : "Portable Amplifier",
          description: L ? "Voor vioolversterking" : "For violin amplification",
          icon: Speaker,
          placeholder: L ? "bijv. Roland Cube Street EX" : "e.g. Roland Cube Street EX",
        },
      ],
    }
    return configs[artistType] || configs.DJ
  }

  const isEquipmentComplete = (equipmentId: string): boolean => {
    const equipment = minimumEquipment[equipmentId]
    return !!(equipment && equipment.name && equipment.price && equipment.description && equipment.image)
  }

  const canAddNextEquipment = (index: number): boolean => {
    if (index === 0) return true
    const config = getMinimumEquipmentConfig()
    const previousEquipmentId = config[index - 1]?.id
    return isEquipmentComplete(previousEquipmentId)
  }

  const updateEquipmentItem = (equipmentId: string, field: keyof PackageEquipmentItem, value: string) => {
    setMinimumEquipment((prev) => ({
      ...prev,
      [equipmentId]: {
        ...prev[equipmentId],
        id: equipmentId,
        [field]: value,
      } as PackageEquipmentItem,
    }))
  }

  const handleEquipmentFileChange = (equipmentId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        updateEquipmentItem(equipmentId, "image", reader.result as string)
      }
      reader.readAsDataURL(file)
      console.log("[v0] Equipment file selected:", file.name)
    }
  }

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setBannerImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfileImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handlePackageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // setPackageEquipmentImage(file.name) // This line was removed as it's not used anymore
      console.log("[v0] Package equipment file selected:", file.name)
    }
  }

  const handleExtraFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setCurrentExtraEquipmentImage(reader.result as string)
      }
      reader.readAsDataURL(file)
      console.log("[v0] Extra equipment file selected:", file.name)
    }
  }

  const addPackageEquipment = () => {
    // This function is no longer used due to the new progressive disclosure for minimum equipment.
    // It might be removed or repurposed if needed for a different functionality.
    console.warn("addPackageEquipment called, but this function is deprecated in the new version.")
  }

  const removePackageEquipment = (id: string) => {
    // This function is no longer used due to the new progressive disclosure for minimum equipment.
    // It might be removed or repurposed if needed for a different functionality.
    console.warn("removePackageEquipment called, but this function is deprecated in the new version.")
  }

  const addExtraEquipment = () => {
    if (currentExtraEquipment.name && currentExtraEquipment.price) {
      const newItem = { ...currentExtraEquipment, id: Date.now().toString(), image: currentExtraEquipmentImage }
      setExtraEquipment([...extraEquipment, newItem])
      setCurrentExtraEquipment({ id: "", name: "", price: "", description: "" })
      setCurrentExtraEquipmentImage("")
      if (extraFileInputRef.current) {
        extraFileInputRef.current.value = ""
      }
    } else {
      alert(
        L
          ? "Vul de apparatuurnaam en huurprijs in voordat je toevoegt"
          : "Please fill in Equipment Name and Rental Price before adding",
      )
    }
  }

  const removeExtraEquipment = (id: string) => {
    setExtraEquipment(extraEquipment.filter((item) => item.id !== id))
  }

  const addSocialMedia = () => {
    if (currentSocialMedia.platform && currentSocialMedia.url) {
      const url = currentSocialMedia.url.toLowerCase()
      let isValid = false
      let errorMessage = ""

      switch (currentSocialMedia.platform) {
        case "instagram":
          isValid = url.includes("instagram.com")
          errorMessage = L
            ? "Voer een geldige Instagram-URL in (bijv. https://instagram.com/gebruikersnaam)"
            : "Please enter a valid Instagram URL (e.g., https://instagram.com/username)"
          break
        case "facebook":
          isValid = url.includes("facebook.com") || url.includes("fb.com")
          errorMessage = L
            ? "Voer een geldige Facebook-URL in (bijv. https://facebook.com/gebruikersnaam)"
            : "Please enter a valid Facebook URL (e.g., https://facebook.com/username)"
          break
        case "twitter":
          isValid = url.includes("twitter.com") || url.includes("x.com")
          errorMessage = L
            ? "Voer een geldige Twitter/X-URL in (bijv. https://twitter.com/gebruikersnaam of https://x.com/gebruikersnaam)"
            : "Please enter a valid Twitter/X URL (e.g., https://twitter.com/username or https://x.com/username)"
          break
        case "tiktok":
          isValid = url.includes("tiktok.com")
          errorMessage = L
            ? "Voer een geldige TikTok-URL in (bijv. https://tiktok.com/@gebruikersnaam)"
            : "Please enter a valid TikTok URL (e.g., https://tiktok.com/@username)"
          break
        case "youtube":
          isValid = url.includes("youtube.com") || url.includes("youtu.be")
          errorMessage = L
            ? "Voer een geldige YouTube-URL in (bijv. https://youtube.com/channel/... of https://youtube.com/@gebruikersnaam)"
            : "Please enter a valid YouTube URL (e.g., https://youtube.com/channel/... or https://youtube.com/@username)"
          break
        case "spotify":
          isValid = url.includes("spotify.com")
          errorMessage = L
            ? "Voer een geldige Spotify-URL in (bijv. https://open.spotify.com/artist/...)"
            : "Please enter a valid Spotify URL (e.g., https://open.spotify.com/artist/...)"
          break
        case "soundcloud":
          isValid = url.includes("soundcloud.com")
          errorMessage = L
            ? "Voer een geldige SoundCloud-URL in (bijv. https://soundcloud.com/gebruikersnaam)"
            : "Please enter a valid SoundCloud URL (e.g., https://soundcloud.com/username)"
          break
        case "bandcamp":
          isValid = url.includes("bandcamp.com")
          errorMessage = L
            ? "Voer een geldige Bandcamp-URL in (bijv. https://gebruikersnaam.bandcamp.com)"
            : "Please enter a valid Bandcamp URL (e.g., https://username.bandcamp.com)"
          break
        case "applemusic":
          isValid = url.includes("music.apple.com")
          errorMessage = L
            ? "Voer een geldige Apple Music-URL in (bijv. https://music.apple.com/artist/...)"
            : "Please enter a valid Apple Music URL (e.g., https://music.apple.com/artist/...)"
          break
        case "linkedin":
          isValid = url.includes("linkedin.com")
          errorMessage = L
            ? "Voer een geldige LinkedIn-URL in (bijv. https://linkedin.com/in/gebruikersnaam)"
            : "Please enter a valid LinkedIn URL (e.g., https://linkedin.com/in/username)"
          break
        default:
          isValid = true
      }

      if (!isValid) {
        alert(errorMessage)
        return
      }
      // </CHANGE>

      const newLink: SocialMediaLink = {
        id: Date.now().toString(),
        platform: currentSocialMedia.platform,
        url: currentSocialMedia.url,
      }
      setSocialMediaLinks([...socialMediaLinks, newLink])
      setCurrentSocialMedia({ platform: "", url: "" })
    } else {
      alert(
        L
          ? "Selecteer een platform en voer een URL in voordat je toevoegt"
          : "Please select a platform and enter a URL before adding",
      )
    }
  }

  const removeSocialMedia = (id: string) => {
    setSocialMediaLinks(socialMediaLinks.filter((link) => link.id !== id))
  }

  const getPlatformName = (platform: string): string => {
    const platformNames: Record<string, string> = {
      instagram: "Instagram",
      facebook: "Facebook",
      twitter: "Twitter",
      tiktok: "TikTok",
      youtube: "YouTube",
      spotify: "Spotify",
      soundcloud: "SoundCloud",
      bandcamp: "Bandcamp",
      applemusic: "Apple Music",
      linkedin: "LinkedIn",
    }
    return platformNames[platform] || platform
    // </CHANGE>
  }

  const getMinimumEquipmentRequirements = () => {
    const requirements: Record<string, string[]> = {
      DJ: L
        ? [
            "Professionele DJ-controller (Pioneer XDJ-RX2 of hoger) met DJ-tafel",
            "Geluidssysteem op statieven (minimaal 2 speakers voor 300+ personen)",
            "Professionele microfoon",
            "Volledige lichtset (minimaal één party light bar)",
          ]
        : [
            "Professional DJ controller (Pioneer XDJ-RX2 or higher) with DJ table",
            "Sound system on stands (at least 2 speakers for 300+ people)",
            "Professional microphone",
            "Full lighting setup (minimum one party light bar)",
          ],
      Saxophonist: L
        ? [
            "Professionele saxofoon (alt of tenor)",
            "Draadloos microfoonsysteem",
            "Draagbaar PA-systeem met statieven",
            "Muziekstandaard en bladmuziekcollectie",
          ]
        : [
            "Professional saxophone (Alto or Tenor)",
            "Wireless microphone system",
            "Portable PA system with stands",
            "Music stand and sheet music collection",
          ],
      Band: L
        ? [
            "Volledig PA-systeem met mengpaneel",
            "Meerdere microfoons (zang en instrument)",
            "Instrumentversterkers",
            "Monitorsysteem voor bandleden",
          ]
        : [
            "Full PA system with mixing console",
            "Multiple microphones (vocal and instrument)",
            "Instrument amplifiers",
            "Monitor system for band members",
          ],
      Singer: L
        ? [
            "Professionele zangmicrofoon",
            "Draadloos microfoonsysteem",
            "In-ear monitors of podiummonitors",
            "Draagbaar PA-systeem",
          ]
        : [
            "Professional vocal microphone",
            "Wireless microphone system",
            "In-ear monitors or stage monitors",
            "Portable PA system",
          ],
      Pianist: L
        ? ["Digitale piano of keyboard (88 toetsen)", "Pianokruk", "Keyboardversterker of PA-systeem", "Muziekstandaard"]
        : ["Digital piano or keyboard (88 keys)", "Piano bench", "Keyboard amplifier or PA system", "Music stand"],
      Guitarist: L
        ? [
            "Professionele gitaar (akoestisch of elektrisch)",
            "Gitaarversterker",
            "Effectpedalen en pedalboard",
            "Draadloos systeem",
          ]
        : [
            "Professional guitar (acoustic or electric)",
            "Guitar amplifier",
            "Effects pedals and pedalboard",
            "Wireless system",
          ],
      Violinist: L
        ? ["Professionele viool", "Strijkstok en hars", "Pickup-/microfoonsysteem", "Draagbare versterker"]
        : ["Professional violin", "Bow and rosin", "Pickup/microphone system", "Portable amplifier"],
    }
    return requirements[artistType] || requirements.DJ
  }

  const getPackageDescription = () => {
    const descriptions: Record<string, string> = L
      ? {
          DJ: "Voeg je DJ-apparatuurpakket toe voor verhuur voor een hele dag. Inclusief alle essentiële apparatuur zoals controllers, speakers, verlichting en microfoons. Dit wordt getoond als één compleet pakket met een totaalprijs.",
          Saxophonist:
            "Voeg je saxofoon-optredenpakket toe inclusief je instrument, geluidssysteem en accessoires. Alle items worden gegroepeerd in één pakket met een totaalprijs.",
          Band: "Voeg het complete apparatuurpakket van je band toe inclusief PA-systeem, instrumenten en alle benodigde apparatuur voor een volledig optreden. Alle items worden gegroepeerd in één pakket.",
          Singer:
            "Voeg je zang-optredenpakket toe inclusief microfoons, monitors en geluidsapparatuur. Alle items worden gegroepeerd in één pakket met een totaalprijs.",
          Pianist:
            "Voeg je piano-optredenpakket toe inclusief keyboard/piano, versterking en accessoires. Alle items worden gegroepeerd in één pakket met een totaalprijs.",
          Guitarist:
            "Voeg je gitaar-optredenpakket toe inclusief instrument, versterker, effecten en accessoires. Alle items worden gegroepeerd in één pakket met een totaalprijs.",
          Violinist:
            "Voeg je viool-optredenpakket toe inclusief instrument, versterkingssysteem en accessoires. Alle items worden gegroepeerd in één pakket met een totaalprijs.",
        }
      : {
          DJ: "Add your DJ equipment package for full-day rental. Include all essential gear like controllers, speakers, lighting, and microphones. This will be shown as one complete package with a total price.",
          Saxophonist:
            "Add your saxophone performance package including your instrument, sound system, and accessories. All items will be grouped into one package with a total price.",
          Band: "Add your band's complete equipment package including PA system, instruments, and all necessary gear for a full performance. All items will be grouped into one package.",
          Singer:
            "Add your vocal performance package including microphones, monitors, and sound equipment. All items will be grouped into one package with a total price.",
          Pianist:
            "Add your piano performance package including keyboard/piano, amplification, and accessories. All items will be grouped into one package with a total price.",
          Guitarist:
            "Add your guitar performance package including instrument, amplifier, effects, and accessories. All items will be grouped into one package with a total price.",
          Violinist:
            "Add your violin performance package including instrument, amplification system, and accessories. All items will be grouped into one package with a total price.",
        }
    return (
      descriptions[artistType] ||
      (L
        ? "Voeg de apparatuur toe die je aanbiedt voor verhuur voor een hele dag, inclusief een naam, prijs en afbeelding. Alle items worden gegroepeerd in één pakket met een totaalprijs die in je profiel wordt getoond onder de sectie 'Pakket'."
        : "Add the equipment you offer for full-day rental, including a name, price, and image. All items will be grouped into one package with a total price shown in your profile under the 'Package' section.")
    )
  }

  const handleKvkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 8)
    setKvkNumber(digitsOnly)
    if (digitsOnly.length === 0) {
      setKvkError(L ? "KVK-nummer is verplicht" : "Chamber of Commerce (KVK) number is required")
    } else if (digitsOnly.length !== 8) {
      setKvkError(L ? "KVK-nummer moet uit 8 cijfers bestaan" : "KVK number must be 8 digits")
    } else {
      setKvkError("")
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!/^\d{8}$/.test(kvkNumber)) {
      setKvkError(
        kvkNumber.length === 0
          ? L
            ? "KVK-nummer is verplicht"
            : "Chamber of Commerce (KVK) number is required"
          : L
            ? "KVK-nummer moet uit 8 cijfers bestaan"
            : "KVK number must be 8 digits",
      )
      return
    }

    console.log("[v0] Professional registration submitted")
    router.push("/dashboard")
  }

  const inputClassName =
    "h-12 w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-950 dark:bg-gray-950 px-4 py-3 text-base text-gray-900 dark:text-white focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
  const textareaClassName =
    "w-full resize-none rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-950 dark:bg-gray-950 px-4 py-3 text-base text-gray-900 dark:text-white focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"

  const getGenreOptions = (): { value: string; label: string }[] => {
    const genresByArtist: Record<string, { value: string; label: string }[]> = {
      DJ: [
        { value: "house", label: "House" },
        { value: "techno", label: "Techno" },
        { value: "hiphop", label: "Hip Hop" },
        { value: "rnb", label: "R&B" },
        { value: "edm", label: "EDM" },
        { value: "trance", label: "Trance" },
        { value: "dubstep", label: "Dubstep" },
        { value: "disco", label: "Disco" },
      ],
      Saxophonist: [
        { value: "jazz", label: "Jazz" },
        { value: "blues", label: "Blues" },
        { value: "soul", label: "Soul" },
        { value: "funk", label: "Funk" },
        { value: "classical", label: L ? "Klassiek" : "Classical" },
        { value: "contemporary", label: L ? "Hedendaags" : "Contemporary" },
      ],
      Band: [
        { value: "rock", label: "Rock" },
        { value: "pop", label: "Pop" },
        { value: "indie", label: "Indie" },
        { value: "alternative", label: L ? "Alternatief" : "Alternative" },
        { value: "metal", label: "Metal" },
        { value: "punk", label: "Punk" },
        { value: "folk", label: "Folk" },
      ],
      Singer: [
        { value: "pop", label: "Pop" },
        { value: "rnb", label: "R&B" },
        { value: "soul", label: "Soul" },
        { value: "jazz", label: "Jazz" },
        { value: "opera", label: "Opera" },
        { value: "musical", label: L ? "Musical" : "Musical Theatre" },
        { value: "country", label: "Country" },
      ],
      Pianist: [
        { value: "classical", label: L ? "Klassiek" : "Classical" },
        { value: "jazz", label: "Jazz" },
        { value: "contemporary", label: L ? "Hedendaags" : "Contemporary" },
        { value: "pop", label: "Pop" },
        { value: "blues", label: "Blues" },
        { value: "ragtime", label: "Ragtime" },
      ],
      Guitarist: [
        { value: "rock", label: "Rock" },
        { value: "blues", label: "Blues" },
        { value: "jazz", label: "Jazz" },
        { value: "classical", label: L ? "Klassiek" : "Classical" },
        { value: "flamenco", label: "Flamenco" },
        { value: "folk", label: "Folk" },
        { value: "metal", label: "Metal" },
      ],
      Violinist: [
        { value: "classical", label: L ? "Klassiek" : "Classical" },
        { value: "folk", label: "Folk" },
        { value: "jazz", label: "Jazz" },
        { value: "contemporary", label: L ? "Hedendaags" : "Contemporary" },
        { value: "bluegrass", label: "Bluegrass" },
        { value: "celtic", label: "Celtic" },
      ],
    }
    return genresByArtist[artistType] || []
  }

  const getEventTypeOptions = (): { value: string; label: string }[] => {
    const eventTypesByArtist: Record<string, { value: string; label: string }[]> = {
      DJ: [
        { value: "wedding", label: "Wedding" },
        { value: "corporate", label: "Corporate Event" },
        { value: "birthday", label: "Birthday Party" },
        { value: "festival", label: "Festival" },
        { value: "club", label: "Club Night" },
        { value: "private", label: "Private Party" },
      ],
      Saxophonist: [
        { value: "wedding", label: "Wedding" },
        { value: "corporate", label: "Corporate Event" },
        { value: "cocktail", label: "Cocktail Party" },
        { value: "dinner", label: "Dinner Event" },
        { value: "jazz-club", label: "Jazz Club" },
      ],
      Band: [
        { value: "wedding", label: "Wedding" },
        { value: "corporate", label: "Corporate Event" },
        { value: "festival", label: "Festival" },
        { value: "concert", label: "Concert" },
        { value: "private", label: "Private Party" },
        { value: "pub", label: "Pub/Bar" },
      ],
      Singer: [
        { value: "wedding", label: "Wedding" },
        { value: "corporate", label: "Corporate Event" },
        { value: "birthday", label: "Birthday Party" },
        { value: "concert", label: "Concert" },
        { value: "theater", label: "Theater" },
        { value: "church", label: "Church Event" },
      ],
      Pianist: [
        { value: "wedding", label: "Wedding" },
        { value: "corporate", label: "Corporate Event" },
        { value: "cocktail", label: "Cocktail Party" },
        { value: "dinner", label: "Dinner Event" },
        { value: "concert", label: "Concert" },
        { value: "recital", label: "Recital" },
      ],
      Guitarist: [
        { value: "wedding", label: "Wedding" },
        { value: "corporate", label: "Corporate Event" },
        { value: "restaurant", label: "Restaurant" },
        { value: "private", label: "Private Party" },
        { value: "concert", label: "Concert" },
        { value: "street", label: "Street Performance" },
      ],
      Violinist: [
        { value: "wedding", label: "Wedding" },
        { value: "corporate", label: "Corporate Event" },
        { value: "cocktail", label: "Cocktail Party" },
        { value: "concert", label: "Concert" },
        { value: "recital", label: "Recital" },
        { value: "church", label: "Church Event" },
      ],
    }
    return eventTypesByArtist[artistType] || []
  }

  const addGenre = (genre: string) => {
    if (!selectedGenres.includes(genre)) {
      setSelectedGenres([...selectedGenres, genre])
    }
  }

  const removeGenre = (genre: string) => {
    setSelectedGenres(selectedGenres.filter((g) => g !== genre))
  }

  const addEventType = (eventType: string) => {
    if (!selectedEventTypes.includes(eventType)) {
      setSelectedEventTypes([...selectedEventTypes, eventType])
    }
  }

  const removeEventType = (eventType: string) => {
    setSelectedEventTypes(selectedEventTypes.filter((e) => e !== eventType))
  }

  const handleArtistTypeChange = (value: string) => {
    setArtistType(value)
    setSelectedGenres([])
    setSelectedEventTypes([])
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card px-4 sm:px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <Link href="/">
            <Image
              src={mounted && theme === "dark" ? "/arsi-logo-dark.png" : "/arsi-logo.png"}
              alt="ARSI Events Logo"
              width={120}
              height={60}
              className={`h-10 sm:h-12 w-auto cursor-pointer ${mounted && theme === "dark" ? "scale-[3.3] sm:scale-[3.2] translate-x-[2.2rem] sm:translate-x-[3.35rem] translate-y-[0.2rem] sm:translate-y-[0.3rem]" : ""}`}
            />
          </Link>

          <div className="flex items-center gap-1 sm:gap-4">
            <LanguageSwitcher />

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="text-foreground hover:bg-accent h-8 w-8 sm:h-10 sm:w-10"
              title={!mounted || theme === "light" ? t.darkMode : t.lightMode}
            >
              {!mounted || theme === "light" ? (
                <Moon className="h-4 w-4 sm:h-5 sm:w-5" />
              ) : (
                <Sun className="h-4 w-4 sm:h-5 sm:w-5" />
              )}
            </Button>
          </div>
        </div>
      </header>

      <div className="bg-card p-4 sm:p-6 md:p-10">
        <div className="mx-auto max-w-4xl space-y-6 sm:space-y-8">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-red-600 flex-shrink-0">
              <Music className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-red-600">
                {L ? "Registreer als Professional" : "Register as Professional"}
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                {L
                  ? "Vul het onderstaande formulier in om boekingsaanvragen te ontvangen"
                  : "Fill out the form below to start receiving booking requests"}
              </p>
            </div>
          </div>

          <div className="relative">
            {/* Banner */}
            <div
              className="relative w-full rounded-lg border-2 border-dashed border-border overflow-hidden cursor-pointer group"
              style={{ aspectRatio: "1.91 / 1" }}
              onClick={() => bannerInputRef.current?.click()}
            >
              <input
                ref={bannerInputRef}
                type="file"
                accept="image/*"
                onChange={handleBannerChange}
                className="hidden"
              />
              {bannerImage ? (
                <Image src={bannerImage || "/placeholder.svg"} alt="Banner" fill className="object-cover" />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center p-4 bg-muted group-hover:bg-accent transition-colors">
                  <Camera className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400 mb-2" />
                  <p className="text-sm sm:text-base text-gray-600 text-center font-medium">
                    {L ? "Klik om banner toe te voegen" : "Click to add banner"}
                  </p>
                  <p className="text-xs sm:text-sm text-red-600 mt-1">Max. 15MB</p>
                </div>
              )}

              {/* Add Banner Photo Button - Top Right */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  bannerInputRef.current?.click()
                }}
                className="absolute top-2 right-2 sm:top-4 sm:right-4 text-muted-foreground hover:text-foreground bg-card/90 hover:bg-card text-xs sm:text-sm z-10 shadow-sm"
              >
                <Camera className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">{L ? "Bannerfoto toevoegen" : "Add Banner Photo"}</span>
                <span className="sm:hidden">Banner</span>
              </Button>
            </div>

            {/* Profile Photo - Overlapping banner */}
            <div className="absolute -bottom-12 sm:-bottom-16 left-4 sm:left-8 z-10">
              <div className="relative">
                <div
                  className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-muted border-4 border-card shadow-lg overflow-hidden group cursor-pointer"
                  onClick={() => profileInputRef.current?.click()}
                >
                  <input
                    ref={profileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleProfileChange}
                    className="hidden"
                  />
                  <div className="flex h-full w-full flex-col items-center justify-center group-hover:bg-accent transition-colors">
                    {profileImage ? (
                      <Image
                        src={profileImage || "/placeholder.svg"}
                        alt="Profile"
                        fill
                        className="object-cover rounded-full"
                      />
                    ) : (
                      <>
                        <Camera className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
                        <p className="text-[10px] sm:text-xs text-gray-500 mt-1">Upload</p>
                        <p className="text-[9px] sm:text-xs text-red-600">Max. 15MB</p>
                      </>
                    )}
                  </div>
                </div>
                <div
                  onClick={(e) => {
                    e.stopPropagation()
                    profileInputRef.current?.click()
                  }}
                  className="absolute bottom-0 right-0 h-7 w-7 sm:h-9 sm:w-9 rounded-full bg-foreground hover:bg-muted-foreground flex items-center justify-center z-30 cursor-pointer transition-colors shadow-lg border-2 border-card"
                >
                  <Camera className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
                </div>
              </div>
            </div>
          </div>

          <div className="h-12 sm:h-16"></div>

          {/* Form Wrapper */}
          <div className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
                {/* Stage Name */}
                <div className="space-y-2">
                  <Label htmlFor="stageName" className="text-sm sm:text-base font-medium text-gray-900">
                    {L ? "Artiestennaam" : "Stage Name"}
                  </Label>
                  <Input
                    id="stageName"
                    placeholder={L ? "DJ Voorbeeld" : "DJ Example"}
                    className={inputClassName}
                    required
                  />
                </div>

                {/* Full Name */}
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-sm sm:text-base font-medium text-gray-900">
                    {L ? "Volledige naam" : "Full Name"}
                  </Label>
                  <Input
                    id="fullName"
                    placeholder={L ? "Tekst" : "Text"}
                    className={inputClassName}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm sm:text-base font-medium text-gray-900">
                    {L ? "E-mail" : "Email"}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    className={inputClassName}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm sm:text-base font-medium text-gray-900">
                    {L ? "Telefoonnummer" : "Phone number"}
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    className={inputClassName}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>

                {/* Company Name */}
                <div className="space-y-2">
                  <Label htmlFor="companyName" className="text-sm sm:text-base font-medium text-gray-900">
                    {L ? "Bedrijfsnaam / Handelsnaam" : "Company Name / Trade Name"}
                  </Label>
                  <Input
                    id="companyName"
                    placeholder={L ? "Bedrijfsnaam" : "Company name"}
                    className={inputClassName}
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>

                {/* KVK Number */}
                <div className="space-y-2">
                  <Label htmlFor="kvkNumber" className="text-sm sm:text-base font-medium text-gray-900">
                    {L ? "KVK-nummer" : "Chamber of Commerce (KVK) number"}
                  </Label>
                  <Input
                    id="kvkNumber"
                    inputMode="numeric"
                    placeholder="12345678"
                    className={inputClassName}
                    value={kvkNumber}
                    onChange={handleKvkChange}
                    onKeyDown={handleNumberKeyDown}
                    maxLength={8}
                    aria-invalid={!!kvkError}
                    aria-describedby="kvkNumber-error"
                    required
                  />
                  {kvkError && (
                    <p id="kvkNumber-error" className="text-sm text-red-500">
                      {kvkError}
                    </p>
                  )}
                </div>

                {/* VAT Number */}
                <div className="space-y-2">
                  <Label htmlFor="vatNumber" className="text-sm sm:text-base font-medium text-gray-900">
                    {L ? "BTW-identificatienummer" : "VAT identification number"}{" "}
                    <span className="text-gray-400">{L ? "(optioneel)" : "(optional)"}</span>
                  </Label>
                  <Input
                    id="vatNumber"
                    placeholder="NL123456789B01"
                    className={inputClassName}
                    value={vatNumber}
                    onChange={(e) => setVatNumber(e.target.value)}
                  />
                </div>
              </div>

              {/* Bio - Full width */}
              <div className="space-y-2">
                <Label htmlFor="bio" className="text-sm sm:text-base font-medium text-gray-900">
                  Bio
                </Label>
                <Textarea
                  id="bio"
                  placeholder={
                    L
                      ? "Vertel ons over jezelf, je stijl en je DJ-carrière..."
                      : "Tell us about yourself, your style, and your DJ journey..."
                  }
                  rows={5}
                  className={textareaClassName}
                  required
                />
              </div>

              <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
                {/* Years of Experience */}
                <div className="space-y-2">
                  <Label htmlFor="experience" className="text-sm sm:text-base font-medium text-gray-900">
                    {L ? "Jaren ervaring" : "Years of Experience"}
                  </Label>
                  <Input
                    id="experience"
                    type="number"
                    min="0"
                    defaultValue="0"
                    className={inputClassName}
                    onKeyDown={handleNumberKeyDown}
                    required
                  />
                </div>

                {/* Fee per hour */}
                <div className="space-y-2">
                  <Label htmlFor="fee" className="text-sm sm:text-base font-medium text-gray-900">
                    {L ? "Tarief (€ per uur)" : "Fee (€ per hour)"}
                  </Label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">€</span>
                    <Input
                      id="fee"
                      type="number"
                      min="0"
                      step="0.01"
                      defaultValue="0"
                      className="h-12 w-full rounded-md border border-gray-300 dark:border-gray-600 !dark:bg-gray-950 dark:!bg-slate-800 text-gray-900 dark:text-white py-3 pl-8 pr-4 text-base focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                      onKeyDown={handleNumberKeyDown}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Minimum and Maximum Booking Hours */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900">
                    {L ? "Stel je boekingsuren bereik in" : "Set Your Booking Hours Range"}
                  </h3>
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs font-bold flex-shrink-0">
                      ↔
                    </span>
                    {L
                      ? "Sleep de handvatten op de schuifbalk hieronder om je minimum en maximum boekingsuren in te stellen"
                      : "Drag the handles on the slider below to set your minimum and maximum booking hours"}
                  </p>
                </div>

                {/* Booking Hours Slider */}
                <div className="py-4 px-2 bg-blue-50 rounded-lg border-2 border-blue-200">
                  <DualRangeSlider
                    min={1}
                    max={8}
                    minValue={minHours}
                    maxValue={maxHours}
                    onMinChange={setMinHours}
                    onMaxChange={setMaxHours}
                  />
                </div>

                {/* Input fields below slider with new styling */}
                <div className="grid gap-4 sm:gap-6 grid-cols-2 md:grid-cols-2">
                  {/* Minimum Booking Hours */}
                  <div className="space-y-2">
                    <Label htmlFor="minHours" className="text-sm sm:text-base font-medium text-gray-900">
                      {L ? "Minimum boekingsuren" : "Minimum Booking Hours"}
                    </Label>
                    <div className="h-12 w-full rounded-md dark:bg-gray-950 border-2 border-gray-300 dark:border-gray-600 px-4 py-3 text-base font-bold text-gray-900 dark:text-white flex items-center justify-center cursor-default">
                      {minHours}
                    </div>
                  </div>

                  {/* Maximum Booking Hours */}
                  <div className="space-y-2">
                    <Label htmlFor="maxHours" className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">
                      {L ? "Maximum boekingsuren" : "Maximum Booking Hours"}
                    </Label>
                    <div className="h-12 w-full rounded-md dark:bg-gray-950 border-2 border-gray-300 dark:border-gray-600 px-4 py-3 text-base font-bold text-gray-900 dark:text-white flex items-center justify-center cursor-default">
                      {maxHours}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
                {/* City */}
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-sm sm:text-base font-medium text-gray-900">
                    {L ? "Stad" : "City"}
                  </Label>
                  <Input id="city" placeholder="Amsterdam" className={inputClassName} required />
                </div>

                {/* Range (km) */}
                <div className="space-y-2">
                  <Label htmlFor="range" className="text-sm sm:text-base font-medium text-gray-900">
                    {L ? "Bereik (km)" : "Range (km)"}
                  </Label>
                  <Input
                    id="range"
                    type="number"
                    min="0"
                    defaultValue="100"
                    className={inputClassName}
                    onKeyDown={handleNumberKeyDown}
                    required
                  />
                </div>
              </div>

              {/* Artist Type selector */}
              <div className="space-y-2">
                <Label htmlFor="artistType" className="text-sm sm:text-base font-medium text-gray-900">
                  {L ? "Artiest type" : "Artist Type"}
                </Label>
                <Select value={artistType} onValueChange={handleArtistTypeChange}>
                  <SelectTrigger className="h-12 w-full rounded-md border border-gray-300 dark:border-gray-600 !dark:bg-gray-950 dark:!bg-slate-800 text-gray-900 dark:text-white px-4 py-3 text-base">
                    <SelectValue placeholder={L ? "Selecteer je artiest type" : "Select your artist type"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DJ">DJ</SelectItem>
                    <SelectItem value="Saxophonist">Saxophonist</SelectItem>
                    <SelectItem value="Band">Band</SelectItem>
                    <SelectItem value="Singer">Singer</SelectItem>
                    <SelectItem value="Pianist">Pianist</SelectItem>
                    <SelectItem value="Guitarist">Guitarist</SelectItem>
                    <SelectItem value="Violinist">Violinist</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs sm:text-sm text-gray-500">
                  {L
                    ? "Dit helpt klanten je te vinden op basis van het type optreden dat je aanbiedt"
                    : "This helps clients find you based on the type of performance you offer"}
                </p>
              </div>

              {artistType && (
                <div className="space-y-2">
                  <Label className="text-sm sm:text-base font-medium text-foreground">
                    {L ? "Muziekgenres" : "Music Genres"}
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="h-12 w-full justify-between rounded-md border border-gray-300 dark:border-gray-600 !dark:bg-gray-950 dark:!bg-slate-800 text-gray-900 dark:text-white px-4 py-3 text-base font-normal hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        {selectedGenres.length > 0
                          ? `${selectedGenres.length} ${L ? "genre(s) geselecteerd" : "genre(s) selected"}`
                          : L
                            ? "Selecteer genres"
                            : "Select genres"}
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-2 dark:bg-gray-950 border border-gray-300 dark:border-gray-600">
                      {getGenreOptions().map((genre) => (
                        <div
                          key={genre.value}
                          className="flex items-center space-x-2 rounded-md px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                          onClick={() => {
                            setSelectedGenres((prev) =>
                              prev.includes(genre.value)
                                ? prev.filter((g) => g !== genre.value)
                                : [...prev, genre.value],
                            )
                          }}
                        >
                          <Checkbox checked={selectedGenres.includes(genre.value)} />
                          <span className="text-sm text-gray-900 dark:text-white">{genre.label}</span>
                        </div>
                      ))}
                    </PopoverContent>
                  </Popover>
                  {selectedGenres.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedGenres.map((g) => (
                        <span
                          key={g}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-full text-xs"
                        >
                          {g}
                          <button type="button" onClick={() => setSelectedGenres((prev) => prev.filter((x) => x !== g))}>
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Event Types */}
              {artistType && (
                <div className="space-y-2">
                  <Label className="text-sm sm:text-base font-medium text-foreground">
                    {L ? "Evenement types" : "Event Types"}
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="h-12 w-full justify-between rounded-md border border-gray-300 dark:border-gray-600 !dark:bg-gray-950 dark:!bg-slate-800 text-gray-900 dark:text-white px-4 py-3 text-base font-normal hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        {selectedEventTypes.length > 0
                          ? `${selectedEventTypes.length} ${L ? "type(s) geselecteerd" : "type(s) selected"}`
                          : L
                            ? "Selecteer evenement types"
                            : "Select event types"}
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-2 dark:bg-gray-950 border border-gray-300 dark:border-gray-600">
                      {(L
                        ? ["Verjaardag", "Bruiloft", "Zakelijk", "Festival", "Clubavond", "Jubileum", "Privéfeest"]
                        : ["Birthday", "Wedding", "Corporate", "Festival", "Club Night", "Anniversary", "Private Party"]
                      ).map(
                        (type) => (
                          <div
                            key={type}
                            className="flex items-center space-x-2 rounded-md px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                            onClick={() => {
                              setSelectedEventTypes((prev) =>
                                prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
                              )
                            }}
                          >
                            <Checkbox checked={selectedEventTypes.includes(type)} />
                            <span className="text-sm text-gray-900 dark:text-white">{type}</span>
                          </div>
                        ),
                      )}
                    </PopoverContent>
                  </Popover>
                  {selectedEventTypes.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedEventTypes.map((t) => (
                        <span
                          key={t}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-full text-xs"
                        >
                          {t}
                          <button
                            type="button"
                            onClick={() => setSelectedEventTypes((prev) => prev.filter((x) => x !== t))}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Package Equipment Section */}
              {artistType && (
                <div className="rounded-lg p-4 sm:p-6 space-y-4 bg-gray-100 dark:!bg-gray-950">
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                    {L ? "Pakket apparatuur verhuur" : "Package Equipment Rental"}
                  </h2>
                  <p className="text-sm sm:text-base leading-relaxed text-muted-foreground">{getPackageDescription()}</p>

                  <div className="space-y-3">
                    <h3 className="text-sm sm:text-base font-semibold text-foreground">
                      {L ? "Minimale apparatuur vereist om te registreren:" : "Minimum equipment required to register:"}
                    </h3>
                    <ul className="list-disc space-y-1.5 pl-5 text-sm sm:text-base leading-relaxed text-muted-foreground">
                      {getMinimumEquipmentRequirements().map((req, index) => (
                        <li key={index}>{req}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-4">
                    {getMinimumEquipmentConfig().map((config, index) => {
                      const isAccessible = canAddNextEquipment(index)
                      const isComplete = isEquipmentComplete(config.id)
                      const equipment = minimumEquipment[config.id]
                      const IconComponent = config.icon

                      return (
                        <div
                          key={config.id}
                          className={`rounded-lg border p-3 sm:p-4 ${
                            isComplete
                              ? "border-green-500 dark:border-green-600 bg-green-50 dark:!bg-gray-900"
                              : isAccessible
                                ? "border-gray-300 dark:border-gray-600 bg-white dark:!bg-gray-900"
                                : "border-gray-200 dark:border-zinc-800 bg-gray-100 dark:!bg-gray-800 opacity-60"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-3">
                            <div
                              className={`flex h-8 w-8 items-center justify-center rounded-full ${isComplete ? "bg-green-500" : "bg-gray-300 dark:bg-gray-700"}`}
                            >
                              {isComplete ? (
                                <Check className="h-4 w-4 text-white" />
                              ) : (
                                <IconComponent className="h-4 w-4 text-gray-700 dark:text-white" />
                              )}
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold text-foreground">{config.name}</h4>
                              <p className="text-xs text-muted-foreground">{config.description}</p>
                            </div>
                          </div>

                          {isAccessible && (
                            <div className="space-y-3">
                              <Input
                                placeholder={config.placeholder}
                                value={equipment?.name || ""}
                                onChange={(e) => updateEquipmentItem(config.id, "name", e.target.value)}
                                className="h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 !dark:bg-gray-950 dark:!bg-slate-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                                disabled={!isAccessible}
                              />
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <Input
                                  placeholder={L ? "Huurprijs (bijv. €150/dag)" : "Rental price (e.g. €150/day)"}
                                  value={equipment?.price || ""}
                                  onChange={(e) => updateEquipmentItem(config.id, "price", e.target.value)}
                                  className="h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 !dark:bg-gray-950 dark:!bg-slate-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                                  disabled={!isAccessible}
                                />
                                <Input
                                  placeholder={L ? "Korte beschrijving" : "Short description"}
                                  value={equipment?.description || ""}
                                  onChange={(e) => updateEquipmentItem(config.id, "description", e.target.value)}
                                  className="h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 !dark:bg-gray-950 dark:!bg-slate-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                                  disabled={!isAccessible}
                                />
                              </div>
                              <div>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleEquipmentFileChange(config.id, e)}
                                  className="hidden"
                                  id={`equipment-file-${config.id}`}
                                  disabled={!isAccessible}
                                />
                                <label
                                  htmlFor={`equipment-file-${config.id}`}
                                  className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 !dark:bg-gray-950 dark:!bg-slate-800 text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${!isAccessible ? "opacity-50 cursor-not-allowed" : ""}`}
                                >
                                  <Camera className="h-4 w-4" />
                                  {equipment?.image
                                    ? L
                                      ? "Foto toegevoegd"
                                      : "Photo added"
                                    : L
                                      ? "Apparatuurfoto toevoegen"
                                      : "Add equipment photo"}
                                </label>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Extra Equipment Section */}
              {artistType && (
                <div className="rounded-lg p-4 sm:p-6 space-y-4 bg-gray-100 dark:!bg-gray-950">
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                    {L ? "Extra apparatuur (optioneel)" : "Extra Equipment (Optional)"}
                  </h2>
                  <p className="text-sm sm:text-base leading-relaxed text-muted-foreground">
                    {L
                      ? "Voeg extra apparatuur toe die je aanbiedt als optionele extra's voor klanten."
                      : "Add any additional equipment you offer as optional extras for clients."}
                  </p>

                  {extraEquipment.length > 0 && (
                    <div className="space-y-3">
                      {extraEquipment.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-950 p-3 sm:p-4"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex gap-3">
                              {item.image && (
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className="h-12 w-12 rounded object-cover flex-shrink-0"
                                />
                              )}
                              <div>
                                <p className="font-semibold text-sm text-foreground">{item.name}</p>
                                <p className="text-xs text-muted-foreground">{item.description}</p>
                                <p className="text-xs font-medium text-red-600 dark:text-red-400 mt-1">{item.price}</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeExtraEquipment(item.id)}
                              className="text-gray-400 hover:text-red-500 transition-colors ml-2 flex-shrink-0"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="space-y-4 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-950 p-4 sm:p-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input
                        placeholder={L ? "Apparatuur naam" : "Equipment name"}
                        value={currentExtraEquipment.name}
                        onChange={(e) => setCurrentExtraEquipment({ ...currentExtraEquipment, name: e.target.value })}
                        className="h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 !dark:bg-gray-950 dark:!bg-slate-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                      />
                      <Input
                        placeholder={L ? "Huurprijs (bijv. €50/dag)" : "Rental price (e.g. €50/day)"}
                        value={currentExtraEquipment.price}
                        onChange={(e) => setCurrentExtraEquipment({ ...currentExtraEquipment, price: e.target.value })}
                        className="h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 !dark:bg-gray-950 dark:!bg-slate-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                      />
                    </div>
                    <Textarea
                      placeholder={L ? "Korte beschrijving van de apparatuur" : "Short description of the equipment"}
                      value={currentExtraEquipment.description}
                      onChange={(e) =>
                        setCurrentExtraEquipment({ ...currentExtraEquipment, description: e.target.value })
                      }
                      rows={2}
                      className="w-full resize-none rounded-md border border-gray-300 dark:border-gray-600 !dark:bg-gray-950 dark:!bg-slate-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                    />
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleExtraFileChange}
                          className="hidden"
                          id="extra-equipment-file"
                          ref={extraFileInputRef}
                        />
                        <label
                          htmlFor="extra-equipment-file"
                          className="flex items-center gap-2 px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 !dark:bg-gray-950 dark:!bg-slate-800 text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 w-full sm:w-auto"
                        >
                          <Camera className="h-4 w-4" />
                          {currentExtraEquipmentImage
                            ? L
                              ? "Foto toegevoegd"
                              : "Photo added"
                            : L
                              ? "Foto toevoegen"
                              : "Add photo"}
                        </label>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addExtraEquipment}
                        className="h-10 border-gray-300 dark:border-gray-600 dark:bg-gray-950 dark:bg-gray-700 text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-600 w-full sm:w-auto"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        {L ? "Apparatuur toevoegen" : "Add Equipment"}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Social Media Links */}
              <div className="space-y-4">
                <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                  {L ? "Social media & links" : "Social Media & Links"}
                </h2>

                {socialMediaLinks.length > 0 && (
                  <div className="space-y-3">
                    {socialMediaLinks.map((link) => (
                      <div
                        key={link.id}
                        className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 p-3 sm:p-4"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-sm text-foreground">{getPlatformName(link.platform)}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-xs">{link.url}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeSocialMedia(link.id)}
                            className="text-gray-400 hover:text-red-500 transition-colors ml-2 flex-shrink-0"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-3">
                  <Select
                    value={currentSocialMedia.platform}
                    onValueChange={(value) => setCurrentSocialMedia({ ...currentSocialMedia, platform: value })}
                  >
                    <SelectTrigger className="h-12 w-full rounded-md border border-gray-300 dark:border-gray-600 !dark:bg-gray-950 dark:!bg-slate-800 text-gray-900 dark:text-white px-4 py-3 text-base">
                      <SelectValue placeholder={L ? "Selecteer platform" : "Select platform"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="facebook">Facebook</SelectItem>
                      <SelectItem value="twitter">Twitter / X</SelectItem>
                      <SelectItem value="tiktok">TikTok</SelectItem>
                      <SelectItem value="youtube">YouTube</SelectItem>
                      <SelectItem value="spotify">Spotify</SelectItem>
                      <SelectItem value="soundcloud">SoundCloud</SelectItem>
                      <SelectItem value="bandcamp">Bandcamp</SelectItem>
                      <SelectItem value="applemusic">Apple Music</SelectItem>
                      <SelectItem value="linkedin">LinkedIn</SelectItem>
                    </SelectContent>
                  </Select>

                  <Input
                    type="url"
                    placeholder={L ? "Plak je link hier..." : "Paste your link here..."}
                    className={inputClassName}
                    value={currentSocialMedia.url}
                    onChange={(e) => setCurrentSocialMedia({ ...currentSocialMedia, url: e.target.value })}
                  />
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addSocialMedia}
                  className="h-9 border-gray-300 dark:border-gray-600 dark:bg-gray-950 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 w-full sm:w-auto"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {L ? "Social media toevoegen" : "Add social media"}
                </Button>
              </div>

              {/* Register Button */}
              <Button
                type="submit"
                className="h-12 w-full bg-red-700 text-base font-semibold text-white hover:bg-red-600"
              >
                {L ? "Registreren" : "Register"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
