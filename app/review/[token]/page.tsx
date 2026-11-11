import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getReviewInvite } from "@/app/actions/reviews"
import { ReviewForm } from "@/components/reviews/review-form"

export const metadata: Metadata = {
  title: "Review schrijven | ARSI Events",
  robots: { index: false },
}

export default async function ReviewPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const invite = await getReviewInvite(token)
  if (!invite) notFound()
  return <ReviewForm invite={invite} />
}
