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

  const { t } = useLanguage()
  const { theme, toggleTheme } = useTheme()

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
          name: "DJ Controller",
          description: "Professional DJ controller (Pioneer XDJ-RX2 or higher) with DJ table",
          icon: Music,
          placeholder: "e.g. Pioneer CDJ-3000 + Mixer",
        },
        {
          id: "sound-system",
          name: "Sound System on Stands",
          description: "At least 2 speakers for 300+ people",
          icon: Speaker,
          placeholder: "e.g. 2x JBL PRX815W Speakers",
        },
        {
          id: "microphone",
          name: "Professional Microphone",
          description: "High-quality microphone for announcements",
          icon: Mic,
          placeholder: "e.g. Shure SM58 Wireless",
        },
        {
          id: "lighting",
          name: "Full Lighting Setup",
          description: "Minimum one party light bar",
          icon: Lightbulb,
          placeholder: "e.g. Chauvet DJ 4BAR Flex T",
        },
      ],
      Saxophonist: [
        {
          id: "saxophone",
          name: "Professional Saxophone",
          description: "Alto or Tenor saxophone",
          icon: Music,
          placeholder: "e.g. Yamaha Alto Saxophone YAS-62",
        },
        {
          id: "wireless-mic",
          name: "Wireless Microphone System",
          description: "For saxophone amplification",
          icon: Mic,
          placeholder: "e.g. Shure BLX14/CVL Wireless",
        },
        {
          id: "pa-system",
          name: "Portable PA System",
          description: "With stands for amplification",
          icon: Speaker,
          placeholder: "e.g. Bose S1 Pro System",
        },
        {
          id: "music-stand",
          name: "Music Stand & Sheet Music",
          description: "Professional music stand with collection",
          icon: Music,
          placeholder: "e.g. Manhasset Music Stand",
        },
      ],
      Band: [
        {
          id: "pa-system",
          name: "Full PA System",
          description: "With mixing console",
          icon: Speaker,
          placeholder: "e.g. Yamaha Stagepas 1K System",
        },
        {
          id: "microphones",
          name: "Multiple Microphones",
          description: "Vocal and instrument microphones",
          icon: Mic,
          placeholder: "e.g. 4x Shure SM58 + 2x SM57",
        },
        {
          id: "amplifiers",
          name: "Instrument Amplifiers",
          description: "For guitars and bass",
          icon: Music,
          placeholder: "e.g. Fender Hot Rod Deluxe",
        },
        {
          id: "monitors",
          name: "Monitor System",
          description: "For band members",
          icon: Speaker,
          placeholder: "e.g. 4x QSC K10.2 Monitors",
        },
      ],
      Singer: [
        {
          id: "vocal-mic",
          name: "Professional Vocal Microphone",
          description: "High-quality vocal microphone",
          icon: Mic,
          placeholder: "e.g. Shure SM58 or Beta 58A",
        },
        {
          id: "wireless-system",
          name: "Wireless Microphone System",
          description: "For freedom of movement",
          icon: Mic,
          placeholder: "e.g. Sennheiser EW 135 G4",
        },
        {
          id: "monitors",
          name: "In-ear or Stage Monitors",
          description: "For monitoring performance",
          icon: Speaker,
          placeholder: "e.g. Shure SE215 In-Ears",
        },
        {
          id: "pa-system",
          name: "Portable PA System",
          description: "For amplification",
          icon: Speaker,
          placeholder: "e.g. Bose L1 Pro32",
        },
      ],
      Pianist: [
        {
          id: "piano",
          name: "Digital Piano or Keyboard",
          description: "88 keys, weighted action",
          icon: Piano,
          placeholder: "e.g. Yamaha P-125 Digital Piano",
        },
        {
          id: "bench",
          name: "Piano Bench",
          description: "Adjustable piano bench",
          icon: Music,
          placeholder: "e.g. Adjustable Piano Bench",
        },
        {
          id: "amplifier",
          name: "Keyboard Amplifier",
          description: "Or PA system for amplification",
          icon: Speaker,
          placeholder: "e.g. Roland KC-550 Amp",
        },
        {
          id: "music-stand",
          name: "Music Stand",
          description: "For sheet music",
          icon: Music,
          placeholder: "e.g. Manhasset Music Stand",
        },
      ],
      Guitarist: [
        {
          id: "guitar",
          name: "Professional Guitar",
          description: "Acoustic or electric guitar",
          icon: Guitar,
          placeholder: "e.g. Fender Stratocaster",
        },
        {
          id: "amplifier",
          name: "Guitar Amplifier",
          description: "Professional amplifier",
          icon: Speaker,
          placeholder: "e.g. Fender Hot Rod Deluxe",
        },
        {
          id: "effects",
          name: "Effects Pedals & Pedalboard",
          description: "Complete effects setup",
          icon: Music,
          placeholder: "e.g. Boss Multi-Effects GT-1000",
        },
        {
          id: "wireless",
          name: "Wireless System",
          description: "For freedom of movement",
          icon: Music,
          placeholder: "e.g. Line 6 Relay G10S",
        },
      ],
      Violinist: [
        {
          id: "violin",
          name: "Professional Violin",
          description: "High-quality violin",
          icon: Music,
          placeholder: "e.g. Professional Violin",
        },
        {
          id: "bow",
          name: "Bow and Rosin",
          description: "Professional bow with rosin",
          icon: Music,
          placeholder: "e.g. Carbon Fiber Bow",
        },
        {
          id: "pickup",
          name: "Pickup/Microphone System",
          description: "For amplification",
          icon: Mic,
          placeholder: "e.g. Fishman V-200 Pickup",
        },
        {
          id: "amplifier",
          name: "Portable Amplifier",
          description: "For violin amplification",
          icon: Speaker,
          placeholder: "e.g. Roland Cube Street EX",
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
      alert("Please fill in Equipment Name and Rental Price before adding")
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
          errorMessage = "Please enter a valid Instagram URL (e.g., https://instagram.com/username)"
          break
        case "facebook":
          isValid = url.includes("facebook.com") || url.includes("fb.com")
          errorMessage = "Please enter a valid Facebook URL (e.g., https://facebook.com/username)"
          break
        case "twitter":
          isValid = url.includes("twitter.com") || url.includes("x.com")
          errorMessage =
            "Please enter a valid Twitter/X URL (e.g., https://twitter.com/username or https://x.com/username)"
          break
        case "tiktok":
          isValid = url.includes("tiktok.com")
          errorMessage = "Please enter a valid TikTok URL (e.g., https://tiktok.com/@username)"
          break
        case "youtube":
          isValid = url.includes("youtube.com") || url.includes("youtu.be")
          errorMessage =
            "Please enter a valid YouTube URL (e.g., https://youtube.com/channel/... or https://youtube.com/@username)"
          break
        case "spotify":
          isValid = url.includes("spotify.com")
          errorMessage = "Please enter a valid Spotify URL (e.g., https://open.spotify.com/artist/...)"
          break
        case "soundcloud":
          isValid = url.includes("soundcloud.com")
          errorMessage = "Please enter a valid SoundCloud URL (e.g., https://soundcloud.com/username)"
          break
        case "bandcamp":
          isValid = url.includes("bandcamp.com")
          errorMessage = "Please enter a valid Bandcamp URL (e.g., https://username.bandcamp.com)"
          break
        case "applemusic":
          isValid = url.includes("music.apple.com")
          errorMessage = "Please enter a valid Apple Music URL (e.g., https://music.apple.com/artist/...)"
          break
        case "linkedin":
          isValid = url.includes("linkedin.com")
          errorMessage = "Please enter a valid LinkedIn URL (e.g., https://linkedin.com/in/username)"
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
      alert("Please select a platform and enter a URL before adding")
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
      DJ: [
        "Professional DJ controller (Pioneer XDJ-RX2 or higher) with DJ table",
        "Sound system on stands (at least 2 speakers for 300+ people)",
        "Professional microphone",
        "Full lighting setup (minimum one party light bar)",
      ],
      Saxophonist: [
        "Professional saxophone (Alto or Tenor)",
        "Wireless microphone system",
        "Portable PA system with stands",
        "Music stand and sheet music collection",
      ],
      Band: [
        "Full PA system with mixing console",
        "Multiple microphones (vocal and instrument)",
        "Instrument amplifiers",
        "Monitor system for band members",
      ],
      Singer: [
        "Professional vocal microphone",
        "Wireless microphone system",
        "In-ear monitors or stage monitors",
        "Portable PA system",
      ],
      Pianist: ["Digital piano or keyboard (88 keys)", "Piano bench", "Keyboard amplifier or PA system", "Music stand"],
      Guitarist: [
        "Professional guitar (acoustic or electric)",
        "Guitar amplifier",
        "Effects pedals and pedalboard",
        "Wireless system",
      ],
      Violinist: ["Professional violin", "Bow and rosin", "Pickup/microphone system", "Portable amplifier"],
    }
    return requirements[artistType] || requirements.DJ
  }

  const getPackageDescription = () => {
    const descriptions: Record<string, string> = {
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
      "Add the equipment you offer for full-day rental, including a name, price, and image. All items will be grouped into one package with a total price shown in your profile under the 'Package' section."
    )
  }

  const handleKvkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 8)
    setKvkNumber(digitsOnly)
    if (digitsOnly.length === 0) {
      setKvkError("KVK-nummer is verplicht")
    } else if (digitsOnly.length !== 8) {
      setKvkError("KVK-nummer moet uit 8 cijfers bestaan")
    } else {
      setKvkError("")
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!/^\d{8}$/.test(kvkNumber)) {
      setKvkError(kvkNumber.length === 0 ? "KVK-nummer is verplicht" : "KVK-nummer moet uit 8 cijfers bestaan")
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
        { value: "classical", label: "Classical" },
        { value: "contemporary", label: "Contemporary" },
      ],
      Band: [
        { value: "rock", label: "Rock" },
        { value: "pop", label: "Pop" },
        { value: "indie", label: "Indie" },
        { value: "alternative", label: "Alternative" },
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
        { value: "musical", label: "Musical Theatre" },
        { value: "country", label: "Country" },
      ],
      Pianist: [
        { value: "classical", label: "Classical" },
        { value: "jazz", label: "Jazz" },
        { value: "contemporary", label: "Contemporary" },
        { value: "pop", label: "Pop" },
        { value: "blues", label: "Blues" },
        { value: "ragtime", label: "Ragtime" },
      ],
      Guitarist: [
        { value: "rock", label: "Rock" },
        { value: "blues", label: "Blues" },
        { value: "jazz", label: "Jazz" },
        { value: "classical", label: "Classical" },
        { value: "flamenco", label: "Flamenco" },
        { value: "folk", label: "Folk" },
        { value: "metal", label: "Metal" },
      ],
      Violinist: [
        { value: "classical", label: "Classical" },
        { value: "folk", label: "Folk" },
        { value: "jazz", label: "Jazz" },
        { value: "contemporary", label: "Contemporary" },
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
              src={theme === "dark" ? "/arsi-logo-dark.png" : "/arsi-logo.png"}
              alt="ARSI Events Logo"
              width={120}
              height={60}
              className={`h-10 sm:h-12 w-auto cursor-pointer ${theme === "dark" ? "scale-[3.3] sm:scale-[3.2] translate-x-[2.2rem] sm:translate-x-[3.35rem] translate-y-[0.2rem] sm:translate-y-[0.3rem]" : ""}`}
            />
          </Link>

          <div className="flex items-center gap-1 sm:gap-4">
            <LanguageSwitcher />

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="text-foreground hover:bg-accent h-8 w-8 sm:h-10 sm:w-10"
              title={theme === "light" ? t.darkMode : t.lightMode}
            >
              {theme === "light" ? (
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
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-red-600">Register as Professional</h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Fill out the form below to start receiving booking requests
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
                    Klik om banner toe te voegen
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
                <span className="hidden sm:inline">Add Banner Photo</span>
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
                    Stage Name
                  </Label>
                  <Input id="stageName" placeholder="DJ Example" className={inputClassName} required />
                </div>

                {/* Full Name */}
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-sm sm:text-base font-medium text-gray-900">
                    Full Name
                  </Label>
                  <Input
                    id="fullName"
                    placeholder="Text"
                    className={inputClassName}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm sm:text-base font-medium text-gray-900">
                    Email
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
                    Phone number
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
                    Bedrijfsnaam / Handelsnaam
                  </Label>
                  <Input
                    id="companyName"
                    placeholder="Bedrijfsnaam"
                    className={inputClassName}
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>

                {/* KVK Number */}
                <div className="space-y-2">
                  <Label htmlFor="kvkNumber" className="text-sm sm:text-base font-medium text-gray-900">
                    KVK-nummer
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
                    BTW-identificatienummer <span className="text-gray-400">(optioneel)</span>
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
                  placeholder="Tell us about yourself, your style, and your DJ journey..."
                  rows={5}
                  className={textareaClassName}
                  required
                />
              </div>

              <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
                {/* Years of Experience */}
                <div className="space-y-2">
                  <Label htmlFor="experience" className="text-sm sm:text-base font-medium text-gray-900">
                    Years of Experience
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
                    Fee (€ per hour)
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
                  <h3 className="text-base sm:text-lg font-bold text-gray-900">Set Your Booking Hours Range</h3>
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs font-bold flex-shrink-0">
                      ↔
                    </span>
                    Drag the handles on the slider below to set your minimum and maximum booking hours
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
                      Minimum Booking Hours
                    </Label>
                    <div className="h-12 w-full rounded-md dark:bg-gray-950 border-2 border-gray-300 dark:border-gray-600 px-4 py-3 text-base font-bold text-gray-900 dark:text-white flex items-center justify-center cursor-default">
                      {minHours}
                    </div>
                  </div>

                  {/* Maximum Booking Hours */}
                  <div className="space-y-2">
                    <Label htmlFor="maxHours" className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">
                      Maximum Booking Hours
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
                    City
                  </Label>
                  <Input id="city" placeholder="Amsterdam" className={inputClassName} required />
                </div>

                {/* Range (km) */}
                <div className="space-y-2">
                  <Label htmlFor="range" className="text-sm sm:text-base font-medium text-gray-900">
                    Range (km)
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
                  Artist Type
                </Label>
                <Select value={artistType} onValueChange={handleArtistTypeChange}>
                  <SelectTrigger className="h-12 w-full rounded-md border border-gray-300 dark:border-gray-600 !dark:bg-gray-950 dark:!bg-slate-800 text-gray-900 dark:text-white px-4 py-3 text-base">
                    <SelectValue placeholder="Select your artist type" />
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
                  This helps clients find you based on the type of performance you offer
                </p>
              </div>

              {artistType && (
                <div className="space-y-2">
                  <Label className="text-sm sm:text-base font-medium text-foreground">Music Genres</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="h-12 w-full justify-between rounded-md border border-gray-300 dark:border-gray-600 !dark:bg-gray-950 dark:!bg-slate-800 text-gray-900 dark:text-white px-4 py-3 text-base font-normal hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        {selectedGenres.length > 0 ? `${selectedGenres.length} genre(s) selected` : "Select genres"}
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
                  <Label className="text-sm sm:text-base font-medium text-foreground">Event Types</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="h-12 w-full justify-between rounded-md border border-gray-300 dark:border-gray-600 !dark:bg-gray-950 dark:!bg-slate-800 text-gray-900 dark:text-white px-4 py-3 text-base font-normal hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        {selectedEventTypes.length > 0
                          ? `${selectedEventTypes.length} type(s) selected`
                          : "Select event types"}
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-2 dark:bg-gray-950 border border-gray-300 dark:border-gray-600">
                      {["Birthday", "Wedding", "Corporate", "Festival", "Club Night", "Anniversary", "Private Party"].map(
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
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground">Package Equipment Rental</h2>
                  <p className="text-sm sm:text-base leading-relaxed text-muted-foreground">{getPackageDescription()}</p>

                  <div className="space-y-3">
                    <h3 className="text-sm sm:text-base font-semibold text-foreground">
                      Minimum equipment required to register:
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
                                  placeholder="Rental price (e.g. €150/day)"
                                  value={equipment?.price || ""}
                                  onChange={(e) => updateEquipmentItem(config.id, "price", e.target.value)}
                                  className="h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 !dark:bg-gray-950 dark:!bg-slate-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                                  disabled={!isAccessible}
                                />
                                <Input
                                  placeholder="Short description"
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
                                  {equipment?.image ? "Photo added" : "Add equipment photo"}
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
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground">Extra Equipment (Optional)</h2>
                  <p className="text-sm sm:text-base leading-relaxed text-muted-foreground">
                    Add any additional equipment you offer as optional extras for clients.
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
                        placeholder="Equipment name"
                        value={currentExtraEquipment.name}
                        onChange={(e) => setCurrentExtraEquipment({ ...currentExtraEquipment, name: e.target.value })}
                        className="h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 !dark:bg-gray-950 dark:!bg-slate-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                      />
                      <Input
                        placeholder="Rental price (e.g. €50/day)"
                        value={currentExtraEquipment.price}
                        onChange={(e) => setCurrentExtraEquipment({ ...currentExtraEquipment, price: e.target.value })}
                        className="h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 !dark:bg-gray-950 dark:!bg-slate-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                      />
                    </div>
                    <Textarea
                      placeholder="Short description of the equipment"
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
                          {currentExtraEquipmentImage ? "Photo added" : "Add photo"}
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
                        Add Equipment
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Social Media Links */}
              <div className="space-y-4">
                <h2 className="text-xl sm:text-2xl font-bold text-foreground">Social Media & Links</h2>

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
                      <SelectValue placeholder="Select platform" />
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
                    placeholder="Paste your link here..."
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
                  Add social media
                </Button>
              </div>

              {/* Register Button */}
              <Button
                type="submit"
                className="h-12 w-full bg-red-700 text-base font-semibold text-white hover:bg-red-600"
              >
                Register
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
