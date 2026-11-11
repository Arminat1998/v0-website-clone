import { ChatInbox } from "@/components/chat/chat-inbox"
import { getInbox } from "@/app/actions/messages"
import { requireAdmin } from "@/lib/session"

export default async function AdminMessagesPage({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  await requireAdmin()
  const c = Number((await searchParams).c)
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Support</h1>
      <ChatInbox initialInbox={await getInbox()} initialId={Number.isSafeInteger(c) && c > 0 ? c : undefined} />
    </div>
  )
}
