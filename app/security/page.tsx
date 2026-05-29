"use client"
import { Header } from "@/components/header"
import { useLanguage } from "@/contexts/language-context"

export default function SecurityPage() {
  const { t } = useLanguage()

  return (
    <div className="min-h-screen bg-background transition-colors">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            {t.securityService}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Professional security guards for safe and secure events.
          </p>
        </div>

        <div className="bg-card rounded-lg shadow-md border border-border p-8 sm:p-12 text-center">
          <h2 className="text-2xl font-semibold text-foreground mb-4">
            Coming Soon
          </h2>
          <p className="text-muted-foreground">
            We're working on bringing you the best security services. Check back soon!
          </p>
        </div>
      </div>
    </div>
  )
}
