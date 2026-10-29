import { BlacklistManager } from "@/components/admin/blacklist-manager"
import { UsersPageHeader } from "@/components/admin/page-headers"
import { listBlacklist } from "@/lib/admin/users"

export const dynamic = "force-dynamic"

export default async function AdminBlacklistPage() {
  const entries = await listBlacklist()
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <UsersPageHeader kind="blacklist" />
      <BlacklistManager entries={entries} />
    </div>
  )
}
