import type { Metadata } from "next"
import type { ReactNode } from "react"

export const metadata: Metadata = { title: "Boeken | ARSI Events" }

export default function Layout({ children }: { children: ReactNode }) {
  return children
}
