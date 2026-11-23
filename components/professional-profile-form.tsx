"use client"

import { reachUserTestGoal, trackUserTest } from "@/lib/usertest"
import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Music, Plus, X, Camera, Speaker, Mic, Lightbulb, Piano, Guitar, ChevronDown, Check, Moon, Sun, Lock } from "lucide-react"
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
import type { SyncedField } from "@/lib/profile-page-sync"
import { EquipmentFields } from "@/components/equipment-fields"
import { NumericInput } from "@/components/numeric-input"
import { clearPendingPassword, getPendingPassword } from "@/lib/pending-signup"
import { authClient } from "@/lib/auth-client"
import { lettersOnly, phoneChars } from "@/lib/input-filters"
import { ComboSelect } from "@/components/combo-select"
import {
  ARTIST_TYPES,
  EVENT_TYPE_GROUPS,
  GENRE_GROUPS,
  PHOTO_SPECIALTY_GROUPS,
  PHOTO_VIDEO_TYPES,
  SOCIAL_PLATFORMS,
  canonicalEventType,
  genreLabel,
  isPhotoVideo,
} from "@/lib/profile-options"
import { digitsOnlyPrice, imageSrc, type ProfessionalProfileData } from "@/lib/professional-profile-types"

/** Visible marker for required fields; the field itself carries `required` for screen readers. */
function RequiredMark() {
  return (
    <span aria-hidden="true" className="text-[var(--rf-red-text)]">
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

/** Tells which parts of the public page did not follow the profile, because they were edited there. */
function keptOnPageText(fields: SyncedField[], photo: boolean, nl: boolean) {
  const names: Record<SyncedField, string> = nl
    ? { bio: "bio", eventTypes: "evenementtypes", genres: photo ? "specialisaties" : "muziekgenres", socials: "sociale media" }
    : { bio: "bio", eventTypes: "event types", genres: photo ? "specialities" : "music genres", socials: "social media" }
  const list = new Intl.ListFormat(nl ? "nl" : "en").format(fields.map((field) => names[field]))
  const label = list.charAt(0).toUpperCase() + list.slice(1)
  const plural = fields.length > 1 || fields[0] !== "bio"
  return nl
    ? `${label} op Mijn website ${plural ? "zijn" : "is"} apart aangepast en niet gewijzigd.`
    : `${label} on My website ${plural ? "were" : "was"} edited separately and not changed.`
}

interface ProfessionalProfileFormProps {
  mode?: "register" | "edit"
  initialProfile?: ProfessionalProfileData | null
  /** Signup category of the account ("artist", "photo-video", ...); in register mode it comes from the signup window. */
  category?: string | null
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

export function ProfessionalProfileForm({ mode = "register", initialProfile = null, category = null }: ProfessionalProfileFormProps) {
  const isEdit = mode === "edit"
  const router = useRouter()
  const [saved, setSaved] = useState(false)
  const [keptOnPage, setKeptOnPage] = useState<SyncedField[]>([])
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
  const [signupCategory, setSignupCategory] = useState(category ?? "artist")
  // Photographers and videographers get their own types and specialisations and no required equipment package.
  const photo = isPhotoVideo(isEdit ? category : signupCategory)
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
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>((initialProfile?.eventTypes ?? []).map(canonicalEventType))

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

  const priceOf = (value: string | undefined) => Number(digitsOnlyPrice(value)) || 0
  const formatEuro = (amount: number) =>
    `€${Number.isInteger(amount) ? amount : amount.toFixed(2).replace(".", ",")}`
  // Everything added inside the package section belongs to the package; only the separate "Extra equipment" section stays out.
  const packageTotal =
    [...Object.values(minimumEquipment), ...extraEquipment.filter((item) => item.category)]
      .filter((item) => item?.name)
      .reduce((sum, item) => sum + priceOf(item.price), 0)
  const completeCount = getMinimumEquipmentConfig().filter((config) => isEquipmentComplete(config.id)).length
  const packageExtraCount = extraEquipment.filter((item) => item.category).length
  // What is still missing before the form may be sent; the submit button stays grey until this is empty.
  const missingFields: string[] = []
  {
    const need = (ok: boolean, nl: string, en: string) => {
      if (!ok) missingFields.push(L ? nl : en)
    }
    need(!!stageName.trim(), photo ? "Profielnaam" : "Artiestennaam", photo ? "Profile name" : "Stage name")
    need(!!fullName.trim(), "Volledige naam", "Full name")
    need(/^\S+@\S+\.\S+$/.test(email.trim()), "E-mail", "Email")
    if (needsAccount) need(hasPendingPassword, "Wachtwoord (opnieuw beginnen via Registreren)", "Password (start again via Sign up)")
    need(!!phone.trim(), "Telefoonnummer", "Phone number")
    need(!!companyName.trim(), "Bedrijfsnaam / Handelsnaam", "Company name / trade name")
    need(/^\d{8}$/.test(kvkNumber), "KVK-nummer (8 cijfers)", "KVK number (8 digits)")
    need(!!bio.trim(), "Bio", "Bio")
    need(!!city.trim(), "Stad", "City")
    need(yearsExperience.trim() !== "" && Number(yearsExperience) <= 60, "Jaren ervaring (maximaal 60)", "Years of experience (at most 60)")
    need(Number(hourlyRate) > 0, "Tarief per uur", "Fee per hour")
    need(!!artistType, photo ? "Type" : "Artiesttype", photo ? "Type" : "Artist type")
    need(selectedGenres.length > 0, photo ? "Specialisaties" : "Muziekgenres", photo ? "Specialisations" : "Music genres")
    need(selectedEventTypes.length > 0, "Evenement types", "Event types")
    if (photo) {
      // No equipment package for photographers and videographers.
    } else if (artistType) {
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
      setArtistTypeError(
        photo
          ? L
            ? "Kies of je fotograaf, videograaf of allebei bent."
            : "Choose whether you are a photographer, a videographer or both."
          : L
            ? "Kies je artiest type."
            : "Choose your artist type.",
      )
      document.getElementById("artistType")?.focus()
      return
    }

    // A profile without genres, event types or a complete equipment package may not be submitted.
    const fail = (reason: string, elementId: string) => {
      if (!isEdit) trackUserTest("profile_error", { reason })
      document.getElementById(elementId)?.scrollIntoView({ behavior: "smooth", block: "center" })
    }
    if (selectedGenres.length === 0) {
      setGenresError(
        photo
          ? L
            ? "Kies minimaal één specialisatie."
            : "Choose at least one specialisation."
          : L
            ? "Kies minimaal één muziekgenre."
            : "Choose at least one music genre.",
      )
      return fail("genres_missing", "genres-field")
    }
    if (selectedEventTypes.length === 0) {
      setEventTypesError(L ? "Kies minimaal één evenement type." : "Choose at least one event type.")
      return fail("event_types_missing", "event-types-field")
    }
    const missingEquipment = photo ? [] : getMinimumEquipmentConfig().filter((config) => !isEquipmentComplete(config.id))
    if (missingEquipment.length > 0) {
      setEquipmentError(
        L
          ? `Vul het apparatuurpakket volledig in. Bij ${missingEquipment.length} van de ${getMinimumEquipmentConfig().length} onderdelen ontbreekt nog een naam, prijs, beschrijving of foto.`
          : `Complete the equipment package. ${missingEquipment.length} of ${getMinimumEquipmentConfig().length} items still lack a name, price, description or photo.`,
      )
      return fail("equipment_incomplete", "equipment-field")
    }

    const accountPassword = getPendingPassword()
    if (needsAccount && accountPassword.length < 8) {
      trackUserTest("signup_error", { reason: "password_missing" })
      setSaveError(L ? "Je wachtwoord ontbreekt. Begin opnieuw via Registreren." : "Your password is missing. Start again via Sign up.")
      return
    }

    setSaving(true)
    setSaveError("")
    setSaved(false)
    setKeptOnPage([])
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
                ? "Je account aanmaken is niet gelukt. Bestaat er al een account met dit e-mailadres, log dan in. Klopt het adres niet, begin dan opnieuw via Registreren."
                : "Creating your account failed. If an account with this email address already exists, log in. If the address is wrong, start again via Sign up."
              : L
                ? "Je account aanmaken is niet gelukt. Controleer je e-mailadres, of log in als je al een account hebt."
                : "Creating your account failed. Check your email address, or log in if you already have an account.",
          )
          return
        }
        trackUserTest("signup_completed", { account_type: "professional" })
        clearPendingPassword()
      }

      const minimumEquipmentUploaded = Object.fromEntries(
        await Promise.all(
          Object.entries(photo ? {} : minimumEquipment).map(async ([key, item]) => [
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
        setKeptOnPage(result.kept)
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

  const fieldBase =
    "w-full rounded-[10px] border border-[var(--rf-line)] bg-[var(--rf-field)] text-[var(--rf-text)] shadow-none placeholder:text-[var(--rf-placeholder)] dark:bg-[var(--rf-field)] focus-visible:border-[var(--rf-focus)] focus-visible:ring-2 focus-visible:ring-[var(--rf-focus)]/40 aria-invalid:border-[var(--rf-red-text)] read-only:cursor-not-allowed read-only:border-dashed read-only:border-[var(--rf-line-soft)] read-only:bg-[var(--rf-field-locked)] read-only:text-[var(--rf-muted)] dark:read-only:bg-[var(--rf-field-locked)]"
  const inputClassName = `${fieldBase} h-12 px-3.5 py-3 text-base`
  const textareaClassName = `${fieldBase} resize-none px-3.5 py-3 text-base`

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
  }

  return (
    <div className={`rf min-h-screen ${isEdit ? "bg-background" : "bg-[var(--rf-page)]"}`}>
      {/* Header */}
      {!isEdit && (
      <header className="border-b border-border bg-card px-3 py-2 sm:px-6 sm:py-3">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex min-h-11 shrink-0 items-center" aria-label={L ? "ARSI Events, naar home" : "ARSI Events, go to home"}>
            <Image
              src="/arsi-logo.png"
              alt=""
              width={120}
              height={60}
              className="h-8 w-auto sm:h-12 dark:hidden"
            />
            <Image
              src="/arsi-logo-dark.png"
              alt=""
              width={120}
              height={60}
              className="hidden h-8 w-auto sm:h-12 dark:block"
            />
          </Link>

          <div className="flex items-center gap-2">
            <LanguageSwitcher />

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="size-11 text-[var(--rf-text)] hover:bg-accent"
              title={!mounted || theme === "light" ? t.darkMode : t.lightMode}
              aria-label={!mounted || theme === "light" ? t.darkMode : t.lightMode}
            >
              {!mounted || theme === "light" ? (
                <Moon className="size-5" aria-hidden />
              ) : (
                <Sun className="size-5" aria-hidden />
              )}
            </Button>
          </div>
        </div>
      </header>
      )}

      <div className={isEdit ? "p-4 sm:p-6 md:p-8 lg:p-10" : "bg-[var(--rf-page)] p-4 sm:p-6 md:p-10"}>
        <div className="mx-auto max-w-4xl space-y-6 sm:space-y-8">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-red-700 flex-shrink-0">
              {photo ? (
                <Camera className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              ) : (
                <Music className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              )}
            </div>
            <div>
              <h1 className="text-balance text-2xl font-semibold tracking-tight text-[var(--rf-text)] sm:text-3xl">
                {isEdit
                  ? L
                    ? "Bewerk je profiel"
                    : "Edit your profile"
                  : L
                    ? photo
                      ? "Registreer als fotograaf of videograaf"
                      : "Registreer als professional"
                    : photo
                      ? "Register as a photographer or videographer"
                      : "Register as Professional"}
              </h1>
              <p className="text-sm sm:text-base text-[var(--rf-muted)]">
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
            {/* Without a photo the space stays low, so the form itself is in view. */}
            <div
              className={`relative w-full cursor-pointer overflow-hidden rounded-lg border-2 group ${
                bannerImage ? "aspect-[1.91/1] border-transparent" : "h-40 border-dashed border-border sm:h-48"
              }`}
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
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    bannerInputRef.current?.click()
                  }}
                  className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-md bg-muted p-4 text-[var(--rf-muted)] outline-none transition-colors group-hover:bg-accent group-hover:text-[var(--rf-text)] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--rf-focus)]"
                >
                  <Camera className="size-7 sm:size-8" aria-hidden />
                  <span className="text-sm font-medium sm:text-base">{L ? "Bannerfoto toevoegen" : "Add banner photo"}</span>
                </button>
              )}

              {bannerImage && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation()
                    bannerInputRef.current?.click()
                  }}
                  className="absolute right-2 top-2 z-10 min-h-11 bg-card/90 text-sm text-[var(--rf-text)] shadow-sm hover:bg-card sm:right-4 sm:top-4"
                >
                  <Camera className="mr-1 size-4" aria-hidden />
                  {L ? "Andere banner" : "Change banner"}
                </Button>
              )}
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
                        <Camera className="size-6 text-[var(--rf-muted)]" aria-hidden />
                        <p className="mt-1 text-xs text-[var(--rf-muted)] sm:text-sm">{L ? "Profielfoto" : "Photo"}</p>
                      </>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  aria-label={profileImage ? (L ? "Andere profielfoto kiezen" : "Change profile photo") : L ? "Profielfoto toevoegen" : "Add profile photo"}
                  onClick={(e) => {
                    e.stopPropagation()
                    profileInputRef.current?.click()
                  }}
                  className="absolute -bottom-1 -right-1 z-30 flex size-9 cursor-pointer items-center justify-center rounded-full border-2 border-card bg-red-700 text-white shadow-lg outline-none transition-colors hover:bg-red-600 focus-visible:ring-2 focus-visible:ring-[var(--rf-focus)]"
                >
                  <Camera className="size-4" aria-hidden />
                </button>
              </div>
            </div>
          </div>

          <p className="min-h-12 pl-32 text-xs text-[var(--rf-muted)] sm:min-h-16 sm:pl-44 sm:text-sm">
            {L ? "Foto's: maximaal 15 MB per stuk." : "Photos: at most 15 MB each."}
          </p>
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
              <p className="text-sm text-[var(--rf-muted)]">
                {L ? "Velden met " : "Fields marked "}
                <span className="text-[var(--rf-red-text)]">*</span>
                {L ? " zijn verplicht." : " are required."}
              </p>
              <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
                {/* Stage Name */}
                <div className="space-y-2">
                  <Label htmlFor="stageName" className="text-sm sm:text-base font-medium text-[var(--rf-text)]">
                    {photo ? (L ? "Profielnaam" : "Profile name") : L ? "Artiestennaam" : "Stage Name"}
                    <RequiredMark />
                  </Label>
                  <Input
                    id="stageName"
                    placeholder={
                      photo
                        ? L
                          ? "Bijvoorbeeld: Studio Voorbeeld"
                          : "For example: Studio Example"
                        : L
                          ? "Bijvoorbeeld: DJ Voorbeeld"
                          : "For example: DJ Example"
                    }
                    className={inputClassName}
                    value={stageName}
                    onChange={(e) => setStageName(e.target.value)}
                    required
                  />
                </div>

                {/* Full Name */}
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-sm sm:text-base font-medium text-[var(--rf-text)]">
                    {L ? "Volledige naam" : "Full Name"}
                    <RequiredMark />
                  </Label>
                  <div className="relative">
                  <Input
                    id="fullName"
                    placeholder={L ? "Voor- en achternaam" : "First and last name"}
                    className={inputClassName}
                    value={fullName}
                    onChange={(e) => setFullName(lettersOnly(e.target.value))}
                    readOnly={lockSignupFields}
                    required
                  />
                  {lockSignupFields && <Lock aria-hidden="true" className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-[var(--rf-muted)]" />}
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm sm:text-base font-medium text-[var(--rf-text)]">
                    {L ? "E-mail" : "Email"}
                    {needsAccount && <RequiredMark />}
                  </Label>
                  <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    className={inputClassName}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    readOnly={!needsAccount || lockSignupFields}
                    required
                    autoComplete="email"
                    aria-describedby="email-help"
                  />
                  {(lockSignupFields || !needsAccount) && <Lock aria-hidden="true" className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-[var(--rf-muted)]" />}
                  </div>
                  <p id="email-help" className="text-xs sm:text-sm text-[var(--rf-muted)]">
                    {lockSignupFields
                      ? L
                        ? "Hiermee log je straks in. Naam, e-mail en telefoonnummer heb je bij het aanmelden opgegeven en zijn hier niet aan te passen. Typfout? Begin opnieuw via Registreren."
                        : "You will use this to log in. Name, email and phone number were entered at sign-up and cannot be changed here. Typo? Start again via Sign up."
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
                  <div role="alert" className="rounded-lg border border-[var(--rf-red-text)] p-3 text-sm text-[var(--rf-text)] space-y-2">
                    <p>
                      {L
                        ? "Je wachtwoord staat niet meer in dit scherm (bijvoorbeeld na verversen). Om veiligheidsredenen bewaren we dat niet. Begin opnieuw via Registreren; dat kost een halve minuut."
                        : "Your password is no longer in this screen (for example after a refresh). For security we do not store it. Start again via Sign up; it takes half a minute."}
                    </p>
                    <button
                      type="button"
                      className="inline-flex min-h-11 items-center font-medium underline underline-offset-4"
                      onClick={() => {
                        try { sessionStorage.removeItem("professionalSignupData") } catch {}
                        clearPendingPassword()
                        window.location.href = "/"
                      }}
                    >
                      {L ? "Opnieuw beginnen" : "Start again"}
                    </button>
                  </div>
                )}

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm sm:text-base font-medium text-[var(--rf-text)]">
                    {L ? "Telefoonnummer" : "Phone number"}
                    <RequiredMark />
                  </Label>
                  <div className="relative">
                  <Input
                    id="phone"
                    type="tel"
                    className={inputClassName}
                    inputMode="tel"
                    value={phone}
                    onChange={(e) => setPhone(phoneChars(e.target.value))}
                    readOnly={lockSignupFields}
                    required
                  />
                  {lockSignupFields && <Lock aria-hidden="true" className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-[var(--rf-muted)]" />}
                  </div>
                </div>

                {/* Company Name */}
                <div className="space-y-2">
                  <Label htmlFor="companyName" className="text-sm sm:text-base font-medium text-[var(--rf-text)]">
                    {L ? "Bedrijfsnaam / Handelsnaam" : "Company Name / Trade Name"}
                    <RequiredMark />
                  </Label>
                  <Input
                    id="companyName"
                    placeholder={L ? "Bedrijfsnaam" : "Company name"}
                    className={inputClassName}
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required
                  />
                </div>

                {/* KVK Number */}
                <div className="space-y-2">
                  <Label htmlFor="kvkNumber" className="text-sm sm:text-base font-medium text-[var(--rf-text)]">
                    {L ? "KVK-nummer" : "Chamber of Commerce (KVK) number"}
                    <RequiredMark />
                  </Label>
                  <Input
                    id="kvkNumber"
                    inputMode="numeric"
                    placeholder={L ? "8 cijfers" : "8 digits"}
                    className={inputClassName}
                    value={kvkNumber}
                    onChange={handleKvkChange}
                    maxLength={8}
                    aria-invalid={!!kvkError}
                    aria-describedby="kvkNumber-error"
                    required
                  />
                  {kvkError && (
                    <p id="kvkNumber-error" className="text-sm text-[var(--rf-red-text)]">
                      {kvkError}
                    </p>
                  )}
                </div>

                {/* VAT Number */}
                <div className="space-y-2">
                  <Label htmlFor="vatNumber" className="text-sm sm:text-base font-medium text-[var(--rf-text)]">
                    {L ? "BTW-identificatienummer" : "VAT identification number"}{" "}
                    <span className="text-[var(--rf-muted)]">{L ? "(optioneel)" : "(optional)"}</span>
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

              {isEdit && (
                <p className="text-sm text-[var(--rf-muted)]">
                  {L
                    ? "Deze gegevens vullen alleen lege velden van je factuurgegevens. De gegevens op je factuur (ook IBAN en adres) pas je aan bij het indienen van een factuur, via "
                    : "These details only fill empty fields of your invoice details. You change the details on your invoice (also IBAN and address) when you submit an invoice, via "}
                  <Link href="/dashboard/completed-bookings" className="text-[var(--rf-text)] underline underline-offset-4">
                    {L ? "Afgeronde boekingen" : "Completed bookings"}
                  </Link>
                  .
                </p>
              )}

              {/* Bio - Full width */}
              <div className="space-y-2">
                <Label htmlFor="bio" className="text-sm sm:text-base font-medium text-[var(--rf-text)]">
                  Bio
                  <RequiredMark />
                </Label>
                <Textarea
                  id="bio"
                  placeholder={
                    L
                      ? "Vertel over jezelf, je stijl en je ervaring..."
                      : "Tell us about yourself, your style and your experience..."
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
                  <Label htmlFor="experience" className="text-sm sm:text-base font-medium text-[var(--rf-text)]">
                    {L ? "Jaren ervaring" : "Years of Experience"}
                    <RequiredMark />
                  </Label>
                  <NumericInput
                    id="experience"
                    maxLength={2}
                    value={yearsExperience}
                    onValueChange={setYearsExperience}
                    className={inputClassName}
                    required
                    aria-invalid={Number(yearsExperience) > 60}
                    aria-describedby={Number(yearsExperience) > 60 ? "experience-help" : undefined}
                  />
                  {Number(yearsExperience) > 60 && (
                    <p id="experience-help" role="alert" className="text-xs sm:text-sm text-[var(--rf-red-text)]">
                      {L ? "Maximaal 60 jaar ervaring." : "At most 60 years of experience."}
                    </p>
                  )}
                </div>

                {/* Fee per hour */}
                <div className="space-y-2">
                  <Label htmlFor="fee" className="text-sm sm:text-base font-medium text-[var(--rf-text)]">
                    {L ? "Tarief (€ per uur)" : "Fee (€ per hour)"}
                    <RequiredMark />
                  </Label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--rf-muted)]">€</span>
                    <NumericInput
                      id="fee"
                      allowDecimal
                      value={hourlyRate}
                      onValueChange={setHourlyRate}
                      className={`${inputClassName} pl-8 pr-4`}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Minimum and Maximum Booking Hours */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-base sm:text-lg font-bold text-[var(--rf-text)]">
                    {L ? "Stel je boekingsuren bereik in" : "Set Your Booking Hours Range"}
                  </h3>
                  <p className="text-sm text-[var(--rf-muted)] flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[var(--rf-line-soft)] text-[var(--rf-text)] text-xs font-bold flex-shrink-0">
                      ↔
                    </span>
                    {L
                      ? "Sleep de handvatten of kies hieronder je minimum en maximum boekingsuren"
                      : "Drag the handles or choose your minimum and maximum booking hours below"}
                  </p>
                </div>

                {/* Booking Hours Slider */}
                <div className="rounded-xl border border-[var(--rf-line-soft)] bg-[var(--rf-card)] px-4 py-5 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[var(--rf-focus)]">
                  <DualRangeSlider
                    min={1}
                    max={8}
                    minValue={minHours}
                    maxValue={maxHours}
                    onMinChange={setMinHours}
                    onMaxChange={setMaxHours}
                    minLabel={L ? "Minimum boekingsuren" : "Minimum booking hours"}
                    maxLabel={L ? "Maximum boekingsuren" : "Maximum booking hours"}
                  />
                </div>

                {/* Input fields below slider with new styling */}
                <div className="grid gap-4 sm:gap-6 grid-cols-2 md:grid-cols-2">
                  {/* Minimum Booking Hours */}
                  <div className="space-y-2">
                    <Label htmlFor="minHours" className="text-sm sm:text-base font-medium text-[var(--rf-text)]">
                      {L ? "Minimum boekingsuren" : "Minimum Booking Hours"}
                    </Label>
                    <select
                      id="minHours"
                      value={minHours}
                      onChange={(event) => setMinHours(Number(event.target.value))}
                      className="h-12 w-full rounded-[10px] border border-[var(--rf-line)] bg-[var(--rf-field)] px-4 text-base font-bold text-[var(--rf-text)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--rf-focus)]"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].filter((option) => option <= maxHours).map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Maximum Booking Hours */}
                  <div className="space-y-2">
                    <Label htmlFor="maxHours" className="text-sm sm:text-base font-medium text-[var(--rf-text)] ">
                      {L ? "Maximum boekingsuren" : "Maximum Booking Hours"}
                    </Label>
                    <select
                      id="maxHours"
                      value={maxHours}
                      onChange={(event) => setMaxHours(Number(event.target.value))}
                      className="h-12 w-full rounded-[10px] border border-[var(--rf-line)] bg-[var(--rf-field)] px-4 text-base font-bold text-[var(--rf-text)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--rf-focus)]"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].filter((option) => option >= minHours).map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
                {/* City */}
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-sm sm:text-base font-medium text-[var(--rf-text)]">
                    {L ? "Stad" : "City"}
                    <RequiredMark />
                  </Label>
                  <Input
                    id="city"
                    placeholder={L ? "Bijvoorbeeld: Amsterdam" : "For example: Amsterdam"}
                    className={inputClassName}
                    value={city}
                    onChange={(e) => setCity(lettersOnly(e.target.value))}
                    required
                  />
                </div>

                {/* Range (km) */}
                <div className="space-y-2">
                  <Label htmlFor="range" className="text-sm sm:text-base font-medium text-[var(--rf-text)]">
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
                <Label id="artistType-label" className="text-sm sm:text-base font-medium text-[var(--rf-text)]">
                  {photo ? "Type" : L ? "Artiesttype" : "Artist type"}
                  <RequiredMark />
                </Label>
                <ComboSelect
                  id="artistType"
                  labelledBy="artistType-label"
                  describedBy={artistTypeError ? "artistType-error" : undefined}
                  nl={L}
                  value={artistType}
                  onChange={handleArtistTypeChange}
                  invalid={!!artistTypeError}
                  placeholder={
                    photo
                      ? L
                        ? "Fotograaf, videograaf of allebei"
                        : "Photographer, videographer or both"
                      : L
                        ? "Selecteer je artiesttype"
                        : "Select your artist type"
                  }
                  searchPlaceholder={L ? "Zoek een type..." : "Search a type..."}
                  groups={[
                    {
                      options: (photo ? PHOTO_VIDEO_TYPES : ARTIST_TYPES).map((type) => ({
                        value: type.value,
                        label: L ? type.nl : type.en,
                        description: L ? type.descNl : type.descEn,
                        icon: photo ? <Camera className="size-[18px]" /> : <Music className="size-[18px]" />,
                      })),
                    },
                  ]}
                />
                {artistTypeError && (
                  <p id="artistType-error" role="alert" className="text-sm text-[var(--rf-red-text)]">
                    {artistTypeError}
                  </p>
                )}
                <p className="text-xs sm:text-sm text-[var(--rf-muted)]">
                  {L
                    ? photo
                      ? "Dit helpt klanten je te vinden op basis van wat je vastlegt"
                      : "Dit helpt klanten je te vinden op basis van het type optreden dat je aanbiedt"
                    : photo
                      ? "This helps clients find you based on what you capture"
                      : "This helps clients find you based on the type of performance you offer"}
                </p>
              </div>

              {artistType && (
                <div id="genres-field" className="space-y-2">
                  <Label id="genres-label" className="text-sm sm:text-base font-medium text-[var(--rf-text)]">
                    {photo ? (L ? "Specialisaties" : "Specialisations") : L ? "Muziekgenres" : "Music Genres"}
                    <RequiredMark />
                  </Label>
                  {genresError && selectedGenres.length === 0 && (
                    <p role="alert" className="text-sm text-[var(--rf-red-text)]">
                      {genresError}
                    </p>
                  )}
                  <ComboSelect
                    id="genres"
                    labelledBy="genres-label"
                    multiple
                    nl={L}
                    value={selectedGenres}
                    onChange={setSelectedGenres}
                    invalid={!!genresError && selectedGenres.length === 0}
                    placeholder={
                      photo ? (L ? "Selecteer specialisaties" : "Select specialisations") : L ? "Selecteer genres" : "Select genres"
                    }
                    searchPlaceholder={
                      photo ? (L ? "Zoek een specialisatie..." : "Search a specialisation...") : L ? "Zoek een genre..." : "Search a genre..."
                    }
                    labelFor={(value) => genreLabel(value, L)}
                    groups={(photo ? PHOTO_SPECIALTY_GROUPS : GENRE_GROUPS).map((group) => ({
                      label: L ? group.nl : group.en,
                      options: group.options.map((option) => ({ value: option.value, label: L ? option.nl : option.en })),
                    }))}
                  />
                </div>
              )}

              {/* Event Types */}
              {artistType && (
                <div id="event-types-field" className="space-y-2">
                  <Label id="event-types-label" className="text-sm sm:text-base font-medium text-[var(--rf-text)]">
                    {L ? "Evenement types" : "Event Types"}
                    <RequiredMark />
                  </Label>
                  {eventTypesError && selectedEventTypes.length === 0 && (
                    <p role="alert" className="text-sm text-[var(--rf-red-text)]">
                      {eventTypesError}
                    </p>
                  )}
                  <ComboSelect
                    id="event-types"
                    labelledBy="event-types-label"
                    multiple
                    nl={L}
                    value={selectedEventTypes}
                    onChange={setSelectedEventTypes}
                    invalid={!!eventTypesError && selectedEventTypes.length === 0}
                    placeholder={L ? "Selecteer evenement types" : "Select event types"}
                    searchPlaceholder={L ? "Zoek een evenement type..." : "Search an event type..."}
                    groups={EVENT_TYPE_GROUPS.map((group) => ({
                      label: L ? group.nl : group.en,
                      options: group.options.map((option) => ({ value: option.value, label: L ? option.nl : option.en })),
                    }))}
                  />
                </div>
              )}

              {/* Package Equipment Section */}
              {artistType && !photo && (
                <div id="equipment-field" className="rounded-[14px] border border-[var(--rf-line-soft)] bg-[var(--rf-card)] p-4 sm:p-6 space-y-4">
                  <h2 className="text-xl sm:text-2xl font-bold text-[var(--rf-text)]">
                    {L ? "Pakket apparatuur verhuur" : "Package Equipment Rental"}
                    <RequiredMark />
                  </h2>
                  <p className="text-sm text-[var(--rf-muted)]">
                    {L
                      ? "Verplicht: vul elk onderdeel in met naam, prijs, beschrijving en foto."
                      : "Required: complete every item with a name, price, description and photo."}
                  </p>
                  {equipmentError && getMinimumEquipmentConfig().some((config) => !isEquipmentComplete(config.id)) && (
                    <p role="alert" className="text-sm text-[var(--rf-red-text)]">
                      {equipmentError}
                    </p>
                  )}
                  <p className="text-sm sm:text-base leading-relaxed text-[var(--rf-muted)]">{getPackageDescription()}</p>

                  <div className="space-y-3">
                    <h3 className="text-sm sm:text-base font-semibold text-[var(--rf-text)]">
                      {L ? "Apparatuur die bij dit pakket hoort:" : "Equipment that belongs to this package:"}
                    </h3>
                    <ul className="list-disc space-y-1.5 pl-5 text-sm sm:text-base leading-relaxed text-[var(--rf-muted)]">
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
                          className={`rounded-xl border p-3 sm:p-4 bg-[var(--rf-page)] ${
                            isComplete
                              ? "border-[var(--rf-ok)]"
                              : isAccessible
                                ? "border-[var(--rf-line)]"
                                : "border-dashed border-[var(--rf-line-soft)]"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 mb-3">
                            <div
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${isComplete ? "border-[#15803d] bg-[#15803d] text-white" : "border-[var(--rf-line-soft)] bg-[var(--rf-field)] text-[var(--rf-muted)]"}`}
                            >
                              {isComplete ? <Check className="h-4 w-4" aria-hidden="true" /> : <IconComponent className="h-4 w-4" aria-hidden="true" />}
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-sm font-semibold text-[var(--rf-text)]">{config.name}</h4>
                              <p className="text-xs text-[var(--rf-muted)]">{config.description}</p>
                            </div>
                            <span
                              className={`ml-auto shrink-0 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-bold ${
                                isComplete
                                  ? "border-[var(--rf-ok)] text-[var(--rf-ok)]"
                                  : isAccessible
                                    ? "border-[var(--rf-red-text)] text-[var(--rf-red-text)]"
                                    : "border-[var(--rf-line-soft)] text-[var(--rf-muted)]"
                              }`}
                            >
                              {isComplete ? (L ? "Compleet" : "Complete") : isAccessible ? (L ? "Nu invullen" : "Fill in now") : L ? "Wacht" : "Waiting"}
                            </span>
                          </div>

                          {isAccessible && (
                            <div className="space-y-3">
                              <EquipmentFields
                                value={equipment ?? {}}
                                onChange={(patch) => patchEquipmentItem(config.id, patch)}
                                namePlaceholder={config.placeholder}
                                photoId={`equipment-file-${config.id}`}
                                nl={L}
                                required
                              />
                              {!isComplete && (
                                <p aria-live="polite" className="text-xs text-[var(--rf-red-text)]">
                                  {(L ? "Nog nodig voor dit onderdeel: " : "Still needed for this item: ") +
                                    [
                                      !equipment?.name?.trim() && (L ? "naam" : "name"),
                                      !equipment?.price && (L ? "prijs" : "price"),
                                      !equipment?.description?.trim() && (L ? "beschrijving" : "description"),
                                      !equipment?.image && (L ? "foto" : "photo"),
                                    ]
                                      .filter(Boolean)
                                      .join(", ")}
                                </p>
                              )}
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
                          {!isAccessible && (
                            <p className="text-xs text-[var(--rf-muted)]">
                              {L
                                ? `Vul eerst "${getMinimumEquipmentConfig()[index - 1]?.name}" helemaal in: naam, prijs, beschrijving en foto.`
                                : `First complete "${getMinimumEquipmentConfig()[index - 1]?.name}": name, price, description and photo.`}
                            </p>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  <div
                    aria-live="polite"
                    className="rounded-xl border border-[var(--rf-line)] bg-[var(--rf-page)] p-3 sm:p-4 space-y-1.5"
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-sm sm:text-base font-semibold text-[var(--rf-text)]">
                        {L ? "Totaalprijs pakket per dag" : "Package total per day"}
                      </span>
                      <span className="text-lg sm:text-xl font-bold text-[var(--rf-text)]">{formatEuro(packageTotal)}</span>
                    </div>
                    <p className="text-xs sm:text-sm text-[var(--rf-muted)]">
                      {L
                        ? `${completeCount} van de ${getMinimumEquipmentConfig().length} onderdelen ingevuld${packageExtraCount > 0 ? `, plus ${packageExtraCount} extra bij het pakket` : ""}. Dit bedrag zien klanten op je profiel.`
                        : `${completeCount} of ${getMinimumEquipmentConfig().length} items completed${packageExtraCount > 0 ? `, plus ${packageExtraCount} extra in the package` : ""}. Clients see this amount on your profile.`}
                    </p>
                  </div>
                </div>
              )}

              {/* Extra Equipment Section */}
              {artistType && (
                <div className="rounded-[14px] border border-[var(--rf-line-soft)] bg-[var(--rf-card)] p-4 sm:p-6 space-y-4">
                  <h2 className="text-xl sm:text-2xl font-bold text-[var(--rf-text)]">
                    {photo
                      ? L
                        ? "Extra's (optioneel)"
                        : "Extras (Optional)"
                      : L
                        ? "Extra apparatuur (optioneel)"
                        : "Extra Equipment (Optional)"}
                  </h2>
                  <p className="text-sm sm:text-base leading-relaxed text-[var(--rf-muted)]">
                    {photo
                      ? L
                        ? "Voeg extra's toe die klanten erbij kunnen boeken, zoals een tweede fotograaf, drone-opnames, een fotoalbum of een same-day edit."
                        : "Add extras clients can book on top, such as a second shooter, drone footage, a photo album or a same-day edit."
                      : L
                        ? "Voeg extra apparatuur toe die je aanbiedt als optionele extra's voor klanten."
                        : "Add any additional equipment you offer as optional extras for clients."}
                  </p>

                  <AdditionalEquipment
                    items={extraEquipment.filter((item) => !item.category)}
                    onAdd={(item) => setExtraEquipment((prev) => [...prev, item])}
                    onUpdate={updateExtraEquipment}
                    onRemove={removeExtraEquipment}
                    nl={L}
                    extras={photo}
                  />
                </div>
              )}

              {cropDialog}

              {/* Social Media Links */}
              <div className="space-y-4">
                <h2 className="text-xl sm:text-2xl font-bold text-[var(--rf-text)]">
                  {L ? "Social media & links" : "Social Media & Links"}
                </h2>

                {socialMediaLinks.length > 0 && (
                  <div className="space-y-3">
                    {socialMediaLinks.map((link) => (
                      <div
                        key={link.id}
                        className="rounded-xl border border-[var(--rf-line-soft)] bg-[var(--rf-card)] p-3 sm:p-4"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-sm text-[var(--rf-text)]">{getPlatformName(link.platform)}</p>
                            <p className="text-xs text-[var(--rf-muted)] truncate max-w-xs">{link.url}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeSocialMedia(link.id)}
                            aria-label={L ? `Verwijder ${getPlatformName(link.platform)}` : `Remove ${getPlatformName(link.platform)}`}
                            className="ml-2 grid size-11 flex-shrink-0 place-items-center rounded-md text-[var(--rf-muted)] transition-colors hover:text-[var(--rf-red-text)]"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-3">
                  <ComboSelect
                    id="social-platform"
                    nl={L}
                    value={currentSocialMedia.platform}
                    onChange={(platform) => setCurrentSocialMedia({ ...currentSocialMedia, platform })}
                    placeholder={L ? "Selecteer platform" : "Select platform"}
                    searchPlaceholder={L ? "Zoek een platform..." : "Search a platform..."}
                    groups={[{ options: SOCIAL_PLATFORMS }]}
                  />

                  <Input
                    type="url"
                    aria-label={L ? "Link naar je profiel" : "Link to your profile"}
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
                  className="h-11 w-full rounded-lg border-[var(--rf-line)] bg-[var(--rf-field)] text-[var(--rf-text)] hover:bg-[var(--rf-line-soft)] dark:bg-[var(--rf-field)] dark:hover:bg-[var(--rf-line-soft)] sm:w-auto"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {L ? "Social media toevoegen" : "Add social media"}
                </Button>
              </div>

              {/* Register Button */}
              <Button
                type="submit"
                className="h-12 w-full rounded-[10px] bg-red-700 text-base font-semibold text-white hover:bg-red-600 disabled:bg-[var(--rf-track)] disabled:text-[var(--rf-muted)] disabled:opacity-100"
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
                <div id="missing-fields" className="rounded-xl border border-[var(--rf-line-soft)] bg-[var(--rf-card)] p-3.5 text-sm">
                  <p className="font-medium text-[var(--rf-text)]">
                    {L
                      ? `Nog ${missingFields.length} ${missingFields.length === 1 ? "onderdeel" : "onderdelen"} invullen voordat je kunt ${isEdit ? "opslaan" : "registreren"}:`
                      : `${missingFields.length} ${missingFields.length === 1 ? "item" : "items"} left before you can ${isEdit ? "save" : "register"}:`}
                  </p>
                  <ul className="mt-1 list-disc pl-5 text-[var(--rf-muted)]">
                    {missingFields.map((field) => (
                      <li key={field}>{field}</li>
                    ))}
                  </ul>
                </div>
              )}
              {saveError && (
                <p role="alert" className="text-center text-sm text-[var(--rf-red-text)]">
                  {saveError}
                </p>
              )}
              {isEdit && saved && (
                <p role="status" className="text-center text-sm text-green-700 dark:text-green-400">
                  {L ? "Je profiel is opgeslagen" : "Your profile has been saved"}
                </p>
              )}
              {isEdit && saved && keptOnPage.length > 0 && (
                <p role="status" className="text-center text-sm text-[var(--rf-muted)]">
                  {keptOnPageText(keptOnPage, photo, L)}{" "}
                  <Link href="/dashboard/my-page" className="text-[var(--rf-text)] underline underline-offset-4">
                    {L ? "Open Mijn website" : "Open My website"}
                  </Link>
                </p>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
