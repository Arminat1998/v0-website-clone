import { mediaUrl } from "@/lib/artist-page-types"

export type EquipmentCategory = "lighting" | "sound"

export interface ProfileEquipmentItem {
  id: string
  name: string
  price: string
  description: string
  image?: string
  category?: EquipmentCategory
}

export interface ProfileSocialLink {
  id: string
  platform: string
  url: string
}

export interface ProfessionalProfileData {
  stageName: string
  fullName: string
  email: string
  phone: string
  companyName: string
  kvkNumber: string
  vatNumber: string
  bio: string
  yearsExperience: number
  hourlyRate: number
  minHours: number
  maxHours: number
  city: string
  rangeKm: number
  artistType: string
  genres: string[]
  eventTypes: string[]
  socials: ProfileSocialLink[]
  minimumEquipment: Record<string, ProfileEquipmentItem>
  extraEquipment: ProfileEquipmentItem[]
  avatarPath: string | null
  bannerPath: string | null
}

/** Images are either a fresh in-browser data URL or a stored blob pathname. */
export function imageSrc(value: string | null | undefined) {
  if (!value) return ""
  if (value.startsWith("data:") || value.startsWith("blob:") || value.startsWith("/")) return value
  return mediaUrl(value)
}
