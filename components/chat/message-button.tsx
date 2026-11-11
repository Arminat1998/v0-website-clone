"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
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
  const [pending, startTransition] = useTransition()
  return (
    <Button
      variant={variant}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          if (bookingId) {
            const id = await openBookingConversation(bookingId)
            if (id) router.push(`/dashboard/chats?c=${id}`)
            return
          }
          const id = await openConversation(professionalId ?? null)
          router.push(`/account/berichten?c=${id}`)
        })
      }
    >
      <MessageSquare />
      {label}
    </Button>
  )
}
