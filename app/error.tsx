"use client"

import { Header } from "@/components/header"
import { PageError } from "@/components/page-error"
import { useLanguage } from "@/contexts/language-context"

export default function RootError({ retry }: { retry: () => void }) {
  const nl = useLanguage().language === "nl"
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-3xl px-4">
        <PageError retry={retry} backHref="/" backLabel={nl ? "Naar de homepage" : "Go to the homepage"} />
      </main>
    </div>
  )
}
