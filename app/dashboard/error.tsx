"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { PageError } from "@/components/page-error"
import { useLanguage } from "@/contexts/language-context"

export default function DashboardError({ retry }: { retry: () => void }) {
  const nl = useLanguage().language === "nl"
  return (
    <DashboardLayout>
      <div className="px-4 sm:px-8 lg:px-10">
        <PageError retry={retry} backHref="/dashboard" backLabel={nl ? "Naar je dashboard" : "Go to your dashboard"} />
      </div>
    </DashboardLayout>
  )
}
