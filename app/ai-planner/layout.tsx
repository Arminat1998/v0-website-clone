import type { Metadata } from "next"
import type { ReactNode } from "react"

export const metadata: Metadata = {
  title: "AI-eventplanner | ARSI Events",
  description: "Laat je evenement plannen met hulp van AI.",
}

export default function Layout({ children }: { children: ReactNode }) {
  return children
}
