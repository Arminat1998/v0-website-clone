import { AuditLog } from "@/components/admin/audit-log"
import { UsersPageHeader } from "@/components/admin/page-headers"
import { listAuditLog } from "@/lib/admin/users"

export const dynamic = "force-dynamic"

export default async function AdminActivityPage() {
  const entries = await listAuditLog()
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <UsersPageHeader kind="activity" />
      <AuditLog entries={entries} />
    </div>
  )
}
