"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Mail, CalendarCheck, Star, FileText } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

export default function DashboardPage() {
  const { t } = useLanguage()
  
  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 lg:p-10 bg-background min-h-screen">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-6 md:mb-8 text-foreground">{t.welcomeToDashboard}</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
          {/* New Messages Card */}
          <div className="bg-card rounded-lg border border-border p-5 md:p-6 flex items-center gap-4 hover:bg-accent transition-colors">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Mail className="w-5 h-5 md:w-6 md:h-6 text-blue-500" />
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-bold text-foreground">3</div>
              <div className="text-sm md:text-base text-muted-foreground">{t.newMessages}</div>
            </div>
          </div>

          {/* New Booking Requests Card */}
          <div className="bg-card rounded-lg border border-border p-5 md:p-6 flex items-center gap-4 hover:bg-accent transition-colors">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-green-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <CalendarCheck className="w-5 h-5 md:w-6 md:h-6 text-green-500" />
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-bold text-foreground">2</div>
              <div className="text-sm md:text-base text-muted-foreground">{t.newBookingRequests}</div>
            </div>
          </div>

          {/* New Review Card */}
          <div className="bg-card rounded-lg border border-border p-5 md:p-6 flex items-center gap-4 hover:bg-accent transition-colors">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-amber-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Star className="w-5 h-5 md:w-6 md:h-6 text-amber-500 fill-amber-500" />
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-bold text-foreground">1</div>
              <div className="text-sm md:text-base text-muted-foreground">{t.newReview}</div>
            </div>
          </div>

          {/* Action Needed Card */}
          <div className="bg-card rounded-lg border border-red-500/20 p-5 md:p-6 flex items-center gap-4 hover:bg-accent transition-colors">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-red-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 md:w-6 md:h-6 text-red-500" />
            </div>
            <div>
              <div className="text-lg md:text-xl font-semibold text-red-500">{t.actionNeeded}</div>
              <div className="text-sm md:text-base text-muted-foreground">{t.agreementNotAccepted}</div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
