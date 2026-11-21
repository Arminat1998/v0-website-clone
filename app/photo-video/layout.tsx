import type { Metadata } from "next"
import type { ReactNode } from "react"

export const metadata: Metadata = {
  title: "Fotografen en videografen boeken | ARSI Events",
  description: "Vind en boek fotografen en videografen voor je evenement.",
}

export default function Layout({ children }: { children: ReactNode }) {
  return children
}
