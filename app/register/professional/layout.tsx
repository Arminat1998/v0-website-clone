import type { Metadata } from "next"
import type { ReactNode } from "react"

export const metadata: Metadata = {
  title: "Aanmelden als professional | ARSI Events",
  description: "Meld je aan als artiest, fotograaf of videograaf op ARSI Events.",
}

export default function Layout({ children }: { children: ReactNode }) {
  return children
}
