import { DashboardLayout } from "@/components/dashboard-layout"
import { ProfessionalReviews } from "@/components/reviews/professional-reviews"
import { getProfessionalReviews } from "@/app/actions/reviews"
import { requireProfessionalUser } from "@/lib/session"

export default async function ReviewsPage() {
  await requireProfessionalUser()
  return (
    <DashboardLayout>
      <ProfessionalReviews reviews={await getProfessionalReviews()} />
    </DashboardLayout>
  )
}
