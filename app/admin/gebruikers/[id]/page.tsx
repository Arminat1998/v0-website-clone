import { notFound } from "next/navigation"
import { UserDetail } from "@/components/admin/user-detail"
import { getAdminUserDetail } from "@/lib/admin/users"

export const dynamic = "force-dynamic"

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const detail = await getAdminUserDetail(id)
  if (!detail) notFound()
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <UserDetail {...detail} />
    </div>
  )
}
