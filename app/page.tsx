"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { ServiceSelector } from "@/components/service-selector"
import { HowItWorks } from "@/components/how-it-works"
import { OurServices } from "@/components/our-services"
import { Footer } from "@/components/footer"

export default function HomePage() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setReady(true)
  }, [])

  if (!ready) {
    return <main className="min-h-screen bg-background" aria-busy="true" />
  }

  return (
    <main className="min-h-screen bg-background">
      <Header />
      <HeroSection />
      <ServiceSelector />
      <HowItWorks />
      <OurServices />
      <Footer />
    </main>
  )
}
