"use client"

import { useState, useTransition } from "react"
import Image from "next/image"
import Link from "next/link"
import { CheckCircle2, Star } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Stars } from "@/components/account/my-reviews"
import { submitReview, type ReviewInvite } from "@/app/actions/reviews"
import { cn } from "@/lib/utils"

export function ReviewForm({ invite }: { invite: ReviewInvite }) {
  const nl = useLanguage().language === "nl"
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState("")
  const [error, setError] = useState("")
  const [done, setDone] = useState(Boolean(invite.submittedAt))
  const [pending, startTransition] = useTransition()
  const date = new Date(invite.eventDate).toLocaleDateString(nl ? "nl-NL" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
  const labels = nl
    ? ["Slecht", "Matig", "Goed", "Erg goed", "Uitstekend"]
    : ["Poor", "Fair", "Good", "Very good", "Excellent"]

  function submit() {
    if (!rating) return setError(nl ? "Kies een aantal sterren." : "Choose a star rating.")
    if (comment.trim().length < 10)
      return setError(nl ? "Schrijf minimaal 10 tekens." : "Write at least 10 characters.")
    setError("")
    startTransition(async () => {
      const result = await submitReview(invite.token, { rating, comment }).catch(() => null)
      if (!result)
        return setError(
          nl
            ? "Versturen is niet gelukt. Je tekst staat er nog. Probeer opnieuw."
            : "Could not send. Your text is still here. Try again.",
        )
      if (result.ok) return setDone(true)
      setError(
        result.error === "used"
          ? nl ? "Deze review is al geplaatst." : "This review was already submitted."
          : nl ? "Controleer je review en probeer opnieuw." : "Check your review and try again.",
      )
    })
  }

  return (
    <main className="flex min-h-screen flex-col items-center bg-background px-4 py-10 font-sans text-foreground">
      <Link href="/" aria-label="ARSI Events" className="mb-10">
        <Image src="/arsi-logo.png" alt="ARSI Events" width={160} height={50} className="h-10 w-auto dark:hidden" />
        <Image src="/arsi-logo-dark.png" alt="ARSI Events" width={160} height={50} className="hidden h-10 w-auto dark:block" />
      </Link>
      <div className="flex w-full max-w-lg flex-col gap-6 rounded-2xl border bg-card p-6 sm:p-8">
        <header className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">
            {invite.eventName} · {date}
          </p>
          <h1 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {nl ? `Hoe was ${invite.professionalName}?` : `How was ${invite.professionalName}?`}
          </h1>
        </header>

        {done ? (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <CheckCircle2 className="size-10 text-brand" />
            <p className="font-medium">{nl ? "Bedankt voor je review!" : "Thank you for your review!"}</p>
            {invite.rating && <Stars rating={invite.rating} />}
            <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
              {nl
                ? "Je sterren tellen mee in de score op het profiel. Je tekst ziet de professional."
                : "Your stars count towards the score on the profile. The professional sees your text."}
            </p>
            <Button asChild variant="outline">
              <Link href="/account/reviews">{nl ? "Naar mijn reviews" : "Go to my reviews"}</Link>
            </Button>
          </div>
        ) : (
          <form
            className="flex flex-col gap-6"
            onSubmit={(e) => {
              e.preventDefault()
              submit()
            }}
          >
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 text-sm font-medium">{nl ? "Jouw beoordeling" : "Your rating"}</legend>
              <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <label key={n} className="cursor-pointer" onMouseEnter={() => setHover(n)}>
                    <input
                      type="radio"
                      name="rating"
                      value={n}
                      checked={rating === n}
                      onChange={() => setRating(n)}
                      className="peer sr-only"
                    />
                    <span className="sr-only">{`${n} - ${labels[n - 1]}`}</span>
                    <Star
                      aria-hidden
                      className={cn(
                        "size-9 rounded transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-ring",
                        n <= (hover || rating) ? "fill-brand text-brand" : "text-muted-foreground/40",
                      )}
                    />
                  </label>
                ))}
                <span className="ml-3 text-sm text-muted-foreground">{labels[(hover || rating) - 1] ?? ""}</span>
              </div>
            </fieldset>
            <div className="flex flex-col gap-2">
              <label htmlFor="review-comment" className="text-sm font-medium">
                {nl ? "Vertel over je ervaring" : "Tell us about your experience"}
              </label>
              <Textarea
                id="review-comment"
                rows={5}
                maxLength={2000}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={
                  nl
                    ? "Hoe was de sfeer, de communicatie en de professionaliteit?"
                    : "How were the atmosphere, communication and professionalism?"
                }
              />
              <p className="text-xs text-muted-foreground">{comment.length}/2000</p>
            </div>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <Button type="submit" variant="brand" size="lg" disabled={pending}>
              {pending ? (nl ? "Bezig..." : "Submitting...") : nl ? "Review plaatsen" : "Submit review"}
            </Button>
          </form>
        )}
      </div>
    </main>
  )
}
