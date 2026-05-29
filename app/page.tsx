import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { ServiceSelector } from "@/components/service-selector"
import { HowItWorks } from "@/components/how-it-works"
import { OurServices } from "@/components/our-services"
import { Footer } from "@/components/footer"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <HeroSection />
      <ServiceSelector />
      <HowItWorks />
      <OurServices />
      <Footer />
    </div>
  )
}
