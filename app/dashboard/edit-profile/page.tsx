import { DashboardLayout } from "@/components/dashboard-layout"
import { ProfessionalProfileForm } from "@/components/professional-profile-form"
import { ProfileLinks } from "@/components/profile-links"
import { getProfessionalArtistPath } from "@/lib/professional-artist"
import { getProfessionalProfile } from "@/lib/professional-profile"
import type { ProfessionalProfileData } from "@/lib/professional-profile-types"
import { requireProfessionalUser } from "@/lib/session"

export const dynamic = "force-dynamic"

export default async function EditProfilePage() {
  const account = await requireProfessionalUser()
  const stored = await getProfessionalProfile(account.id, account)

  // First visit: prefill from the account so nothing the user typed at sign-up is lost.
  const initialProfile: ProfessionalProfileData = stored ?? {
    stageName: account.name,
    fullName: account.name,
    email: account.email,
    phone: account.phone ?? "",
    companyName: "",
    kvkNumber: "",
    vatNumber: "",
    bio: "",
    yearsExperience: 0,
    hourlyRate: 0,
    minHours: 1,
    maxHours: 8,
    city: "",
    rangeKm: 100,
    artistType: "",
    genres: [],
    eventTypes: [],
    socials: [],
    minimumEquipment: {},
    extraEquipment: [],
    avatarPath: null,
    bannerPath: null,
  }

  return (
    <DashboardLayout>
      <div className="px-4 pt-16 sm:px-6 sm:pt-16 md:px-8 lg:px-10">
        <ProfileLinks current="profile" publicPath={getProfessionalArtistPath(account)} />
      </div>
      <ProfessionalProfileForm mode="edit" initialProfile={initialProfile} />
    </DashboardLayout>
  )
}
