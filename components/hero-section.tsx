"use client"

import { HeroSearch } from "./hero-search"
import { useLanguage } from "@/contexts/language-context"

export function HeroSection() {
  const { t } = useLanguage()

  return (
    <section suppressHydrationWarning className="relative min-h-[500px] sm:min-h-[600px] lg:h-[600px] flex items-center justify-center text-center text-white overflow-hidden">
      {/* Light mode background - visible when theme is light */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-opacity duration-700 ease-in-out opacity-100 dark:opacity-0"
        style={{ backgroundImage: "url('/brightmodus.png')" }}
        aria-hidden="true"
      />

      {/* Dark mode background - visible when theme is dark */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-opacity duration-700 ease-in-out opacity-0 dark:opacity-100"
        style={{ backgroundImage: "url('/darkmodus.png')" }}
        aria-hidden="true"
      />

      <div className="absolute inset-0 transition-colors duration-700 ease-in-out bg-black/50 dark:bg-black/30" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-0">
        <h1
          className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-3 sm:mb-4 text-balance drop-shadow-lg"
          style={{ textShadow: "0 2px 8px rgba(0,0,0,0.4)" }}
          suppressHydrationWarning
        >
          {t.heroTitle}
        </h1>
        <p
          className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/90 drop-shadow-lg text-balance mb-6 sm:mb-8"
          style={{ textShadow: "0 1px 4px rgba(0,0,0,0.3)" }}
          suppressHydrationWarning
        >
          {t.heroSubtitle}
        </p>

        <HeroSearch />
      </div>
    </section>
  )
}
