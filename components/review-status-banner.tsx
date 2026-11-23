"use client"

import Link from "next/link"
import { Clock, Info, XCircle } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { MISSING_POINTS, missingLabel, type MissingPoint } from "@/lib/review-points"

export type ProfileReview = { status: string; message: string | null; missing: MissingPoint[] } | null

/** Tells a professional where the admin screening of their profile stands. Hidden once the profile is approved. */
export function ReviewStatusBanner({ review }: { review: ProfileReview }) {
  const { language } = useLanguage()
  const nl = language === "nl"
  if (review?.status === "goedgekeurd") return null

  let Icon = Clock
  let title = nl ? "Je profiel wordt beoordeeld" : "Your profile is being reviewed"
  let text = nl
    ? "ARSI Events controleert je aanmelding. Na goedkeuring sta je in het overzicht en kun je geboekt worden."
    : "ARSI Events is checking your application. Once approved, you appear in the overview and can be booked."
  let missing: MissingPoint[] = []
  let link: { href: string; label: string } | null = null

  if (!review) {
    Icon = Info
    title = nl ? "Je profiel is nog niet ingevuld" : "Your profile is not complete yet"
    text = nl
      ? "Vul je profiel in. Daarna beoordeelt ARSI Events je aanmelding."
      : "Complete your profile. ARSI Events then reviews your application."
    link = { href: "/register/professional", label: nl ? "Profiel invullen" : "Complete profile" }
  } else if (review.status === "wacht-op-aanvulling") {
    Icon = Info
    title = nl ? "ARSI Events vraagt om een aanvulling" : "ARSI Events asks for more information"
    missing = review.missing
    text =
      review.message ||
      (missing.length
        ? nl
          ? "Vul deze punten aan:"
          : "Please add these points:"
        : nl
          ? "Werk je profiel bij en sla het opnieuw op."
          : "Update your profile and save it again.")
    link = { href: "/dashboard/edit-profile", label: nl ? "Profiel bijwerken" : "Update profile" }
  } else if (review.status === "afgewezen") {
    Icon = XCircle
    title = nl ? "Je aanmelding is afgewezen" : "Your application was declined"
    text = review.message || (nl ? "Je profiel staat niet in het overzicht." : "Your profile is not listed in the overview.")
  }

  return (
    <div role="status" className="flex flex-col gap-3 border-b border-border bg-muted px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-5 w-5 flex-shrink-0 text-foreground" aria-hidden="true" />
        <div>
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="whitespace-pre-wrap break-words text-sm text-muted-foreground">{text}</p>
          {missing.length > 0 && (
            <>
              <ul className="mt-1 flex flex-col">
                {missing.map((key) => (
                  <li key={key}>
                    <Link
                      href={MISSING_POINTS[key].href}
                      className="inline-flex min-h-11 items-center text-sm font-medium text-foreground underline underline-offset-4 sm:min-h-8"
                    >
                      {missingLabel(key, nl)}
                      <span className="sr-only">
                        {MISSING_POINTS[key].href === "/dashboard/my-page"
                          ? nl ? " (Mijn website)" : " (My website)"
                          : nl ? " (Profiel bewerken)" : " (Edit profile)"}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="text-sm text-muted-foreground">
                {nl
                  ? "Klaar? Sla je profiel opnieuw op, dan gaat het terug naar ARSI Events."
                  : "Done? Save your profile again and it goes back to ARSI Events."}
              </p>
            </>
          )}
        </div>
      </div>
      {link && (
        <Link href={link.href} className="text-sm font-medium text-foreground underline underline-offset-4">
          {link.label}
        </Link>
      )}
    </div>
  )
}
