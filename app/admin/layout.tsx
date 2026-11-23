import type { ReactNode } from "react"
import { AdminSubmissionsProvider } from "@/contexts/admin-submissions-context"
import { AdminShell } from "@/components/admin/admin-shell"
import { loadSubmissions } from "@/lib/admin/submissions"
import { requireAdmin } from "@/lib/session"

export const dynamic = "force-dynamic"

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdmin()
  const submissions = await loadSubmissions()

  return (
    <AdminSubmissionsProvider initialSubmissions={submissions}>
      <AdminShell>{children}</AdminShell>
    </AdminSubmissionsProvider>
  )
}
