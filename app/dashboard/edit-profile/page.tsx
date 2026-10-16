import { DashboardLayout } from "@/components/dashboard-layout"
import { ProfessionalProfileForm } from "@/components/professional-profile-form"

export default function EditProfilePage() {
  return (
    <DashboardLayout>
      <ProfessionalProfileForm mode="edit" />
    </DashboardLayout>
  )
}
