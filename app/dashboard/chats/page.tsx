import { DashboardLayout } from "@/components/dashboard-layout"
import { ChatHeading, ChatInbox } from "@/components/chat/chat-inbox"
import { getInbox } from "@/app/actions/messages"
import { requireProfessionalUser } from "@/lib/session"

export default async function ChatsPage({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  await requireProfessionalUser()
  const c = Number((await searchParams).c)
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <ChatHeading audience="professional" />
        <ChatInbox startsFromBooking initialInbox={await getInbox()} initialId={Number.isSafeInteger(c) && c > 0 ? c : undefined} />
      </div>
    </DashboardLayout>
  )
}
