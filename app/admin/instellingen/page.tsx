import { redirect } from "next/navigation"
import { requireAdmin } from "@/lib/session"

/** There is nothing to set yet; old links end up on the overview. */
export default async function SettingsPage() {
  await requireAdmin()
  redirect("/admin")
}
