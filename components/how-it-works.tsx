"use client"

import { useLanguage } from "@/contexts/language-context"

export function HowItWorks() {
  const { t } = useLanguage()

  return (
    <section className="py-16 bg-background">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-foreground mb-4">{t.howItWorksTitle}</h2>
          <p className="text-lg text-muted-foreground">{t.howItWorksSubtitle}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-muted p-8 rounded-lg">
            <div className="text-4xl font-bold text-red-600 mb-4">1</div>
            <h3 className="text-xl font-semibold text-foreground mb-4">{t.step1Title}</h3>
            <p className="text-muted-foreground">{t.step1Description}</p>
          </div>

          <div className="bg-muted p-8 rounded-lg">
            <div className="text-4xl font-bold text-red-600 mb-4">2</div>
            <h3 className="text-xl font-semibold text-foreground mb-4">{t.step2Title}</h3>
            <p className="text-muted-foreground">{t.step2Description}</p>
          </div>

          <div className="bg-muted p-8 rounded-lg">
            <div className="text-4xl font-bold text-red-600 mb-4">3</div>
            <h3 className="text-xl font-semibold text-foreground mb-4">{t.step3Title}</h3>
            <p className="text-muted-foreground">{t.step3Description}</p>
          </div>
        </div>
      </div>
    </section>
  )
}
