"use client"

import Link from "next/link"
import { ArrowLeft, Printer } from "lucide-react"
import { useBookingT } from "@/lib/booking-i18n"
import { Button } from "@/components/ui/button"

export function PrintToolbar({ backHref }: { backHref: string }) {
  const { t } = useBookingT()
  return (
    <div className="mx-auto flex max-w-[210mm] items-center justify-between gap-3 px-4 py-4 print:hidden">
      <Link href={backHref} className="inline-flex items-center gap-2 text-sm text-paper-muted hover:text-paper-foreground">
        <ArrowLeft className="h-4 w-4" aria-hidden />
        {t.common.back}
      </Link>
      <Button onClick={() => window.print()} className="bg-red-600 text-white hover:bg-red-700">
        <Printer className="mr-2 h-4 w-4" aria-hidden />
        {t.invoice.print}
      </Button>
    </div>
  )
}
