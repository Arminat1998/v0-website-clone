import { Header } from "@/components/header"
import type { Metadata } from "next"
import { NotFoundContent } from "@/components/not-found-content"

export const metadata: Metadata = { title: "Pagina niet gevonden | ARSI Events" }

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <NotFoundContent />
    </div>
  )
}
