"use client"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useLanguage } from "@/contexts/language-context"
import type { Language } from "@/lib/i18n"
import { ChevronDown } from "lucide-react"
import { useEffect, useState } from "react"

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const languages = [
    { code: "nl" as Language, label: "Nederlands", flag: "🇳🇱" },
    { code: "en" as Language, label: "English", flag: "🇬🇧" },
  ]

  // Until mounted, render the server-default language to avoid hydration mismatch
  const currentLanguage = languages.find((lang) => lang.code === (mounted ? language : "nl"))

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="font-medium text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 gap-1 px-2"
        >
          <span className="text-lg">{currentLanguage?.flag}</span>
          <span className="hidden sm:inline">{currentLanguage?.label}</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={
              language === lang.code ? "bg-red-50 text-red-600 font-medium dark:bg-red-950/30 dark:text-red-400" : ""
            }
          >
            {lang.flag} {lang.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
