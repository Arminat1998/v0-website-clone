"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Star } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

interface Review {
  id: number
  clientName: string
  rating: number
  reviewText: string
  reply: string
  hasReplied: boolean
}

const initialReviews: Review[] = [
  {
    id: 1,
    clientName: "Lisa",
    rating: 4,
    reviewText: "Top DJ, maar de microfoon was [verboden woord].",
    reply: "",
    hasReplied: false,
  },
  {
    id: 2,
    clientName: "Mark",
    rating: 5,
    reviewText: "Fantastische avond, iedereen was los!",
    reply: "",
    hasReplied: false,
  },
  {
    id: 3,
    clientName: "Julia",
    rating: 2,
    reviewText: "Waardeloze communicatie, echt bagger.",
    reply: "",
    hasReplied: false,
  },
  {
    id: 4,
    clientName: "Thomas",
    rating: 5,
    reviewText: "Geweldige sfeer en muziek. Aanrader!",
    reply: "",
    hasReplied: false,
  },
  {
    id: 5,
    clientName: "Emma",
    rating: 3,
    reviewText: "Goed, maar had verwacht dat je meer top 40 zou draaien.",
    reply: "",
    hasReplied: false,
  },
]

export default function ReviewsPage() {
  const { t } = useLanguage()
  const [reviews, setReviews] = useState<Review[]>(initialReviews)
  const [replyTexts, setReplyTexts] = useState<{ [key: number]: string }>({})

  const handleReplyChange = (reviewId: number, text: string) => {
    setReplyTexts((prev) => ({ ...prev, [reviewId]: text }))
  }

  const handleSubmitReply = (reviewId: number) => {
    const replyText = replyTexts[reviewId]
    if (!replyText || replyText.trim() === "") return

    setReviews((prev) =>
      prev.map((review) =>
        review.id === reviewId
          ? { ...review, reply: replyText, hasReplied: true }
          : review
      )
    )
    setReplyTexts((prev) => ({ ...prev, [reviewId]: "" }))
    
    console.log("[v0] Reply submitted for review", reviewId, ":", replyText)
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "fill-gray-300 text-gray-300 dark:fill-gray-600 dark:text-gray-600"
            }`}
          />
        ))}
      </div>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 md:p-8 lg:p-10 bg-background min-h-screen">
        {/* Header */}
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-4 sm:mb-6 md:mb-8">
          {t.reviewsTitle}
        </h1>

        {/* Reviews List */}
        <div className="space-y-0">
          {reviews.map((review, index) => (
            <div
              key={review.id}
              className={`bg-card p-4 sm:p-6 ${
                index !== reviews.length - 1 ? "border-b border-border" : ""
              }`}
            >
              {/* Client Name */}
              <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">
                {review.clientName}
              </h3>

              {/* Star Rating */}
              <div className="mb-3">{renderStars(review.rating)}</div>

              {/* Review Text */}
              <p className="text-sm sm:text-base text-foreground mb-4">{review.reviewText}</p>

              {/* Reply Section */}
              {review.hasReplied ? (
                <div className="bg-blue-500/10 border-l-4 border-blue-500 p-3 sm:p-4 rounded">
                  <p className="text-xs sm:text-sm font-semibold text-foreground mb-1">{t.yourReply}:</p>
                  <p className="text-xs sm:text-sm text-foreground">{review.reply}</p>
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  <textarea
                    value={replyTexts[review.id] || ""}
                    onChange={(e) => handleReplyChange(review.id, e.target.value)}
                    placeholder={t.replyPlaceholder}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-background text-foreground"
                    rows={3}
                  />
                  <button
                    type="button"
                    onClick={() => handleSubmitReply(review.id)}
                    disabled={!replyTexts[review.id] || replyTexts[review.id].trim() === ""}
                    className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg font-medium text-xs sm:text-sm transition-colors touch-manipulation ${
                      replyTexts[review.id] && replyTexts[review.id].trim() !== ""
                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                        : "bg-muted text-muted-foreground cursor-not-allowed"
                    }`}
                  >
                    {t.sendReply}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Empty State */}
        {reviews.length === 0 && (
          <div className="bg-card rounded-lg border border-border p-8 sm:p-12 text-center">
            <p className="text-muted-foreground text-base sm:text-lg">Nog geen reviews ontvangen.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
