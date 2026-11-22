"use client"

import { createContext, useContext, useState, useEffect, useSyncExternalStore, type ReactNode } from "react"
import type { Language, Translations } from "@/lib/i18n"
import { translations } from "@/lib/i18n"

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: Translations
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("nl")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Load saved language from localStorage
    const saved = localStorage.getItem("language") as Language
    if (saved && (saved === "nl" || saved === "en")) {
      setLanguageState(saved)
    }
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem("language", lang)
  }

  // Until mounted, always use the default language so the first client render
  // matches the server-rendered HTML and hydration stays consistent.
  const activeLanguage: Language = mounted ? language : "nl"

  // Screen readers pick their voice from this, so it follows the language of the interface.
  useEffect(() => {
    document.documentElement.lang = activeLanguage
  }, [activeLanguage])

  const value = {
    language: activeLanguage,
    setLanguage,
    t: translations[activeLanguage],
  }

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

const subscribeNoop = () => () => {}

export function useLanguage() {
  const context = useContext(LanguageContext)
  // Segments can hydrate after the provider has already switched language (streamed/Suspense
  // boundaries), so each consumer renders the server default until it has hydrated itself.
  const hydrated = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  )
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  if (!hydrated && context.language !== "nl") {
    return { ...context, language: "nl" as Language, t: translations.nl }
  }
  return context
}
