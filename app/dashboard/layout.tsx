import type { ReactNode } from "react"
import { requireProfessionalUser } from "@/lib/session"

export const dynamic = "force-dynamic"

export default async function DashboardRouteLayout({ children }: { children: ReactNode }) {
  await requireProfessionalUser()
  return children
}
