"use client"

import { useLanguage } from "@/contexts/language-context"
import { AccountHeading } from "@/components/account/account-common"
import { ChatInbox } from "@/components/chat/chat-inbox"
import type { InboxItem } from "@/app/actions/messages"

export function AccountMessages({ inbox, initialId }: { inbox: InboxItem[]; initialId?: number }) {
  const nl = useLanguage().language === "nl"
  return (
    <div className="flex flex-col gap-6">
      <AccountHeading
        title={nl ? "Berichten" : "Messages"}
        description={
          nl
            ? "Chat met je professionals of met de klantenservice van ARSI Events."
            : "Chat with your professionals or ARSI Events customer support."
        }
      />
      <ChatInbox initialInbox={inbox} initialId={initialId} canContactSupport />
    </div>
  )
}
