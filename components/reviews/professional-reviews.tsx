"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Star } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { Button } from "@/components/ui/button"
import { Stars } from "@/components/account/my-reviews"
import { replyToReview, type ProfessionalReview } from "@/app/actions/reviews"

export function ProfessionalReviews({ reviews }: { reviews: ProfessionalReview[] }) {
  const nl = useLanguage().language === "nl"
  const locale = nl ? "nl-NL" : "en-GB"
  const average = reviews.length
    ? reviews.reduce((sum, r) => sum + (r.rating ?? 0), 0) / reviews.length
    : 0

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold">Reviews</h1>
          <p className="text-sm text-muted-foreground">
            {nl
              ? "Klanten ontvangen na afloop van een voltooide boeking automatisch een reviewlink."
              : "Customers automatically receive a review link after a completed booking."}
          </p>
        </div>
        {reviews.length > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <Stars rating={Math.round(average)} />
            <span className="font-semibold">{average.toFixed(1)}</span>
            <span className="text-muted-foreground">({reviews.length})</span>
          </div>
        )}
      </header>

      {reviews.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border p-10 text-center">
          <Star className="size-6 text-muted-foreground" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">
            {nl ? "Je hebt nog geen reviews ontvangen." : "You haven't received any reviews yet."}
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {reviews.map((r) => (
            <ReviewItem key={r.id} review={r} nl={nl} locale={locale} />
          ))}
        </ul>
      )}
    </div>
  )
}

function ReviewItem({ review: r, nl, locale }: { review: ProfessionalReview; nl: boolean; locale: string }) {
  const router = useRouter()
  const [reply, setReply] = useState("")
  const [error, setError] = useState("")
  const [pending, startTransition] = useTransition()

  return (
    <li className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 text-card-foreground">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-col">
          <span className="font-semibold">{r.customerName}</span>
          <span className="text-xs text-muted-foreground">
            {r.eventName} · {new Date(r.submittedAt).toLocaleDateString(locale)}
          </span>
        </div>
        <Stars rating={r.rating ?? 0} />
      </div>
      {r.comment && <p className="text-sm leading-relaxed text-pretty">{r.comment}</p>}

      {r.reply ? (
        <div className="flex flex-col gap-1 rounded-lg bg-muted p-3 text-sm">
          <span className="text-xs font-medium text-muted-foreground">{nl ? "Jouw reactie" : "Your reply"}</span>
          <p className="leading-relaxed">{r.reply}</p>
        </div>
      ) : (
        <form
          className="flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            setError("")
            startTransition(async () => {
              const res = await replyToReview(r.id, reply)
              if (!res.ok) setError(nl ? "Reactie kon niet worden opgeslagen." : "Reply could not be saved.")
              else router.refresh()
            })
          }}
        >
          <label htmlFor={`reply-${r.id}`} className="sr-only">
            {nl ? "Reageer op deze review" : "Reply to this review"}
          </label>
          <textarea
            id={`reply-${r.id}`}
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            maxLength={1000}
            rows={2}
            placeholder={nl ? "Schrijf een reactie aan de klant…" : "Write a reply to the client…"}
            className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
          <Button type="submit" size="sm" className="self-end" disabled={pending || !reply.trim()}>
            {nl ? "Reageren" : "Reply"}
          </Button>
        </form>
      )}
    </li>
  )
}
