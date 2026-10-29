import { UsersPageHeader } from "@/components/admin/page-headers"
import { UsersTable } from "@/components/admin/users-table"
import { listAdminUsers } from "@/lib/admin/users"

export const dynamic = "force-dynamic"

export default async function AdminUsersPage() {
  const users = await listAdminUsers()
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <UsersPageHeader kind="users" />
      <UsersTable users={users} />
    </div>
  )
}
