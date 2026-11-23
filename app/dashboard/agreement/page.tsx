"use client"

import { FileText } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { AccountEmpty, AccountHeading } from "@/components/account/account-common"
import { Card, CardContent } from "@/components/ui/card"
import { useLanguage } from "@/contexts/language-context"

/** Reachable through old links only. There is nothing to agree to until the text has been approved. */
export default function AgreementPage() {
  const nl = useLanguage().language === "nl"

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 p-4 sm:p-8 lg:p-10">
        <AccountHeading
          title={nl ? "Overeenkomst" : "Agreement"}
          description={nl ? "De overeenkomst tussen jou en ARSI Events." : "The agreement between you and ARSI Events."}
        />
        <Card>
          <CardContent>
            <AccountEmpty
              icon={FileText}
              title={nl ? "De overeenkomst volgt" : "The agreement will follow"}
              description={nl ? "Je hoeft nu niets te doen." : "There is nothing you need to do right now."}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
