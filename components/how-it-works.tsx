"use client"

import { useEffect, useRef } from "react"
import { useLanguage } from "@/contexts/language-context"

export function HowItWorks() {
  const { t, language } = useLanguage()
  const nl = language === "nl"
  const sectionRef = useRef<HTMLElement>(null)

  // The homepage renders in the browser only, so the section does not exist yet when the
  // browser (or the router) looks for "#hoe-het-werkt" after coming from another page.
  useEffect(() => {
    if (window.location.hash === "#hoe-het-werkt") sectionRef.current?.scrollIntoView()
  }, [])

  return (
    <section ref={sectionRef} id="hoe-het-werkt" aria-labelledby="hoe-het-werkt-titel" className="scroll-mt-4 bg-background py-16">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 id="hoe-het-werkt-titel" className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">{nl ? "Hoe het werkt" : t.howItWorksTitle}</h2>
          <p className="text-lg text-muted-foreground">{nl ? "Boek artiesten, fotografen en videografen in drie eenvoudige stappen." : t.howItWorksSubtitle}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-muted p-8 rounded-lg">
            <div className="mb-4 text-4xl font-bold text-red-600" aria-hidden>1</div>
            <h3 className="text-xl font-semibold text-foreground mb-4">{nl ? "Kies de dienst die je nodig hebt" : t.step1Title}</h3>
            <p className="text-muted-foreground">{nl ? "Kies wie je zoekt: een artiest, fotograaf of videograaf." : t.step1Description}</p>
          </div>

          <div className="bg-muted p-8 rounded-lg">
            <div className="mb-4 text-4xl font-bold text-red-600" aria-hidden>2</div>
            <h3 className="text-xl font-semibold text-foreground mb-4">{nl ? "Gebruik filters om de juiste match te vinden" : t.step2Title}</h3>
            <p className="text-muted-foreground">{t.step2Description}</p>
          </div>

          <div className="bg-muted p-8 rounded-lg">
            <div className="mb-4 text-4xl font-bold text-red-600" aria-hidden>3</div>
            <h3 className="text-xl font-semibold text-foreground mb-4">{nl ? "Boek je favoriete professional" : t.step3Title}</h3>
            <p className="text-muted-foreground">{nl ? "Heb je je perfecte match gevonden? Klik op 'Boek Nu' en verstuur je aanvraag." : t.step3Description}</p>
          </div>
        </div>
      </div>
    </section>
  )
}
