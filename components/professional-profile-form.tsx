"use client"

import { reachUserTestGoal, trackUserTest } from "@/lib/usertest"
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
import { useImageCrop } from "@/hooks/use-image-crop"
import { fileToDataUrl } from "@/lib/crop-image"
import { AdditionalEquipment, type AdditionalCategory } from "@/components/additional-equipment"
import { saveProfessionalProfile } from "@/app/actions/professional-profile"
import { EquipmentFields } from "@/components/equipment-fields"
import { NumericInput } from "@/components/numeric-input"
import { clearPendingPassword, getPendingPassword } from "@/lib/pending-signup"
import { authClient } from "@/lib/auth-client"
import { lettersOnly, phoneChars } from "@/lib/input-filters"
import { ChipMultiSelect } from "@/components/chip-multi-select"
import { EVENT_TYPE_GROUPS, GENRE_GROUPS, genreLabel } from "@/lib/profile-options"
import { digitsOnlyPrice, imageSrc, type ProfessionalProfileData } from "@/lib/professional-profile-types"

/** Visible marker for required fields; the field itself carries `required` for screen readers. */
function RequiredMark() {
  return (
    <span aria-hidden="true" className="text-red-600">
      {" "}
      *
    </span>
  )
}

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
  category?: AdditionalCategory
}

