import type { Metadata } from "next"
import type { ReactNode } from "react"

export const metadata: Metadata = {
  title: "Artiesten boeken | ARSI Events",
  description: "Vind en boek DJ's, muzikanten en andere artiesten voor je evenement.",
}

export default function Layout({ children }: { children: ReactNode }) {
  return children
}
