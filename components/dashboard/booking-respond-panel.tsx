"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Check, Loader2, X } from "lucide-react"
import { acceptBooking, rejectBooking } from "@/app/actions/bookings"
import { useBookingT } from "@/lib/booking-i18n"
import { Button } from "@/components/ui/button"

type Mode = "idle" | "accept" | "reject"

export function BookingRespondPanel({ bookingId, expired = false, photo = false }: { bookingId: number; expired?: boolean; photo?: boolean }) {
  const { t, language } = useBookingT()
  const nl = language !== "en"
  const router = useRouter()
  const [mode, setMode] = useState<Mode>("idle")
  const [message, setMessage] = useState("")
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState("")

  const errorText = (code: "NOT_FOUND" | "DATE_PASSED" | "DATE_TAKEN", blocked = false) =>
    code === "DATE_TAKEN" && blocked
      ? nl
        ? "Je hebt deze datum zelf geblokkeerd. Maak hem vrij in je kalender om deze aanvraag te accepteren."
        : "You blocked this date yourself. Free it in your calendar to accept this request."
      : code === "DATE_TAKEN"
      ? nl
        ? "Je hebt op deze datum al een geaccepteerde boeking. Wijs deze aanvraag af of neem contact op met de klant."
        : "You already have an accepted booking on this date. Decline this request or contact the customer."
      : code === "DATE_PASSED"
        ? nl
          ? "Deze datum is al voorbij. Je kunt deze aanvraag niet meer accepteren."
          : "This date has already passed. You can no longer accept this request."
        : nl
          ? "Deze aanvraag is niet meer open. Ververs de pagina."
          : "This request is no longer open. Refresh the page."

  const submit = () => {
    if (mode === "idle") return
    startTransition(async () => {
      setError("")
      try {
        const result = mode === "accept" ? await acceptBooking(bookingId, message) : await rejectBooking(bookingId, message)
        if (!result.ok) {
          setError(errorText(result.error, "blocked" in result && result.blocked))
          return
        }
      } catch {
        setError(nl ? "Versturen is niet gelukt. Probeer het opnieuw." : "Sending failed. Please try again.")
        return
      }
      router.refresh()
    })
  }

  return (
    <section aria-labelledby="respond-heading" className="rounded-xl border border-border bg-card p-5 shadow-sm md:p-6">
      <h2 id="respond-heading" className="text-base font-semibold text-foreground">
        {t.detail.respondTitle}
      </h2>
      <p id="respond-note" className="mt-1 text-sm text-muted-foreground">
        {expired ? t.detail.expiredNote : t.detail.respondNote}
      </p>

      {mode === "idle" ? (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <Button
            onClick={() => setMode("accept")}
            disabled={expired}
            aria-describedby="respond-note"
            className="flex-1 bg-green-700 text-white hover:bg-green-800"
          >
            <Check className="mr-2 h-4 w-4" aria-hidden />
            {t.requests.accept}
          </Button>
          <Button onClick={() => setMode("reject")} variant="outline" className="flex-1 border-border text-foreground hover:bg-accent">
            <X className="mr-2 h-4 w-4" aria-hidden />
            {t.requests.reject}
          </Button>
        </div>
      ) : (
        <form
          className="mt-4 flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault()
            submit()
          }}
        >
          <label className="flex flex-col gap-2 text-sm font-medium text-foreground">
            {mode === "accept" ? t.detail.acceptMessageLabel : t.detail.rejectMessageLabel}
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={4}
              required={mode === "reject"}
              placeholder={mode === "accept" ? (photo ? t.detail.acceptPlaceholderPhoto : t.detail.acceptPlaceholder) : t.detail.rejectPlaceholder}
              className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm font-normal text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </label>
          {error && (
            <p role="alert" className="text-sm text-red-700 dark:text-red-400">
              {error}
            </p>
          )}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              type="submit"
              disabled={isPending}
              className={mode === "accept" ? "flex-1 bg-green-700 text-white hover:bg-green-800" : "flex-1 bg-red-700 text-white hover:bg-red-600"}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                  {t.detail.sending}
                </>
              ) : mode === "accept" ? (
                t.detail.confirmAccept
              ) : (
                t.detail.confirmReject
              )}
            </Button>
            <Button type="button" variant="ghost" disabled={isPending} onClick={() => { setMode("idle"); setError("") }} className="text-foreground">
              {t.detail.cancel}
            </Button>
          </div>
        </form>
      )}
    </section>
  )
}
