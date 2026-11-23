"use client"

import { PageError } from "@/components/page-error"
import { useLanguage } from "@/contexts/language-context"

export default function AdminError({ retry }: { retry: () => void }) {
  const nl = useLanguage().language === "nl"
  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <PageError retry={retry} backHref="/admin" backLabel={nl ? "Naar het overzicht" : "Go to the overview"} />
    </div>
  )
}
