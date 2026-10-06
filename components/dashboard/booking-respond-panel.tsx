"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Check, Loader2, X } from "lucide-react"
import { acceptBooking, rejectBooking } from "@/app/actions/bookings"
import { useBookingT } from "@/lib/booking-i18n"
import { Button } from "@/components/ui/button"

type Mode = "idle" | "accept" | "reject"

export function BookingRespondPanel({ bookingId }: { bookingId: number }) {
  const { t } = useBookingT()
  const router = useRouter()
  const [mode, setMode] = useState<Mode>("idle")
  const [message, setMessage] = useState("")
  const [isPending, startTransition] = useTransition()

  const submit = () => {
    if (mode === "idle") return
    startTransition(async () => {
      if (mode === "accept") await acceptBooking(bookingId, message)
      else await rejectBooking(bookingId, message)
      router.refresh()
    })
  }

  return (
    <section aria-labelledby="respond-heading" className="rounded-lg border border-border bg-card p-5 md:p-6">
      <h2 id="respond-heading" className="text-base font-semibold text-foreground">
        {t.detail.respondTitle}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">{t.detail.respondNote}</p>

      {mode === "idle" ? (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <Button onClick={() => setMode("accept")} className="flex-1 bg-green-600 text-white hover:bg-green-700">
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
              placeholder={mode === "accept" ? t.detail.acceptPlaceholder : t.detail.rejectPlaceholder}
              className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm font-normal text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              type="submit"
              disabled={isPending}
              className={mode === "accept" ? "flex-1 bg-green-600 text-white hover:bg-green-700" : "flex-1 bg-red-600 text-white hover:bg-red-700"}
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
            <Button type="button" variant="ghost" disabled={isPending} onClick={() => setMode("idle")} className="text-foreground">
              {t.detail.cancel}
            </Button>
          </div>
        </form>
      )}
    </section>
  )
}
