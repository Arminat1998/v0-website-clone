"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/contexts/language-context"
import { openBookingConversation, openConversation } from "@/app/actions/messages"

/** Opens (or creates) the right thread and jumps to the inbox of the current role. */
export function MessageButton({
  label,
  professionalId,
  bookingId,
  variant = "default",
}: {
  label: string
  professionalId?: string
  bookingId?: number
  variant?: "default" | "outline"
}) {
  const router = useRouter()
  const nl = useLanguage().language === "nl"
  const [pending, startTransition] = useTransition()
  const [failed, setFailed] = useState(false)

  function open() {
    setFailed(false)
    startTransition(async () => {
      try {
        const id = bookingId ? await openBookingConversation(bookingId) : await openConversation(professionalId ?? null)
        if (id) router.push(bookingId ? `/dashboard/chats?c=${id}` : `/account/berichten?c=${id}`)
        else setFailed(true)
      } catch {
        setFailed(true)
      }
    })
  }

  return (
    <div className="flex flex-col gap-2">
      <Button variant={variant} className="min-h-11" disabled={pending} onClick={open}>
        <MessageSquare />
        {label}
      </Button>
      {failed && (
        <p role="alert" className="text-sm text-red-700 dark:text-red-400">
          {nl ? "Het gesprek kon niet worden geopend. Probeer opnieuw." : "Could not open the conversation. Try again."}
        </p>
      )}
    </div>
  )
}