const ADDITIONAL_CATEGORY_BY_EQUIPMENT_ID: Record<string, AdditionalCategory> = {
  lighting: "lighting",
  "sound-system": "sound",
  "pa-system": "sound",
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

interface ProfessionalProfileFormProps {
  mode?: "register" | "edit"
  initialProfile?: ProfessionalProfileData | null
}

async function uploadImage(dataUrl: string, kind: "banner" | "avatar" | "equipment") {
  if (!dataUrl || !dataUrl.startsWith("data:")) return dataUrl
  const blob = await (await fetch(dataUrl)).blob()
  const formData = new FormData()
  formData.append("file", new File([blob], `${kind}.${blob.type.split("/")[1] || "jpg"}`, { type: blob.type }))
  formData.append("kind", kind)
  const response = await fetch("/api/artist-media", { method: "POST", body: formData })
  if (!response.ok) throw new Error("upload_failed")
  const { pathname } = (await response.json()) as { pathname: string }
  return pathname
}

export function ProfessionalProfileForm({ mode = "register", initialProfile = null }: ProfessionalProfileFormProps) {
  const isEdit = mode === "edit"
  const router = useRouter()
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState("")

  useEffect(() => {
    if (!isEdit) trackUserTest("profile_form_opened")
  }, [isEdit])
  const [minHours, setMinHours] = useState(initialProfile?.minHours ?? 1)
  const [maxHours, setMaxHours] = useState(initialProfile?.maxHours ?? 8)
  const [artistType, setArtistType] = useState<string>(initialProfile?.artistType ?? "")
  const [bannerImage, setBannerImage] = useState<string>(initialProfile?.bannerPath ?? "")
  const [profileImage, setProfileImage] = useState<string>(initialProfile?.avatarPath ?? "")
  const [stageName, setStageName] = useState<string>(initialProfile?.stageName ?? "")
  const [bio, setBio] = useState<string>(initialProfile?.bio ?? "")
  const [yearsExperience, setYearsExperience] = useState<string>(String(initialProfile?.yearsExperience ?? 0))
  const [hourlyRate, setHourlyRate] = useState<string>(String(initialProfile?.hourlyRate ?? 0))
  const [city, setCity] = useState<string>(initialProfile?.city ?? "")
  const [rangeKm, setRangeKm] = useState<string>(String(initialProfile?.rangeKm ?? 100))

  const { t, language } = useLanguage()
  const { theme, toggleTheme } = useTheme()
  const L = language === "nl"

  const [fullName, setFullName] = useState<string>(initialProfile?.fullName ?? "")
  const [email, setEmail] = useState<string>(initialProfile?.email ?? "")
  const [artistTypeError, setArtistTypeError] = useState("")
  const [genresError, setGenresError] = useState("")
  const [eventTypesError, setEventTypesError] = useState("")
  const [equipmentError, setEquipmentError] = useState("")
  const { data: sessionData, isPending: sessionPending, error: sessionError } = authClient.useSession()
  const sessionEmail = sessionData?.user?.email
  // A new professional has no account yet: it is created together with the profile on submit.
  const needsAccount = !isEdit && !sessionData?.user && (!sessionPending || !!sessionError)
  const [password, setPassword] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [signupCategory, setSignupCategory] = useState("artist")
  // Name, email and phone were entered in the signup window and are fixed here,
  // because email and phone are verified later.
  const [signupLocked, setSignupLocked] = useState(false)
  const [hasPendingPassword, setHasPendingPassword] = useState(false)
  const lockSignupFields = needsAccount && signupLocked
  useEffect(() => {
    // After a reload the signup data is gone; the account's own address is the source of truth.
    if (sessionEmail) setEmail((current) => current || sessionEmail)
  }, [sessionEmail])
  const [phone, setPhone] = useState<string>(initialProfile?.phone ?? "")

  const [companyName, setCompanyName] = useState<string>(initialProfile?.companyName ?? "")
  const [kvkNumber, setKvkNumber] = useState<string>(initialProfile?.kvkNumber ?? "")
  const [vatNumber, setVatNumber] = useState<string>(initialProfile?.vatNumber ?? "")
  const [kvkError, setKvkError] = useState<string>("")

  const [selectedGenres, setSelectedGenres] = useState<string[]>(initialProfile?.genres ?? [])
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>(initialProfile?.eventTypes ?? [])

  const [socialMediaLinks, setSocialMediaLinks] = useState<SocialMediaLink[]>(initialProfile?.socials ?? [])
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
        if (data.fullName && data.email && data.phone) {
          setSignupLocked(true)
          setHasPendingPassword(getPendingPassword().length >= 8)
        }
        if (data.category) {
          setSignupCategory(data.category)
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

      } catch (error) {
        console.error("[v0] Error parsing signup data:", error)
      }
    }
  }, [])

  const bannerInputRef = useRef<HTMLInputElement>(null)
  const profileInputRef = useRef<HTMLInputElement>(null)

  const [minimumEquipment, setMinimumEquipment] = useState<Record<string, PackageEquipmentItem>>(() =>
    Object.fromEntries(
      Object.entries(initialProfile?.minimumEquipment ?? {}).map(([key, item]) => [
        key,
        { ...item, price: digitsOnlyPrice(item.price) },
      ]),
    ),
  )
  const [currentEquipmentIndex, setCurrentEquipmentIndex] = useState(0)

  const [extraEquipment, setExtraEquipment] = useState<ExtraEquipmentItem[]>(() =>
    (initialProfile?.extraEquipment ?? []).map((item) => ({ ...item, price: digitsOnlyPrice(item.price) })),
  )
  const { requestCrop, cropDialog } = useImageCrop()

  const pickCroppedImage = async (
    event: React.ChangeEvent<HTMLInputElement>,
    options: { aspect: number; round?: boolean },
  ) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return null
    const cropped = await requestCrop(file, options)
    return cropped ? fileToDataUrl(cropped) : null
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

  const patchEquipmentItem = (equipmentId: string, patch: Partial<PackageEquipmentItem>) => {
    setMinimumEquipment((prev) => ({
      ...prev,
      [equipmentId]: { ...prev[equipmentId], id: equipmentId, ...patch } as PackageEquipmentItem,
    }))
  }

  const updateExtraEquipment = (id: string, patch: Partial<ExtraEquipmentItem>) => {
    setExtraEquipment((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)))
  }

  const handleBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const image = await pickCroppedImage(e, { aspect: 1.91 })
    if (image) setBannerImage(image)
  }

  const handleProfileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const image = await pickCroppedImage(e, { aspect: 1, round: true })
    if (image) setProfileImage(image)
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

  // What is still missing before the form may be sent; the submit button stays grey until this is empty.
  const missingFields: string[] = []
  {
    const need = (ok: boolean, nl: string, en: string) => {
      if (!ok) missingFields.push(L ? nl : en)
    }
    need(!!stageName.trim(), "Artiestennaam", "Stage name")
    need(!!fullName.trim(), "Volledige naam", "Full name")
    need(/^\S+@\S+\.\S+$/.test(email.trim()), "E-mail", "Email")
    if (needsAccount && !hasPendingPassword) need(password.length >= 8, "Wachtwoord (minimaal 8 tekens)", "Password (at least 8 characters)")
    need(!!phone.trim(), "Telefoonnummer", "Phone number")
    need(/^\d{8}$/.test(kvkNumber), "KVK-nummer (8 cijfers)", "KVK number (8 digits)")
    need(!!bio.trim(), "Bio", "Bio")
    need(!!city.trim(), "Stad", "City")
    need(yearsExperience.trim() !== "", "Jaren ervaring", "Years of experience")
    need(Number(hourlyRate) > 0, "Tarief per uur", "Fee per hour")
    need(!!artistType, "Artiest type", "Artist type")
    need(selectedGenres.length > 0, "Muziekgenres", "Music genres")
    need(selectedEventTypes.length > 0, "Evenement types", "Event types")
    if (artistType) {
      const config = getMinimumEquipmentConfig()
      const done = config.filter((item) => isEquipmentComplete(item.id)).length
      need(done === config.length, `Apparatuurpakket (${done} van ${config.length} compleet)`, `Equipment package (${done} of ${config.length} complete)`)
    } else {
      need(false, "Apparatuurpakket", "Equipment package")
    }
  }
  const formComplete = missingFields.length === 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (saving) return
    if (!isEdit) trackUserTest("profile_submitted")

    if (!/^\d{8}$/.test(kvkNumber)) {
      if (!isEdit) trackUserTest("profile_error", { reason: "kvk_invalid" })
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

    if (!artistType) {
      if (!isEdit) trackUserTest("profile_error", { reason: "artist_type_missing" })
      setArtistTypeError(L ? "Kies je artiest type." : "Choose your artist type.")
      document.getElementById("artistType")?.focus()
      return
    }

    // A profile without genres, event types or a complete equipment package may not be submitted.
    const fail = (reason: string, elementId: string) => {
      if (!isEdit) trackUserTest("profile_error", { reason })
      document.getElementById(elementId)?.scrollIntoView({ behavior: "smooth", block: "center" })
    }
    if (selectedGenres.length === 0) {
      setGenresError(L ? "Kies minimaal één muziekgenre." : "Choose at least one music genre.")
      return fail("genres_missing", "genres-field")
    }
    if (selectedEventTypes.length === 0) {
      setEventTypesError(L ? "Kies minimaal één evenement type." : "Choose at least one event type.")
      return fail("event_types_missing", "event-types-field")
    }
    const missingEquipment = getMinimumEquipmentConfig().filter((config) => !isEquipmentComplete(config.id))
    if (missingEquipment.length > 0) {
      setEquipmentError(
        L
          ? `Vul het apparatuurpakket volledig in. Bij ${missingEquipment.length} van de ${getMinimumEquipmentConfig().length} onderdelen ontbreekt nog een naam, prijs, beschrijving of foto.`
          : `Complete the equipment package. ${missingEquipment.length} of ${getMinimumEquipmentConfig().length} items still lack a name, price, description or photo.`,
      )
      return fail("equipment_incomplete", "equipment-field")
    }

    const accountPassword = hasPendingPassword ? getPendingPassword() : password
    if (needsAccount && accountPassword.length < 8) {
      trackUserTest("signup_error", { reason: "password_too_short" })
      setPasswordError(L ? "Je wachtwoord moet minimaal 8 tekens hebben." : "Your password must be at least 8 characters.")
      document.getElementById("password")?.focus()
      return
    }

    setSaving(true)
    setSaveError("")
    setSaved(false)
    try {
      if (needsAccount) {
        trackUserTest("signup_submitted", { account_type: "professional" })
        const { error: signUpError } = await authClient.signUp.email({
          name: fullName.trim(),
          email: email.trim(),
          password: accountPassword,
          role: "professional",
          phone: phone.trim(),
          category: signupCategory,
        })
        if (signUpError) {
          trackUserTest("signup_error", { reason: "server" })
          setSaveError(
            lockSignupFields
              ? L
                ? "Je account aanmaken is niet gelukt. Bestaat er al een account met dit e-mailadres, log dan in. Klopt het adres niet, begin dan opnieuw via Sign Up."
                : "Creating your account failed. If an account with this email address already exists, log in. If the address is wrong, start again via Sign Up."
              : L
                ? "Je account aanmaken is niet gelukt. Controleer je e-mailadres, of log in als je al een account hebt."
                : "Creating your account failed. Check your email address, or log in if you already have an account.",
          )
          return
        }
        trackUserTest("signup_completed", { account_type: "professional" })
        setPassword("")
        clearPendingPassword()
      }

      const minimumEquipmentUploaded = Object.fromEntries(
        await Promise.all(
          Object.entries(minimumEquipment).map(async ([key, item]) => [
            key,
            { ...item, image: item.image ? await uploadImage(item.image, "equipment") : undefined },
          ]),
        ),
      )
      const extraEquipmentUploaded = await Promise.all(
        extraEquipment
          .filter((item) => item.name.trim())
          .map(async (item) => ({
            ...item,
            name: item.name.trim(),
            image: item.image ? await uploadImage(item.image, "equipment") : undefined,
          })),
      )
      const avatarPath = profileImage ? await uploadImage(profileImage, "avatar") : null
      const bannerPath = bannerImage ? await uploadImage(bannerImage, "banner") : null
      const genreLabels = selectedGenres.map((value) => genreLabel(value, L))

      const result = await saveProfessionalProfile({
        stageName,
        fullName,
        phone,
        companyName,
        kvkNumber,
        vatNumber,
        bio,
        yearsExperience: Number(yearsExperience) || 0,
        hourlyRate: Number(hourlyRate) || 0,
        minHours,
        maxHours,
        city,
        rangeKm: Number(rangeKm) || 0,
        artistType,
        genres: selectedGenres,
        genreLabels,
        eventTypes: selectedEventTypes,
        socials: socialMediaLinks,
        minimumEquipment: minimumEquipmentUploaded,
        extraEquipment: extraEquipmentUploaded,
        avatarPath,
        bannerPath,
      })

      if (!result.ok) {
        if (!isEdit) trackUserTest("profile_error", { reason: "save_failed" })
        setSaveError(L ? "Opslaan is mislukt. Controleer je gegevens en probeer het opnieuw." : "Saving failed. Check your details and try again.")
        return
      }

      if (isEdit) {
        setSaved(true)
        router.refresh()
      } else {
        sessionStorage.removeItem("professionalSignupData")
        reachUserTestGoal("artist_profile_completed")
        router.push("/dashboard")
      }
    } catch (error) {
      if (!isEdit) trackUserTest("profile_error", { reason: "exception" })
      console.error("Profile save failed:", error)
      setSaveError(L ? "Opslaan is mislukt. Probeer het opnieuw." : "Saving failed. Please try again.")
    } finally {
      setSaving(false)
    }
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
    setArtistTypeError("")
    setSelectedGenres([])
    setSelectedEventTypes([])
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      {!isEdit && (
      <header className="bg-card px-4 sm:px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <Link href="/">
            <Image
              src="/arsi-logo.png"
              alt="ARSI Events Logo"
              width={120}
              height={60}
              className="h-10 sm:h-12 w-auto cursor-pointer dark:hidden"
            />
            <Image
              src="/arsi-logo-dark.png"
              alt="ARSI Events Logo"
              width={120}
              height={60}
              className="hidden h-10 sm:h-12 w-auto cursor-pointer dark:block"
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
      )}

      <div className={isEdit ? "p-4 sm:p-6 md:p-8 lg:p-10" : "bg-card p-4 sm:p-6 md:p-10"}>
        <div className="mx-auto max-w-4xl space-y-6 sm:space-y-8">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-red-600 flex-shrink-0">
              <Music className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-red-600">
                {isEdit
                  ? L
                    ? "Bewerk je profiel"
                    : "Edit your profile"
                  : L
                    ? "Registreer als Professional"
                    : "Register as Professional"}
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                {isEdit
                  ? L
                    ? "Werk je gegevens, apparatuur en tarieven bij"
                    : "Update your details, equipment and rates"
                  : L
                    ? "Vul het formulier in. Je account wordt aangemaakt als je het opslaat; daarna beoordeelt ARSI Events je aanmelding."
                    : "Fill out the form. Your account is created when you save it; ARSI Events then reviews your application."}
              </p>
            </div>
          </div>

          {!isEdit && (
          <>
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
                <Image src={imageSrc(bannerImage) || "/placeholder.svg"} alt="Banner" fill className="object-cover" />
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
                        src={imageSrc(profileImage) || "/placeholder.svg"}
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
          </>
          )}

          {/* Form Wrapper */}
          <div className="space-y-6">
            <form
              onSubmit={handleSubmit}
              // Required fields left empty block the submit before handleSubmit runs.
              onInvalidCapture={(event) => {
                const field = event.target as HTMLInputElement
                if (!isEdit) trackUserTest("profile_field_missing", { field: field.name || field.id || field.type })
              }}
              className="space-y-6"
            >
              <p className="text-sm text-gray-500">
                {L ? "Velden met " : "Fields marked "}
                <span className="text-red-600">*</span>
                {L ? " zijn verplicht." : " are required."}
              </p>
              <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
                {/* Stage Name */}
                <div className="space-y-2">
                  <Label htmlFor="stageName" className="text-sm sm:text-base font-medium text-gray-900">
                    {L ? "Artiestennaam" : "Stage Name"}
                    <RequiredMark />
                  </Label>
                  <Input
                    id="stageName"
                    placeholder={L ? "DJ Voorbeeld" : "DJ Example"}
                    className={inputClassName}
                    value={stageName}
                    onChange={(e) => setStageName(e.target.value)}
                    required
                  />
                </div>

                {/* Full Name */}
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-sm sm:text-base font-medium text-gray-900">
                    {L ? "Volledige naam" : "Full Name"}
                    <RequiredMark />
                  </Label>
                  <Input
                    id="fullName"
                    placeholder={L ? "Tekst" : "Text"}
                    className={inputClassName + (lockSignupFields ? " cursor-not-allowed opacity-70" : "")}
                    value={fullName}
                    onChange={(e) => setFullName(lettersOnly(e.target.value))}
                    readOnly={lockSignupFields}
                    required
                  />
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm sm:text-base font-medium text-gray-900">
                    {L ? "E-mail" : "Email"}
                    {needsAccount && <RequiredMark />}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    className={inputClassName + (lockSignupFields ? " cursor-not-allowed opacity-70" : "")}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    readOnly={!needsAccount || lockSignupFields}
                    required
                    autoComplete="email"
                    aria-describedby="email-help"
                  />
                  <p id="email-help" className="text-xs sm:text-sm text-gray-500">
                    {lockSignupFields
                      ? L
                        ? "Hiermee log je straks in. Naam, e-mail en telefoonnummer heb je bij het aanmelden opgegeven en zijn hier niet aan te passen. Typfout? Begin opnieuw via Sign Up."
                        : "You will use this to log in. Name, email and phone number were entered at sign-up and cannot be changed here. Typo? Start again via Sign Up."
                      : needsAccount
                      ? L
                        ? "Hiermee log je straks in."
                        : "You will use this to log in."
                      : L
                        ? "Dit is het e-mailadres van je account."
                        : "This is the email address of your account."}
                  </p>
                </div>

                {needsAccount && !hasPendingPassword && (
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm sm:text-base font-medium text-gray-900">
                      {L ? "Wachtwoord" : "Password"}
                      <RequiredMark />
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      className={inputClassName}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value)
                        setPasswordError("")
                      }}
                      required
                      autoComplete="new-password"
                      aria-invalid={!!passwordError}
                      aria-describedby="password-help"
                    />
                    <p id="password-help" className={`text-xs sm:text-sm ${passwordError ? "text-red-500" : "text-gray-500"}`}>
                      {passwordError || (L ? "Minimaal 8 tekens." : "At least 8 characters.")}
                    </p>
                  </div>
                )}

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm sm:text-base font-medium text-gray-900">
                    {L ? "Telefoonnummer" : "Phone number"}
                    <RequiredMark />
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    className={inputClassName + (lockSignupFields ? " cursor-not-allowed opacity-70" : "")}
                    inputMode="tel"
                    value={phone}
                    onChange={(e) => setPhone(phoneChars(e.target.value))}
                    readOnly={lockSignupFields}
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
                    <RequiredMark />
                  </Label>
                  <Input
                    id="kvkNumber"
                    inputMode="numeric"
                    placeholder="12345678"
                    className={inputClassName}
                    value={kvkNumber}
                    onChange={handleKvkChange}
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
                  <RequiredMark />
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
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
                {/* Years of Experience */}
                <div className="space-y-2">
                  <Label htmlFor="experience" className="text-sm sm:text-base font-medium text-gray-900">
                    {L ? "Jaren ervaring" : "Years of Experience"}
                    <RequiredMark />
                  </Label>
                  <NumericInput
                    id="experience"
                    maxLength={2}
                    value={yearsExperience}
                    onValueChange={(value) => setYearsExperience(Number(value) > 60 ? "60" : value)}
                    className={inputClassName}
                    required
                    aria-describedby="experience-help"
                  />
                  <p id="experience-help" className="text-xs sm:text-sm text-gray-500">
                    {L ? "Maximaal 60 jaar." : "At most 60 years."}
                  </p>
                </div>

                {/* Fee per hour */}
                <div className="space-y-2">
                  <Label htmlFor="fee" className="text-sm sm:text-base font-medium text-gray-900">
                    {L ? "Tarief (€ per uur)" : "Fee (€ per hour)"}
                    <RequiredMark />
                  </Label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">€</span>
                    <NumericInput
                      id="fee"
                      allowDecimal
                      value={hourlyRate}
                      onValueChange={setHourlyRate}
                      className="h-12 w-full rounded-md border border-gray-300 dark:border-gray-600 !dark:bg-gray-950 dark:!bg-slate-800 text-gray-900 dark:text-white py-3 pl-8 pr-4 text-base focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
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
                    <RequiredMark />
                  </Label>
                  <Input
                    id="city"
                    placeholder="Amsterdam"
                    className={inputClassName}
                    value={city}
                    onChange={(e) => setCity(lettersOnly(e.target.value))}
                    required
                  />
                </div>

                {/* Range (km) */}
                <div className="space-y-2">
                  <Label htmlFor="range" className="text-sm sm:text-base font-medium text-gray-900">
                    {L ? "Bereik (km)" : "Range (km)"}
                    <RequiredMark />
                  </Label>
                  <NumericInput
                    id="range"
                    maxLength={4}
                    value={rangeKm}
                    onValueChange={setRangeKm}
                    className={inputClassName}
                    required
                  />
                </div>
              </div>

              {/* Artist Type selector */}
              <div className="space-y-2">
                <Label htmlFor="artistType" className="text-sm sm:text-base font-medium text-gray-900">
                  {L ? "Artiest type" : "Artist Type"}
                  <RequiredMark />
                </Label>
                <Select value={artistType} onValueChange={handleArtistTypeChange}>
                  <SelectTrigger
                    id="artistType"
                    aria-invalid={!!artistTypeError}
                    aria-describedby={artistTypeError ? "artistType-error" : undefined}
                    className="h-12 w-full rounded-md border border-gray-300 dark:border-gray-600 !dark:bg-gray-950 dark:!bg-slate-800 text-gray-900 dark:text-white px-4 py-3 text-base">
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
                {artistTypeError && (
                  <p id="artistType-error" role="alert" className="text-sm text-red-500">
                    {artistTypeError}
                  </p>
                )}
                <p className="text-xs sm:text-sm text-gray-500">
                  {L
                    ? "Dit helpt klanten je te vinden op basis van het type optreden dat je aanbiedt"
                    : "This helps clients find you based on the type of performance you offer"}
                </p>
              </div>

              {artistType && (
                <div id="genres-field" className="space-y-2">
                  <Label className="text-sm sm:text-base font-medium text-foreground">
                    {L ? "Muziekgenres" : "Music Genres"}
                    <RequiredMark />
                  </Label>
                  {genresError && selectedGenres.length === 0 && (
                    <p role="alert" className="text-sm text-red-500">
                      {genresError}
                    </p>
                  )}
                  <ChipMultiSelect
                    groups={GENRE_GROUPS.map((group) => ({
                      label: L ? group.nl : group.en,
                      options: group.options.map((option) => ({ value: option.value, label: L ? option.nl : option.en })),
                    }))}
                    selected={selectedGenres}
                    onChange={setSelectedGenres}
                    searchPlaceholder={L ? "Zoek een genre..." : "Search a genre..."}
                    countLabel={(count) => (L ? `${count} gekozen` : `${count} selected`)}
                    clearLabel={L ? "Wis alles" : "Clear all"}
                    emptyLabel={L ? "Geen genre gevonden." : "No genre found."}
                    invalid={!!genresError && selectedGenres.length === 0}
                  />
                </div>
              )}

              {/* Event Types */}
              {artistType && (
                <div id="event-types-field" className="space-y-2">
                  <Label className="text-sm sm:text-base font-medium text-foreground">
                    {L ? "Evenement types" : "Event Types"}
                    <RequiredMark />
                  </Label>
                  {eventTypesError && selectedEventTypes.length === 0 && (
                    <p role="alert" className="text-sm text-red-500">
                      {eventTypesError}
                    </p>
                  )}
                  <ChipMultiSelect
                    groups={EVENT_TYPE_GROUPS.map((group) => ({
                      label: L ? group.nl : group.en,
                      // Stored by label, in the language the artist registers in (as before).
                      options: group.options.map((option) => ({
                        value: L ? option.nl : option.en,
                        label: L ? option.nl : option.en,
                      })),
                    }))}
                    selected={selectedEventTypes}
                    onChange={setSelectedEventTypes}
                    searchPlaceholder={L ? "Zoek een evenement type..." : "Search an event type..."}
                    countLabel={(count) => (L ? `${count} gekozen` : `${count} selected`)}
                    clearLabel={L ? "Wis alles" : "Clear all"}
                    emptyLabel={L ? "Geen evenement type gevonden." : "No event type found."}
                    invalid={!!eventTypesError && selectedEventTypes.length === 0}
                  />
                </div>
              )}

              {/* Package Equipment Section */}
              {artistType && (
                <div id="equipment-field" className="rounded-lg p-4 sm:p-6 space-y-4 bg-gray-100 dark:!bg-gray-950">
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                    {L ? "Pakket apparatuur verhuur" : "Package Equipment Rental"}
                    <RequiredMark />
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {L
                      ? "Verplicht: vul elk onderdeel in met naam, prijs, beschrijving en foto."
                      : "Required: complete every item with a name, price, description and photo."}
                  </p>
                  {equipmentError && getMinimumEquipmentConfig().some((config) => !isEquipmentComplete(config.id)) && (
                    <p role="alert" className="text-sm text-red-500">
                      {equipmentError}
                    </p>
                  )}
                  <p className="text-sm sm:text-base leading-relaxed text-muted-foreground">{getPackageDescription()}</p>

                  <div className="space-y-3">
                    <h3 className="text-sm sm:text-base font-semibold text-foreground">
                      {L ? "Apparatuur die bij dit pakket hoort:" : "Equipment that belongs to this package:"}
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
                              <EquipmentFields
                                value={equipment ?? {}}
                                onChange={(patch) => patchEquipmentItem(config.id, patch)}
                                namePlaceholder={config.placeholder}
                                photoId={`equipment-file-${config.id}`}
                                nl={L}
                              />
                              {ADDITIONAL_CATEGORY_BY_EQUIPMENT_ID[config.id] && (
                                <AdditionalEquipment
                                  category={ADDITIONAL_CATEGORY_BY_EQUIPMENT_ID[config.id]}
                                  items={extraEquipment.filter(
                                    (item) => item.category === ADDITIONAL_CATEGORY_BY_EQUIPMENT_ID[config.id],
                                  )}
                                  onAdd={(item) => setExtraEquipment((prev) => [...prev, item])}
                                  onUpdate={updateExtraEquipment}
                                  onRemove={removeExtraEquipment}
                                  nl={L}
                                />
                              )}
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

                  <AdditionalEquipment
                    items={extraEquipment.filter((item) => !item.category)}
                    onAdd={(item) => setExtraEquipment((prev) => [...prev, item])}
                    onUpdate={updateExtraEquipment}
                    onRemove={removeExtraEquipment}
                    nl={L}
                  />
                </div>
              )}

              {cropDialog}

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
                className="h-12 w-full bg-red-700 text-base font-semibold text-white hover:bg-red-600 disabled:bg-gray-400 disabled:text-white disabled:opacity-100 dark:disabled:bg-gray-700 dark:disabled:text-gray-300"
                disabled={saving || !formComplete}
                aria-describedby={formComplete ? undefined : "missing-fields"}
              >
                {saving
                  ? L
                    ? "Opslaan..."
                    : "Saving..."
                  : isEdit
                    ? L
                      ? "Wijzigingen opslaan"
                      : "Save changes"
                    : L
                      ? "Registreren"
                      : "Register"}
              </Button>
              {!formComplete && (
                <div id="missing-fields" className="rounded-lg border border-gray-300 p-3 text-sm dark:border-gray-600">
                  <p className="font-medium text-foreground">
                    {L
                      ? `Nog ${missingFields.length} ${missingFields.length === 1 ? "onderdeel" : "onderdelen"} invullen voordat je kunt ${isEdit ? "opslaan" : "registreren"}:`
                      : `${missingFields.length} ${missingFields.length === 1 ? "item" : "items"} left before you can ${isEdit ? "save" : "register"}:`}
                  </p>
                  <ul className="mt-1 list-disc pl-5 text-muted-foreground">
                    {missingFields.map((field) => (
                      <li key={field}>{field}</li>
                    ))}
                  </ul>
                </div>
              )}
              {saveError && (
                <p role="alert" className="text-center text-sm text-red-500">
                  {saveError}
                </p>
              )}
              {isEdit && saved && (
                <p role="status" className="text-center text-sm text-green-600">
                  {L ? "Je profiel is opgeslagen" : "Your profile has been saved"}
                </p>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
