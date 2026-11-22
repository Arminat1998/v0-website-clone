"use client"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useLanguage } from "@/contexts/language-context"
import type { Language } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"

/** On small screens only the flag shows; `showLabel` keeps the language name visible (in a menu). */
export function LanguageSwitcher({ showLabel = false }: { showLabel?: boolean }) {
  const { language, setLanguage } = useLanguage()

  const languages = [
    { code: "nl" as Language, label: "Nederlands", flag: "🇳🇱" },
    { code: "en" as Language, label: "English", flag: "🇬🇧" },
  ]

  const currentLanguage = languages.find((lang) => lang.code === language)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          aria-label={`${language === "nl" ? "Taal" : "Language"}: ${currentLanguage?.label}`}
          className="h-11 gap-1 px-2 font-medium text-foreground"
        >
          <span className="text-lg" aria-hidden>{currentLanguage?.flag}</span>
          <span className={showLabel ? "" : "hidden md:inline"}>{currentLanguage?.label}</span>
          <ChevronDown className="h-4 w-4" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            lang={lang.code}
            aria-current={language === lang.code ? "true" : undefined}
            className={cn(
              "min-h-11 sm:min-h-9",
              language === lang.code && "bg-red-50 font-medium text-red-700 dark:bg-red-950/30 dark:text-red-400",
            )}
          >
            <span aria-hidden>{lang.flag}</span> {lang.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
