"use client"

import Link from "next/link"
import { Star } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { Button } from "@/components/ui/button"
import type { ReviewInvite } from "@/app/actions/reviews"
import { cn } from "@/lib/utils"

export function Stars({ rating, className }: { rating: number; className?: string }) {
  return (
    <span className={cn("flex items-center gap-0.5", className)} role="img" aria-label={`${rating} / 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} aria-hidden className={cn("size-4", n <= rating ? "fill-brand text-brand" : "text-muted-foreground/40")} />
      ))}
    </span>
  )
}

export function AccountReviews({ reviews }: { reviews: ReviewInvite[] }) {
  const nl = useLanguage().language === "nl"
  const pending = reviews.filter((r) => !r.submittedAt)
  const done = reviews.filter((r) => r.submittedAt)
  const date = (d: string) => new Date(d).toLocaleDateString(nl ? "nl-NL" : "en-GB", { day: "numeric", month: "long", year: "numeric" })

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{nl ? "Mijn reviews" : "My reviews"}</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {nl
            ? "Na elk afgerond evenement vragen we je om een review. Zo helpen je andere klanten bij hun keuze."
            : "After every completed event we ask for your review, so other customers can choose with confidence."}
        </p>
      </header>

      <section className="flex flex-col gap-3" aria-labelledby="reviews-open">
        <h2 id="reviews-open" className="font-semibold">
          {nl ? "Te beoordelen" : "Awaiting your review"} ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <p className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
            {nl ? "Je hebt geen openstaande reviews." : "You have no reviews to write."}
          </p>
        ) : (
          pending.map((r) => (
            <article key={r.token} className="flex flex-col gap-4 rounded-xl border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-1">
                <p className="font-medium">{r.professionalName}</p>
                <p className="text-sm text-muted-foreground">
                  {r.eventName} · {date(r.eventDate)}
                </p>
              </div>
              <Button variant="brand" asChild>
                <Link href={`/review/${r.token}`}>{nl ? "Review schrijven" : "Write review"}</Link>
              </Button>
            </article>
          ))
        )}
      </section>

      {done.length > 0 && (
        <section className="flex flex-col gap-3" aria-labelledby="reviews-done">
          <h2 id="reviews-done" className="font-semibold">
            {nl ? "Verstuurd" : "Sent"} ({done.length})
          </h2>
          {done.map((r) => (
            <article key={r.token} className="flex flex-col gap-3 rounded-xl border bg-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">{r.professionalName}</p>
                <Stars rating={r.rating ?? 0} />
              </div>
              <p className="text-sm text-muted-foreground">
                {r.eventName} · {date(r.eventDate)}
              </p>
              <p className="text-sm leading-relaxed">{r.comment}</p>
              {r.reply && (
                <div className="rounded-lg bg-accent p-4 text-sm leading-relaxed">
                  <p className="mb-1 font-medium">
                    {nl ? "Reactie van" : "Reply from"} {r.professionalName}
                  </p>
                  <p className="text-muted-foreground">{r.reply}</p>
                </div>
              )}
            </article>
          ))}
        </section>
      )}
    </div>
  )
}
