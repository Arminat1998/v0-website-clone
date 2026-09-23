"use client"

import type { ReactNode } from "react"
import { AdminSubmissionsProvider } from "@/contexts/admin-submissions-context"
import { AdminShell } from "@/components/admin/admin-shell"

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminSubmissionsProvider>
      <AdminShell>{children}</AdminShell>
    </AdminSubmissionsProvider>
  )
}
