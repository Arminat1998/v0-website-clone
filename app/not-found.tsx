import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import type { Metadata } from "next"
import { NotFoundContent } from "@/components/not-found-content"

export const metadata: Metadata = { title: "Pagina niet gevonden | ARSI Events" }

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <NotFoundContent />
      <Footer />
    </div>
  )
}
